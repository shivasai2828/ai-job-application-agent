const env = require('../config/env');
const ApiError = require('../utils/ApiError');

// Personal-use protection: requires header  x-api-key: <API_KEY>
const apiKeyAuth = (req, res, next) => {
  if (!env.apiKey) return next(); // disabled when API_KEY is empty

  if (req.headers['x-api-key'] !== env.apiKey) {
    return next(new ApiError(401, 'Invalid or missing API key'));
  }
  next();
};

module.exports = apiKeyAuth;
