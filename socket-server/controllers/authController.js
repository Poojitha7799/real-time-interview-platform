const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required fields.'
      });
    }

    const result = await authService.loginUser({ email, password });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed.'
    });
  }
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const result = await authService.registerUser({ username, email, password });
    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  login,
  register
};