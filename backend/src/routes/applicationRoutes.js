const router = require('express').Router();
const controller = require('../controllers/applicationController');

router.get('/stats', controller.getStats); // keep above '/:id'

router.route('/').get(controller.getApplications).post(controller.createApplication);

router
  .route('/:id')
  .get(controller.getApplication)
  .patch(controller.updateApplication)
  .delete(controller.deleteApplication);

router.get('/:id/preview', controller.previewApplication);
router.post('/:id/send', controller.sendApplication);
router.patch('/:id/status', controller.updateStatus);
router.patch('/:id/follow-ups', controller.setFollowUps);

module.exports = router;
