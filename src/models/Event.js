const mongoose = require('mongoose');

const externalDataSchema = new mongoose.Schema(
  {
    available: {
      type: Boolean,
      default: false,
    },
    coordinates: {
      lat: Number,
      lon: Number,
      source: String,
    },
    weather: {
      temperature: Number,
      wind_speed: Number,
      source: String,
    },
    error: String,
  },
  {
    _id: false,
    strict: false,
  },
);

const eventSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
      default: '',
    },
    fecha: {
      type: Date,
      required: true,
    },
    lugar: {
      type: String,
      required: true,
      trim: true,
    },
    ids_ponentes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Speaker',
      },
    ],
    ids_asistentes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendee',
      },
    ],
    external_data: {
      type: externalDataSchema,
      default: () => ({ available: false }),
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Event', eventSchema);
