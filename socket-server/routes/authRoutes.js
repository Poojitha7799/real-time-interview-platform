const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

if (!authController || !authController.register || !authController.login) {
  throw new Error("Fatal: authController methods are missing or undefined. Check your controller exports.");
}

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/me', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;