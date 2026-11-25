const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true }, // e.g. "MERN Resume"
    roleType: {
      type: String,
      enum: ['fullstack', 'agent', 'general'],
      default: 'general',
    },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
