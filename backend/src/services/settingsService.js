const Settings = require('../models/Settings');

const ALLOWED_FIELDS = [
  'yourName',
  'phone',
  'linkedin',
  'github',
  'portfolio',
  'followUp1AfterDays',
  'followUp2AfterDays',
  'dailySendLimit',
];

// Creates the single settings document on first use
const getSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  return settings;
};

const updateSettings = async (data) => {
  const settings = await getSettings();
  ALLOWED_FIELDS.forEach((field) => {
    if (data[field] !== undefined) settings[field] = data[field];
  });
  await settings.save();
  return settings;
};

module.exports = { getSettings, updateSettings };
