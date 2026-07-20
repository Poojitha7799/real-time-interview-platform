const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

if (!authController || !authController.login || !authController.register || !authController.logout || !authController.getCurrentUser) {
  throw new Error("Fatal: authController methods are missing or undefined. Check your controller exports.");
}

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;