const Event = require('../models/Event');
const Speaker = require('../models/Speaker');
const externalDataService = require('../services/externalDataService');
const { buildEventXml } = require('../utils/eventXmlBuilder');

const populateSpeakers = (query) => {
  if (query && typeof query.populate === 'function') {
    return query.populate('ids_ponentes');
  }

  return query;
};

const populateEventDocument = async (event) => {
  if (event && typeof event.populate === 'function') {
    return event.populate('ids_ponentes');
  }

  return event;
};

const normalizeSpeakerIds = (speakerIds = []) => {
  if (!Array.isArray(speakerIds)) {
    return [];
  }

  return [...new Set(speakerIds.map((id) => String(id)))];
};

const createEventController = (EventModel, SpeakerModel, externalService = externalDataService) => {
  const handleError = (res, error) => {
    const status = error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500;
    return res.status(status).json({ error: error.message });
  };

  const validateSpeakersExist = async (speakerIds) => {
    const uniqueSpeakerIds = normalizeSpeakerIds(speakerIds);

    if (!uniqueSpeakerIds.length) {
      return true;
    }

    const existingSpeakers = await SpeakerModel.countDocuments({
      _id: { $in: uniqueSpeakerIds },
    });

    return existingSpeakers === uniqueSpeakerIds.length;
  };

  const enrichExternalData = async (location) => externalService.getExternalDataForLocation(location);

  const buildEventPayload = async (body) => ({
    ...body,
    ids_ponentes: normalizeSpeakerIds(body.ids_ponentes),
    external_data: await enrichExternalData(body.lugar),
  });

  const getEvents = async (req, res) => {
    try {
      const events = await populateSpeakers(EventModel.find());
      return res.json(events);
    } catch (error) {
      return handleError(res, error);
    }
  };

  const getEventById = async (req, res) => {
    try {
      const event = await populateSpeakers(EventModel.findById(req.params.id));

      if (!event) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      return res.type('application/xml').send(buildEventXml(event));
    } catch (error) {
      return handleError(res, error);
    }
  };

  const createEvent = async (req, res) => {
    try {
      const speakerIds = normalizeSpeakerIds(req.body.ids_ponentes);
      const speakersExist = await validateSpeakersExist(speakerIds);

      if (!speakersExist) {
        return res.status(400).json({ error: 'Algunos ponentes no existen' });
      }

      const payload = await buildEventPayload({
        ...req.body,
        ids_ponentes: speakerIds,
      });
      const event = new EventModel(payload);
      const savedEvent = await event.save();
      const populatedEvent = await populateEventDocument(savedEvent);
      return res.status(201).json(populatedEvent);
    } catch (error) {
      return handleError(res, error);
    }
  };

  const updateEvent = async (req, res) => {
    try {
      const payload = { ...req.body };

      if (Object.prototype.hasOwnProperty.call(payload, 'ids_ponentes')) {
        payload.ids_ponentes = normalizeSpeakerIds(payload.ids_ponentes);
        const speakersExist = await validateSpeakersExist(payload.ids_ponentes);

        if (!speakersExist) {
          return res.status(400).json({ error: 'Algunos ponentes no existen' });
        }
      }

      if (Object.prototype.hasOwnProperty.call(payload, 'lugar')) {
        payload.external_data = await enrichExternalData(payload.lugar);
      }

      const event = await EventModel.findByIdAndUpdate(req.params.id, payload, {
        new: true,
        runValidators: true,
      });

      if (!event) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      const populatedEvent = await populateEventDocument(event);
      return res.json(populatedEvent);
    } catch (error) {
      return handleError(res, error);
    }
  };

  const deleteEvent = async (req, res) => {
    try {
      const event = await EventModel.findByIdAndDelete(req.params.id);

      if (!event) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      return res.status(204).send();
    } catch (error) {
      return handleError(res, error);
    }
  };

  return {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
  };
};

module.exports = {
  ...createEventController(Event, Speaker),
  createEventController,
};
