const Template = require('../models/Template');
const ApiError = require('../utils/ApiError');

const ALLOWED_FIELDS = [
  'name',
  'type',
  'roleType',
  'subject',
  'body',
  'defaultResume',
  'isActive',
];

const pick = (data) =>
  ALLOWED_FIELDS.reduce((acc, key) => {
    if (data[key] !== undefined) acc[key] = data[key];
    return acc;
  }, {});

// ---------- Rendering ----------

// Replaces {{variable}} with values. Unknown variables become empty text.
const renderString = (text, variables) =>
  text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => variables[key] ?? '');

const buildVariables = (application, settings) => ({
  hr_name: application.hrName || 'Hiring Team',
  company: application.company,
  role: application.role,
  your_name: settings.yourName,
  phone: settings.phone,
  linkedin: settings.linkedin,
  github: settings.github,
  portfolio: settings.portfolio,
});

const renderTemplate = (template, application, settings) => {
  const variables = buildVariables(application, settings);
  return {
    subject: renderString(template.subject, variables),
    body: renderString(template.body, variables),
  };
};

// ---------- CRUD ----------

const createTemplate = async (data) => Template.create(pick(data));

const getTemplates = async ({ type, roleType, isActive } = {}) => {
  const filter = {};
  if (type) filter.type = type;
  if (roleType) filter.roleType = roleType;
  if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;
  return Template.find(filter).populate('defaultResume', 'label roleType').sort({ createdAt: -1 });
};

const getTemplateById = async (id) => {
  const template = await Template.findById(id).populate('defaultResume', 'label roleType');
  if (!template) throw new ApiError(404, 'Template not found');
  return template;
};

const updateTemplate = async (id, data) => {
  const template = await Template.findByIdAndUpdate(id, pick(data), {
    new: true,
    runValidators: true,
  });
  if (!template) throw new ApiError(404, 'Template not found');
  return template;
};

const deleteTemplate = async (id) => {
  const template = await Template.findByIdAndDelete(id);
  if (!template) throw new ApiError(404, 'Template not found');
  return template;
};

// Used by the scheduler: finds the follow-up template for a role type,
// falls back to the "general" one
const getFollowUpTemplate = async (type, roleType) => {
  let template = await Template.findOne({ type, roleType, isActive: true }).sort({ updatedAt: -1 });
  if (!template) {
    template = await Template.findOne({ type, roleType: 'general', isActive: true }).sort({
      updatedAt: -1,
    });
  }
  if (!template) throw new ApiError(404, `No active template found for ${type}`);
  return template;
};

module.exports = {
  renderString,
  renderTemplate,
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  getFollowUpTemplate,
};
