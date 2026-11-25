const asyncHandler = require('../utils/asyncHandler');
const templateService = require('../services/templateService');
const { getSettings } = require('../services/settingsService');

const createTemplate = asyncHandler(async (req, res) => {
  const data = await templateService.createTemplate(req.body);
  res.status(201).json({ success: true, data });
});

const getTemplates = asyncHandler(async (req, res) => {
  const data = await templateService.getTemplates(req.query);
  res.json({ success: true, data });
});

const getTemplate = asyncHandler(async (req, res) => {
  const data = await templateService.getTemplateById(req.params.id);
  res.json({ success: true, data });
});

const updateTemplate = asyncHandler(async (req, res) => {
  const data = await templateService.updateTemplate(req.params.id, req.body);
  res.json({ success: true, data });
});

const deleteTemplate = asyncHandler(async (req, res) => {
  await templateService.deleteTemplate(req.params.id);
  res.json({ success: true, message: 'Template deleted' });
});

// Live preview for the template editor, using sample HR/company values
const previewTemplate = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const sample = {
    hrName: req.body.hrName || 'Priya',
    company: req.body.company || 'Acme Tech',
    role: req.body.role || 'Full Stack Developer',
  };
  const data = templateService.renderTemplate(
    { subject: req.body.subject || '', body: req.body.body || '' },
    sample,
    settings
  );
  res.json({ success: true, data });
});

module.exports = {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
};
