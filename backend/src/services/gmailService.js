const fs = require('fs');
const { google } = require('googleapis');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

// ---------- Gmail client ----------

const getGmailClient = () => {
  const { clientId, clientSecret, redirectUri, refreshToken, senderEmail } = env.google;

  if (!clientId || !clientSecret || !refreshToken || !senderEmail) {
    throw new ApiError(500, 'Gmail credentials are missing in .env');
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  auth.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: 'v1', auth });
};

// ---------- MIME helpers ----------

const encodeWord = (text) => `=?UTF-8?B?${Buffer.from(text, 'utf-8').toString('base64')}?=`;

const wrap76 = (base64) => base64.replace(/(.{76})/g, '$1\r\n');

const toBase64Url = (buffer) =>
  buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const buildMimeMessage = ({ from, to, subject, text, attachment, inReplyTo }) => {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeWord(subject)}`,
    'MIME-Version: 1.0',
  ];

  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`, `References: ${inReplyTo}`);
  }

  headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);

  const parts = [];

  parts.push(
    [
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      wrap76(Buffer.from(text, 'utf-8').toString('base64')),
    ].join('\r\n')
  );

  if (attachment) {
    const safeName = attachment.fileName.replace(/["\r\n]/g, '');
    parts.push(
      [
        `--${boundary}`,
        `Content-Type: ${attachment.mimeType}; name="${safeName}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${safeName}"`,
        '',
        wrap76(attachment.buffer.toString('base64')),
      ].join('\r\n')
    );
  }

  return `${headers.join('\r\n')}\r\n\r\n${parts.join('\r\n')}\r\n--${boundary}--`;
};

// ---------- Public functions ----------

// Gets the real RFC Message-ID header of a sent mail (needed to keep
// follow-ups inside the same Gmail thread)
const getRfcMessageId = async (gmailMessageId) => {
  const gmail = getGmailClient();
  const { data } = await gmail.users.messages.get({
    userId: 'me',
    id: gmailMessageId,
    format: 'metadata',
    metadataHeaders: ['Message-ID'],
  });
  const header = (data.payload.headers || []).find((h) => h.name.toLowerCase() === 'message-id');
  return header ? header.value : null;
};

/**
 * Sends a plain-text mail with an optional attachment.
 * For follow-ups pass threadId + inReplyTo, and use the subject "Re: <original subject>"
 * so Gmail keeps it in the same thread.
 *
 * attachment: { filePath, fileName, mimeType }
 */
const sendEmail = async ({ fromName, to, subject, text, attachment, threadId, inReplyTo }) => {
  const gmail = getGmailClient();

  let attachmentData = null;
  if (attachment) {
    try {
      attachmentData = {
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        buffer: await fs.promises.readFile(attachment.filePath),
      };
    } catch (error) {
      throw new ApiError(400, 'Resume file not found on server. Please re-upload the resume.');
    }
  }

  const from = fromName
    ? `${encodeWord(fromName)} <${env.google.senderEmail}>`
    : env.google.senderEmail;

  const mime = buildMimeMessage({
    from,
    to,
    subject,
    text,
    attachment: attachmentData,
    inReplyTo,
  });

  const { data } = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: toBase64Url(Buffer.from(mime, 'utf-8')),
      ...(threadId && { threadId }),
    },
  });

  return { messageId: data.id, threadId: data.threadId };
};

/**
 * Checks a thread for a reply from someone other than you.
 * Returns { hasReply, bounced, repliedAt }
 */
const checkReply = async (threadId) => {
  const gmail = getGmailClient();

  const { data } = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'metadata',
    metadataHeaders: ['From'],
  });

  const sender = env.google.senderEmail.toLowerCase();
  let hasReply = false;
  let bounced = false;
  let repliedAt = null;

  for (const message of data.messages || []) {
    const fromHeader = (message.payload.headers || []).find(
      (h) => h.name.toLowerCase() === 'from'
    );
    const from = (fromHeader ? fromHeader.value : '').toLowerCase();

    if (!from || from.includes(sender)) continue; // your own message

    if (from.includes('mailer-daemon') || from.includes('postmaster')) {
      bounced = true; // email address was invalid / delivery failed
      continue;
    }

    hasReply = true;
    repliedAt = new Date(Number(message.internalDate));
    break;
  }

  return { hasReply, bounced, repliedAt };
};

module.exports = { sendEmail, checkReply, getRfcMessageId };
