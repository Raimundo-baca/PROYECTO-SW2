const mongoose = require('mongoose');

const speakerSchema = new mongoose.Schema(
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
    departamento: {
      type: String,
      trim: true,
      default: '',
    },
    especialidad: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Speaker', speakerSchema);
