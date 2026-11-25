const fs = require('fs');
const Resume = require('../models/Resume');
const Template = require('../models/Template');
const Application = require('../models/Application');
const ApiError = require('../utils/ApiError');

const removeFile = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    // file already missing, ignore
  }
};

const unsetOtherDefaults = (exceptId) =>
  Resume.updateMany({ _id: { $ne: exceptId }, isDefault: true }, { isDefault: false });

const createResume = async (file, body = {}) => {
  if (!file) throw new ApiError(400, 'Resume file is required (field name: resume)');

  try {
    const resume = await Resume.create({
      label: body.label || file.originalname,
      roleType: body.roleType || 'general',
      originalName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      mimeType: file.mimetype,
      size: file.size,
      isDefault: body.isDefault === 'true' || body.isDefault === true,
    });

    if (resume.isDefault) await unsetOtherDefaults(resume._id);
    return resume;
  } catch (error) {
    await removeFile(file.path); // don't keep orphan files if DB save fails
    throw error;
  }
};

const getResumes = async () => Resume.find().sort({ createdAt: -1 });

const getResumeById = async (id) => {
  const resume = await Resume.findById(id);
  if (!resume) throw new ApiError(404, 'Resume not found');
  return resume;
};

const updateResume = async (id, data) => {
  const resume = await getResumeById(id);

  if (data.label !== undefined) resume.label = data.label;
  if (data.roleType !== undefined) resume.roleType = data.roleType;
  if (data.isDefault !== undefined) {
    resume.isDefault = data.isDefault === 'true' || data.isDefault === true;
  }

  await resume.save();
  if (resume.isDefault) await unsetOtherDefaults(resume._id);
  return resume;
};

const deleteResume = async (id) => {
  const resume = await getResumeById(id);

  const usedCount = await Application.countDocuments({ resume: id });
  if (usedCount > 0) {
    throw new ApiError(409, `Resume is used by ${usedCount} application(s) and cannot be deleted`);
  }

  await Template.updateMany({ defaultResume: id }, { defaultResume: null });
  await removeFile(resume.filePath);
  await resume.deleteOne();
  return resume;
};

module.exports = { createResume, getResumes, getResumeById, updateResume, deleteResume };
