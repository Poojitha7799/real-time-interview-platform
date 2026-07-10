const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/live-sessions', adminController.fetchActiveSessions);
router.post('/schedule-interview', adminController.handleScheduleSubmit);

module.exports = router;