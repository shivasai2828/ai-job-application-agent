const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const { syncReplies, processDueFollowUps } = require('../src/services/followUpService');

(async () => {
  await connectDB();
  console.log('Reply sync:', await syncReplies());
  console.log('Follow-ups:', await processDueFollowUps());
  await mongoose.disconnect();
})().catch((error) => {
  console.error('Job run failed:', error.message);
  process.exit(1);
});
