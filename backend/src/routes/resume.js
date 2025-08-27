const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');

router.post('/process', resumeController.processResume);
router.post('/query', resumeController.queryResume);

module.exports = router;
