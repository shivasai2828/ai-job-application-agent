const cron = require('node-cron');
const { syncReplies, processDueFollowUps } = require('../services/followUpService');

const TIMEZONE = 'Asia/Kolkata';

let syncRunning = false;
let followUpRunning = false;

const startScheduler = () => {
  // Reply detection: every 30 minutes, all day
  cron.schedule(
    '*/30 * * * *',
    async () => {
      if (syncRunning) return;
      syncRunning = true;
      try {
        const summary = await syncReplies();
        if (summary.replied || summary.bounced) console.log('[reply-sync]', summary);
      } catch (error) {
        console.error('[reply-sync] failed:', error.message);
      } finally {
        syncRunning = false;
      }
    },
    { timezone: TIMEZONE }
  );

  // Follow-ups: every 15 minutes, 9:00 AM to 5:45 PM, Monday to Friday (IST)
  cron.schedule(
    '*/15 9-17 * * 1-5',
    async () => {
      if (followUpRunning) return;
      followUpRunning = true;
      try {
        const summary = await processDueFollowUps();
        if (summary.due) console.log('[follow-ups]', summary);
      } catch (error) {
        console.error('[follow-ups] failed:', error.message);
      } finally {
        followUpRunning = false;
      }
    },
    { timezone: TIMEZONE }
  );

  console.log(`Scheduler started (${TIMEZONE}): reply sync every 30 min, follow-ups Mon-Fri 9-6`);
};

module.exports = { startScheduler };
