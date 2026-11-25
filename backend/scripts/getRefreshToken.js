require('dotenv').config();
const readline = require('readline');
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
  ],
});

console.log('\n1) Open this URL in your browser and allow access:\n\n' + url + '\n');
console.log('2) After allowing, the browser shows an error page (that is fine).');
console.log('   Copy only the value between "code=" and "&scope" from the address bar.\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Paste the code here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(decodeURIComponent(code.trim()));
    console.log('\nAdd this line to your .env:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  } catch (error) {
    console.error('Failed to get token:', error.message);
  }
  rl.close();
});
