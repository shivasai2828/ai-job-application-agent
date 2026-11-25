const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['application', 'follow_up_1', 'follow_up_2'],
      required: true,
    },
    roleType: {
      type: String,
      enum: ['fullstack', 'agent', 'general'],
      default: 'general',
    },
    // Variables: {{hr_name}} {{company}} {{role}} {{your_name}} {{phone}}
    // {{linkedin}} {{github}} {{portfolio}}
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    defaultResume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

templateSchema.index({ type: 1, roleType: 1 });

module.exports = mongoose.model('Template', templateSchema);
