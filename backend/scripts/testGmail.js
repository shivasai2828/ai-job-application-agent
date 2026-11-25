const env = require('../src/config/env');
const gmailService = require('../src/services/gmailService');

(async () => {
  const result = await gmailService.sendEmail({
    fromName: 'Test Sender',
    to: env.google.senderEmail, // sends to yourself
    subject: 'Test mail from job outreach backend',
    text: 'If you see this, Gmail sending works.',
  });
  console.log('Sent:', result);

  const reply = await gmailService.checkReply(result.threadId);
  console.log('Reply check:', reply);
})().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
