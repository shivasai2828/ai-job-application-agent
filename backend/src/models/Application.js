const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['application', 'follow_up_1', 'follow_up_2'],
      required: true,
    },
    subject: String,
    body: String,
    gmailMessageId: String,
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    hrName: { type: String, trim: true, default: '' },
    hrEmail: { type: String, required: true, trim: true, lowercase: true },
    jobDescription: { type: String, default: '' },
    jobUrl: { type: String, default: '' },
    notes: { type: String, default: '' },

    template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },

    status: {
      type: String,
      enum: [
        'draft',
        'sending',
        'sent',
        'follow_up_1_sent',
        'follow_up_2_sent',
        'replied',
        'interview',
        'rejected',
        'closed',
        'failed',
      ],
      default: 'draft',
    },

    // Gmail tracking (used for reply detection)
    gmailThreadId: { type: String, default: '' },
    gmailMessageId: { type: String, default: '' },

    sentAt: { type: Date, default: null },
    repliedAt: { type: Date, default: null },

    // Follow-up scheduling
    followUpsEnabled: { type: Boolean, default: true },
    followUpStage: { type: Number, enum: [0, 1, 2], default: 0 }, // follow-ups already sent
    nextFollowUpAt: { type: Date, default: null },

    emailLogs: [emailLogSchema],
    lastError: { type: String, default: '' },
  },
  { timestamps: true }
);

applicationSchema.index({ status: 1, nextFollowUpAt: 1 });
applicationSchema.index({ hrEmail: 1 });
applicationSchema.index({ company: 1 });

module.exports = mongoose.model('Application', applicationSchema);
