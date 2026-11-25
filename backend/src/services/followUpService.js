const Application = require('../models/Application');
const gmailService = require('./gmailService');
const { getSettings } = require('./settingsService');
const { renderTemplate, getFollowUpTemplate } = require('./templateService');
const { calcNextFollowUpAt, countSentToday } = require('./applicationService');

const DAY_MS = 24 * 60 * 60 * 1000;
const RETRY_DELAY_MS = 6 * 60 * 60 * 1000; // retry failed follow-ups after 6 hours
const ACTIVE_STATUSES = ['sent', 'follow_up_1_sent', 'follow_up_2_sent'];
const FOLLOW_UP_STATUSES = ['sent', 'follow_up_1_sent'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const stripRe = (subject) => subject.replace(/^(re:\s*)+/i, '').trim();

// ---------- Reply detection (all active applications) ----------

const syncReplies = async () => {
  const since = new Date(Date.now() - 30 * DAY_MS);

  const applications = await Application.find({
    status: { $in: ACTIVE_STATUSES },
    gmailThreadId: { $ne: '' },
    sentAt: { $gte: since },
  }).select('_id gmailThreadId');

  const summary = { checked: applications.length, replied: 0, bounced: 0 };

  for (const application of applications) {
    try {
      const result = await gmailService.checkReply(application.gmailThreadId);

      if (result.hasReply) {
        const update = await Application.updateOne(
          { _id: application._id, status: { $in: ACTIVE_STATUSES } },
          { status: 'replied', repliedAt: result.repliedAt || new Date(), nextFollowUpAt: null }
        );
        if (update.modifiedCount) summary.replied += 1;
      } else if (result.bounced) {
        const update = await Application.updateOne(
          { _id: application._id, status: { $in: ACTIVE_STATUSES } },
          {
            status: 'failed',
            nextFollowUpAt: null,
            followUpStage: 0,
            lastError: 'Email bounced. Please check the HR email address.',
          }
        );
        if (update.modifiedCount) summary.bounced += 1;
      }
    } catch (error) {
      console.error(`Reply check failed for ${application._id}:`, error.message);
    }
  }

  return summary;
};

// ---------- Send one follow-up ----------

const processOne = async (id, settings) => {
  // Claim the application (clears nextFollowUpAt) so overlapping runs can't double-send
  const application = await Application.findOneAndUpdate(
    {
      _id: id,
      followUpsEnabled: true,
      status: { $in: FOLLOW_UP_STATUSES },
      nextFollowUpAt: { $ne: null, $lte: new Date() },
    },
    { nextFollowUpAt: null },
    { new: false }
  ).populate('template', 'roleType');

  if (!application) return 'skipped';

  try {
    // Last-second check: never follow up if HR already replied
    const check = await gmailService.checkReply(application.gmailThreadId);

    if (check.hasReply) {
      application.status = 'replied';
      application.repliedAt = check.repliedAt || new Date();
      application.nextFollowUpAt = null;
      await application.save();
      return 'skipped';
    }

    if (check.bounced) {
      application.status = 'failed';
      application.followUpStage = 0;
      application.nextFollowUpAt = null;
      application.lastError = 'Email bounced. Please check the HR email address.';
      await application.save();
      return 'skipped';
    }

    const type = application.followUpStage === 0 ? 'follow_up_1' : 'follow_up_2';
    const template = await getFollowUpTemplate(type, application.template?.roleType || 'general');
    const { body } = renderTemplate(template, application, settings);

    // Follow-ups always reply inside the original thread: subject = "Re: <original subject>"
    const originalSubject =
      application.emailLogs[0]?.subject || `Application for ${application.role}`;
    const subject = `Re: ${stripRe(originalSubject)}`;

    const inReplyTo = await gmailService
      .getRfcMessageId(application.gmailMessageId)
      .catch(() => null);

    const result = await gmailService.sendEmail({
      fromName: settings.yourName,
      to: application.hrEmail,
      subject,
      text: body,
      threadId: application.gmailThreadId,
      inReplyTo,
    });

    application.followUpStage += 1;
    application.status = application.followUpStage === 1 ? 'follow_up_1_sent' : 'follow_up_2_sent';
    application.emailLogs.push({
      type,
      subject,
      body,
      gmailMessageId: result.messageId,
      sentAt: new Date(),
    });
    application.nextFollowUpAt = calcNextFollowUpAt(application, settings);
    application.lastError = '';
    await application.save();

    return 'sent';
  } catch (error) {
    console.error(`Follow-up failed for ${application._id}:`, error.message);
    application.nextFollowUpAt = new Date(Date.now() + RETRY_DELAY_MS);
    application.lastError = `Follow-up failed: ${error.message}`;
    await application.save();
    return 'failed';
  }
};

// ---------- Process all due follow-ups ----------

const processDueFollowUps = async () => {
  const settings = await getSettings();

  const due = await Application.find({
    followUpsEnabled: true,
    status: { $in: FOLLOW_UP_STATUSES },
    gmailThreadId: { $ne: '' },
    nextFollowUpAt: { $ne: null, $lte: new Date() },
  })
    .sort('nextFollowUpAt')
    .limit(20)
    .select('_id');

  const summary = { due: due.length, sent: 0, skipped: 0, failed: 0 };
  let sentToday = await countSentToday();

  for (const { _id } of due) {
    if (sentToday >= settings.dailySendLimit) {
      console.log('Daily send limit reached, remaining follow-ups wait until tomorrow');
      break;
    }

    const outcome = await processOne(_id, settings);
    summary[outcome] += 1;

    if (outcome === 'sent') {
      sentToday += 1;
      await sleep(randomBetween(20000, 60000)); // 20-60s gap between emails
    }
  }

  return summary;
};

module.exports = { syncReplies, processDueFollowUps };
