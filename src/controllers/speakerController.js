const Speaker = require('../models/Speaker');

const createSpeakerController = (SpeakerModel) => {
  const handleError = (res, error) => {
    const status = error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500;
    return res.status(status).json({ error: error.message });
  };

  const getSpeakers = async (req, res) => {
    try {
      const speakers = await SpeakerModel.find();
      return res.json(speakers);
    } catch (error) {
      return handleError(res, error);
    }
  };

  const getSpeakerById = async (req, res) => {
    try {
      const speaker = await SpeakerModel.findById(req.params.id);

      if (!speaker) {
        return res.status(404).json({ error: 'Ponente no encontrado' });
      }

      return res.json(speaker);
    } catch (error) {
      return handleError(res, error);
    }
  };

  const createSpeaker = async (req, res) => {
    try {
      const speaker = new SpeakerModel(req.body);
      const savedSpeaker = await speaker.save();
      return res.status(201).json(savedSpeaker);
    } catch (error) {
      return handleError(res, error);
    }
  };

  const updateSpeaker = async (req, res) => {
    try {
      const speaker = await SpeakerModel.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!speaker) {
        return res.status(404).json({ error: 'Ponente no encontrado' });
      }

      return res.json(speaker);
    } catch (error) {
      return handleError(res, error);
    }
  };

  const deleteSpeaker = async (req, res) => {
    try {
      const speaker = await SpeakerModel.findByIdAndDelete(req.params.id);

      if (!speaker) {
        return res.status(404).json({ error: 'Ponente no encontrado' });
      }

      return res.status(204).send();
    } catch (error) {
      return handleError(res, error);
    }
  };

  return {
    getSpeakers,
    getSpeakerById,
    createSpeaker,
    updateSpeaker,
    deleteSpeaker,
  };
};

module.exports = {
  ...createSpeakerController(Speaker),
  createSpeakerController,
};
