const mongoose = require('mongoose');

// Single document holding your profile + follow-up rules
const settingsSchema = new mongoose.Schema(
  {
    yourName: { type: String, default: 'Boddu Shivasai' },
    phone: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },

    followUp1AfterDays: { type: Number, default: 2 },
    followUp2AfterDays: { type: Number, default: 5 }, // days after the first mail
    dailySendLimit: { type: Number, default: 25 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
