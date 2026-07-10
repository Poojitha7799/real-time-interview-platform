const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.get('/analytics', studentController.getAnalytics);

module.exports = router;