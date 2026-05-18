const mongoose = require('mongoose');

const attendeeSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    grado: {
      type: String,
      trim: true,
      default: '',
    },
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Attendee', attendeeSchema);
