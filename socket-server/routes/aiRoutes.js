const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/evaluate', aiController.evaluateSession);

module.exports = router;