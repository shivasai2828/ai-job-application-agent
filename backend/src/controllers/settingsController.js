const asyncHandler = require('../utils/asyncHandler');
const settingsService = require('../services/settingsService');

const getSettings = asyncHandler(async (req, res) => {
  const data = await settingsService.getSettings();
  res.json({ success: true, data });
});

const updateSettings = asyncHandler(async (req, res) => {
  const data = await settingsService.updateSettings(req.body);
  res.json({ success: true, data });
});

module.exports = { getSettings, updateSettings };
