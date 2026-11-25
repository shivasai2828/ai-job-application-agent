const Application = require('../models/Application');
const Template = require('../models/Template');
const Resume = require('../models/Resume');
const ApiError = require('../utils/ApiError');
const gmailService = require('./gmailService');
const { getSettings } = require('./settingsService');
const { renderTemplate } = require('./templateService');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const ALWAYS_EDITABLE = ['hrName', 'jobDescription', 'jobUrl', 'notes'];
const DRAFT_EDITABLE = ['company', 'role', 'hrEmail', 'template', 'resume', ...ALWAYS_EDITABLE];
const MANUAL_STATUSES = ['replied', 'interview', 'rejected', 'closed'];
const ACTIVE_STATUSES = ['sent', 'follow_up_1_sent'];
const SORT_OPTIONS = [
  'createdAt', '-createdAt', 'sentAt', '-sentAt',
  'nextFollowUpAt', '-nextFollowUpAt', 'company', '-company',
];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------- Helpers ----------

const calcNextFollowUpAt = (application, settings) => {
  if (!application.followUpsEnabled || !application.sentAt) return null;

  const sentAt = new Date(application.sentAt).getTime();

  if (application.followUpStage === 0) {
    return new Date(Math.max(sentAt + settings.followUp1AfterDays * DAY_MS, Date.now()));
  }
  if (application.followUpStage === 1) {
    // at least 1 day after follow-up 1, so two mails never go back to back
    return new Date(Math.max(sentAt + settings.followUp2AfterDays * DAY_MS, Date.now() + DAY_MS));
  }
  return null;
};

const countSentToday = async () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const result = await Application.aggregate([
    { $unwind: '$emailLogs' },
    { $match: { 'emailLogs.sentAt': { $gte: start } } },
    { $count: 'total' },
  ]);
  return result[0]?.total || 0;
};

const resolveResumeId = async (template, resumeId) => {
  if (resumeId) {
    const resume = await Resume.findById(resumeId);
    if (!resume) throw new ApiError(404, 'Resume not found');
    return resume._id;
  }

  if (template.defaultResume) return template.defaultResume;

  const resume =
    (await Resume.findOne({ roleType: template.roleType, isDefault: true })) ||
    (await Resume.findOne({ isDefault: true })) ||
    (await Resume.findOne().sort({ createdAt: -1 }));

  if (!resume) throw new ApiError(400, 'Please upload a resume first');
  return resume._id;
};

const validateTemplate = async (templateId) => {
  const template = await Template.findById(templateId);
  if (!template) throw new ApiError(404, 'Template not found');
  if (template.type !== 'application') {
    throw new ApiError(400, 'Please select an application template (not a follow-up template)');
  }
  return template;
};

const findDuplicates = (hrEmail, company, excludeId) =>
  Application.find({
    _id: { $ne: excludeId },
    $or: [{ hrEmail }, { company: new RegExp(`^${escapeRegex(company)}$`, 'i') }],
  })
    .select('company role hrEmail status createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

// ---------- CRUD ----------

const createApplication = async (data) => {
  const { company, role, hrName, hrEmail, jobDescription, jobUrl, notes } = data;

  if (!company || !role || !hrEmail || !data.template) {
    throw new ApiError(400, 'company, role, hrEmail and template are required');
  }
  if (!EMAIL_REGEX.test(hrEmail.trim())) throw new ApiError(400, 'Invalid HR email address');

  const template = await validateTemplate(data.template);
  const resumeId = await resolveResumeId(template, data.resume);

  const application = await Application.create({
    company,
    role,
    hrName,
    hrEmail,
    jobDescription,
    jobUrl,
    notes,
    template: template._id,
    resume: resumeId,
  });

  const duplicates = await findDuplicates(application.hrEmail, application.company, application._id);
  return { application, duplicates };
};

const getApplications = async (query = {}) => {
  const { status, search, from, to, page = 1, limit = 20, sort } = query;

  const filter = {};
  if (status) filter.status = { $in: status.split(',') };

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ company: regex }, { role: regex }, { hrEmail: regex }, { hrName: regex }];
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const sortBy = SORT_OPTIONS.includes(sort) ? sort : '-createdAt';

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .select('-emailLogs -jobDescription')
      .populate('template', 'name type roleType')
      .populate('resume', 'label roleType')
      .sort(sortBy)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Application.countDocuments(filter),
  ]);

  return {
    applications,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  };
};

const getApplicationById = async (id) => {
  const application = await Application.findById(id)
    .populate('template')
    .populate('resume', 'label roleType originalName');
  if (!application) throw new ApiError(404, 'Application not found');
  return application;
};

const updateApplication = async (id, data) => {
  const application = await Application.findById(id);
  if (!application) throw new ApiError(404, 'Application not found');

  const editable = ['draft', 'failed'].includes(application.status)
    ? DRAFT_EDITABLE
    : ALWAYS_EDITABLE;

  if (data.hrEmail !== undefined && editable.includes('hrEmail')) {
    if (!EMAIL_REGEX.test(String(data.hrEmail).trim())) {
      throw new ApiError(400, 'Invalid HR email address');
    }
  }
  if (data.template !== undefined && editable.includes('template')) {
    await validateTemplate(data.template);
  }
  if (data.resume !== undefined && editable.includes('resume')) {
    const resume = await Resume.findById(data.resume);
    if (!resume) throw new ApiError(404, 'Resume not found');
  }

  editable.forEach((field) => {
    if (data[field] !== undefined) application[field] = data[field];
  });

  await application.save();
  return application;
};

const deleteApplication = async (id) => {
  const application = await Application.findByIdAndDelete(id);
  if (!application) throw new ApiError(404, 'Application not found');
  return application;
};

// ---------- Preview & Send ----------

const previewApplication = async (id) => {
  const application = await Application.findById(id).populate('template').populate('resume');
  if (!application) throw new ApiError(404, 'Application not found');

  const settings = await getSettings();
  const { subject, body } = renderTemplate(application.template, application, settings);

  return {
    to: application.hrEmail,
    subject,
    body,
    resume: application.resume
      ? { id: application.resume._id, label: application.resume.label, fileName: application.resume.originalName }
      : null,
  };
};

// overrides: { subject, body } if you edited the preview before sending
const sendApplication = async (id, overrides = {}) => {
  const settings = await getSettings();

  const sentToday = await countSentToday();
  if (sentToday >= settings.dailySendLimit) {
    throw new ApiError(429, `Daily send limit (${settings.dailySendLimit}) reached. Try again tomorrow.`);
  }

  // Atomically claim the application so it can never be sent twice
  const application = await Application.findOneAndUpdate(
    { _id: id, status: { $in: ['draft', 'failed'] } },
    { status: 'sending', lastError: '' },
    { new: true }
  )
    .populate('template')
    .populate('resume');

  if (!application) {
    const exists = await Application.exists({ _id: id });
    if (!exists) throw new ApiError(404, 'Application not found');
    throw new ApiError(400, 'This application was already sent or is being sent');
  }

  const rendered = renderTemplate(application.template, application, settings);
  const subject = overrides.subject?.trim() || rendered.subject;
  const body = overrides.body?.trim() || rendered.body;

  let result;
  try {
    result = await gmailService.sendEmail({
      fromName: settings.yourName,
      to: application.hrEmail,
      subject,
      text: body,
      attachment: {
        filePath: application.resume.filePath,
        fileName: application.resume.originalName,
        mimeType: application.resume.mimeType,
      },
    });
  } catch (error) {
    application.status = 'failed';
    application.lastError = error.message;
    await application.save();
    throw error instanceof ApiError
      ? error
      : new ApiError(502, `Failed to send email: ${error.message}`);
  }

  const now = new Date();
  application.status = 'sent';
  application.sentAt = now;
  application.gmailThreadId = result.threadId;
  application.gmailMessageId = result.messageId;
  application.followUpStage = 0;
  application.emailLogs.push({
    type: 'application',
    subject,
    body,
    gmailMessageId: result.messageId,
    sentAt: now,
  });
  application.nextFollowUpAt = calcNextFollowUpAt(application, settings);

  await application.save();
  return application;
};

// ---------- Status & follow-up controls ----------

const updateStatus = async (id, status) => {
  if (!MANUAL_STATUSES.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${MANUAL_STATUSES.join(', ')}`);
  }

  const application = await Application.findById(id);
  if (!application) throw new ApiError(404, 'Application not found');

  if (['draft', 'sending', 'failed'].includes(application.status)) {
    throw new ApiError(400, 'Only sent applications can be updated to this status');
  }

  application.status = status;
  application.nextFollowUpAt = null; // stop follow-ups
  if (['replied', 'interview'].includes(status) && !application.repliedAt) {
    application.repliedAt = new Date();
  }

  await application.save();
  return application;
};

const setFollowUps = async (id, enabled) => {
  const application = await Application.findById(id);
  if (!application) throw new ApiError(404, 'Application not found');

  const settings = await getSettings();
  application.followUpsEnabled = Boolean(enabled);

  if (!application.followUpsEnabled) {
    application.nextFollowUpAt = null;
  } else if (ACTIVE_STATUSES.includes(application.status)) {
    application.nextFollowUpAt = calcNextFollowUpAt(application, settings);
  }

  await application.save();
  return application;
};

// ---------- Dashboard ----------

const getStats = async () => {
  const settings = await getSettings();

  const [byStatus, sentToday, upcomingFollowUps] = await Promise.all([
    Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    countSentToday(),
    Application.find({
      followUpsEnabled: true,
      status: { $in: ACTIVE_STATUSES },
      nextFollowUpAt: { $ne: null, $lte: new Date(Date.now() + DAY_MS) },
    })
      .sort('nextFollowUpAt')
      .limit(10)
      .select('company role hrEmail status followUpStage nextFollowUpAt'),
  ]);

  const counts = {};
  let total = 0;
  byStatus.forEach((item) => {
    counts[item._id] = item.count;
    total += item.count;
  });

  const notSent = (counts.draft || 0) + (counts.sending || 0) + (counts.failed || 0);
  const sentTotal = total - notSent;
  const responded = (counts.replied || 0) + (counts.interview || 0) + (counts.rejected || 0);
  const responseRate = sentTotal ? Math.round((responded / sentTotal) * 1000) / 10 : 0;

  return {
    total,
    sentTotal,
    counts,
    sentToday,
    dailySendLimit: settings.dailySendLimit,
    responseRate,
    upcomingFollowUps,
  };
};

module.exports = {
  calcNextFollowUpAt,
  countSentToday,
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  previewApplication,
  sendApplication,
  updateStatus,
  setFollowUps,
  getStats,
};
