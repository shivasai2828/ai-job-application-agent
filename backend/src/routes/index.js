const router = require('express').Router();
const apiKeyAuth = require('../middlewares/apiKeyAuth');

router.use(apiKeyAuth);

router.use('/settings', require('./settingsRoutes'));
router.use('/templates', require('./templateRoutes'));
router.use('/resumes', require('./resumeRoutes'));
router.use('/applications', require('./applicationRoutes'));

module.exports = router;
