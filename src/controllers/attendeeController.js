const Attendee = require('../models/Attendee');
const Event = require('../models/Event');

const createAttendeeController = (AttendeeModel, EventModel) => {
  const handleError = (res, error) => {
    const status = error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500;
    return res.status(status).json({ error: error.message });
  };

  const ensureEventExists = async (eventId) => {
    if (!eventId) {
      return false;
    }

    const event = await EventModel.findById(eventId);
    return Boolean(event);
  };

  const addAttendeeToEvent = async (eventId, attendeeId) => EventModel.findByIdAndUpdate(eventId, {
    $addToSet: { ids_asistentes: attendeeId },
  });

  const removeAttendeeFromEvent = async (eventId, attendeeId) => EventModel.findByIdAndUpdate(eventId, {
    $pull: { ids_asistentes: attendeeId },
  });

  const getAttendees = async (req, res) => {
    try {
      const page = Math.max(Number.parseInt(req.query?.page, 10) || 1, 1);
      const limit = Math.max(Number.parseInt(req.query?.limit, 10) || 20, 1);
      const skip = (page - 1) * limit;
      const filter = {};

      if (req.query?.grado) {
        filter.grado = req.query.grado;
      }

      if (req.query?.event_id) {
        filter.event_id = req.query.event_id;
      }

      const [total, attendees] = await Promise.all([
        AttendeeModel.countDocuments(filter),
        AttendeeModel.find(filter).skip(skip).limit(limit),
      ]);

      return res.json({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data: attendees,
      });
    } catch (error) {
      return handleError(res, error);
    }
  };

  const getAttendeeById = async (req, res) => {
    try {
      const attendee = await AttendeeModel.findById(req.params.id);

      if (!attendee) {
        return res.status(404).json({ error: 'Asistente no encontrado' });
      }

      return res.json(attendee);
    } catch (error) {
      return handleError(res, error);
    }
  };

  const createAttendee = async (req, res) => {
    try {
      const eventExists = await ensureEventExists(req.body.event_id);

      if (!eventExists) {
        return res.status(400).json({ error: 'Evento no encontrado' });
      }

      const attendee = new AttendeeModel(req.body);
      const savedAttendee = await attendee.save();
      await addAttendeeToEvent(savedAttendee.event_id, savedAttendee._id);

      return res.status(201).json(savedAttendee);
    } catch (error) {
      return handleError(res, error);
    }
  };

  const updateAttendee = async (req, res) => {
    try {
      const attendee = await AttendeeModel.findById(req.params.id);

      if (!attendee) {
        return res.status(404).json({ error: 'Asistente no encontrado' });
      }

      const previousEventId = String(attendee.event_id);
      const nextEventId = req.body.event_id ? String(req.body.event_id) : previousEventId;
      const eventChanged = nextEventId !== previousEventId;

      if (eventChanged) {
        const eventExists = await ensureEventExists(nextEventId);

        if (!eventExists) {
          return res.status(400).json({ error: 'Evento no encontrado' });
        }
      }

      const updatedAttendee = await AttendeeModel.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (eventChanged) {
        await removeAttendeeFromEvent(previousEventId, updatedAttendee._id);
        await addAttendeeToEvent(nextEventId, updatedAttendee._id);
      }

      return res.json(updatedAttendee);
    } catch (error) {
      return handleError(res, error);
    }
  };

  const deleteAttendee = async (req, res) => {
    try {
      const attendee = await AttendeeModel.findByIdAndDelete(req.params.id);

      if (!attendee) {
        return res.status(404).json({ error: 'Asistente no encontrado' });
      }

      await removeAttendeeFromEvent(attendee.event_id, attendee._id);

      return res.status(204).send();
    } catch (error) {
      return handleError(res, error);
    }
  };

  return {
    getAttendees,
    getAttendeeById,
    createAttendee,
    updateAttendee,
    deleteAttendee,
  };
};

module.exports = {
  ...createAttendeeController(Attendee, Event),
  createAttendeeController,
};
