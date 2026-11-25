const router = require('express').Router();
const controller = require('../controllers/settingsController');

router.route('/').get(controller.getSettings).put(controller.updateSettings);

module.exports = router;
