const express = require('express');
const router = express.Router();
const replayController = require('../controllers/replayController');

router.get('/:sessionId', replayController.getReplayData);

module.exports = router;