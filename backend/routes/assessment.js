const express = require('express');
const router = express.Router();
const { startAssessment, submitAnswer } = require('../controllers/assessmentController');

router.post('/start', startAssessment);
router.post('/answer', submitAnswer);

module.exports = router;
