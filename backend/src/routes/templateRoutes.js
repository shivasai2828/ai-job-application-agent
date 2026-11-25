const router = require('express').Router();
const controller = require('../controllers/templateController');

router.post('/preview', controller.previewTemplate); // keep above '/:id'

router.route('/').get(controller.getTemplates).post(controller.createTemplate);

router
  .route('/:id')
  .get(controller.getTemplate)
  .put(controller.updateTemplate)
  .delete(controller.deleteTemplate);

module.exports = router;
