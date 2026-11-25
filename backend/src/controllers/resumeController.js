const asyncHandler = require('../utils/asyncHandler');
const resumeService = require('../services/resumeService');

const createResume = asyncHandler(async (req, res) => {
  const data = await resumeService.createResume(req.file, req.body);
  res.status(201).json({ success: true, data });
});

const getResumes = asyncHandler(async (req, res) => {
  const data = await resumeService.getResumes();
  res.json({ success: true, data });
});

const updateResume = asyncHandler(async (req, res) => {
  const data = await resumeService.updateResume(req.params.id, req.body);
  res.json({ success: true, data });
});

const deleteResume = asyncHandler(async (req, res) => {
  await resumeService.deleteResume(req.params.id);
  res.json({ success: true, message: 'Resume deleted' });
});

const downloadResume = asyncHandler(async (req, res) => {
  const resume = await resumeService.getResumeById(req.params.id);
  res.download(resume.filePath, resume.originalName);
});

module.exports = { createResume, getResumes, updateResume, deleteResume, downloadResume };
