const router = require('express').Router();
const controller = require('../controllers/resumeController');
const { uploadResume } = require('../middlewares/upload');

router.route('/').get(controller.getResumes).post(uploadResume, controller.createResume);

router.get('/:id/file', controller.downloadResume);

router.route('/:id').put(controller.updateResume).delete(controller.deleteResume);

module.exports = router;
