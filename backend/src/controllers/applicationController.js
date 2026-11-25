const asyncHandler = require('../utils/asyncHandler');
const applicationService = require('../services/applicationService');

const createApplication = asyncHandler(async (req, res) => {
  const { application, duplicates } = await applicationService.createApplication(req.body);
  res.status(201).json({ success: true, data: application, duplicates });
});

const getApplications = asyncHandler(async (req, res) => {
  const { applications, pagination } = await applicationService.getApplications(req.query);
  res.json({ success: true, data: applications, pagination });
});

const getApplication = asyncHandler(async (req, res) => {
  const data = await applicationService.getApplicationById(req.params.id);
  res.json({ success: true, data });
});

const updateApplication = asyncHandler(async (req, res) => {
  const data = await applicationService.updateApplication(req.params.id, req.body);
  res.json({ success: true, data });
});

const deleteApplication = asyncHandler(async (req, res) => {
  await applicationService.deleteApplication(req.params.id);
  res.json({ success: true, message: 'Application deleted' });
});

const previewApplication = asyncHandler(async (req, res) => {
  const data = await applicationService.previewApplication(req.params.id);
  res.json({ success: true, data });
});

const sendApplication = asyncHandler(async (req, res) => {
  const data = await applicationService.sendApplication(req.params.id, req.body);
  res.json({ success: true, message: 'Email sent successfully', data });
});

const updateStatus = asyncHandler(async (req, res) => {
  const data = await applicationService.updateStatus(req.params.id, req.body.status);
  res.json({ success: true, data });
});

const setFollowUps = asyncHandler(async (req, res) => {
  const data = await applicationService.setFollowUps(req.params.id, req.body.enabled);
  res.json({ success: true, data });
});

const getStats = asyncHandler(async (req, res) => {
  const data = await applicationService.getStats();
  res.json({ success: true, data });
});

module.exports = {
  createApplication,
  getApplications,
  getApplication,
  updateApplication,
  deleteApplication,
  previewApplication,
  sendApplication,
  updateStatus,
  setFollowUps,
  getStats,
};
