const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const result = await authService.authenticateUser(email, password);
    
    if (!result.success) {
      return res.status(401).json({ success: false, error: result.error });
    }

    res.cookie('session_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 
    });

    return res.status(200).json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role
      }
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error encountered' });
  }
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const result = await authService.registerUser(username, email, password);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.cookie('session_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role
      }
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error encountered' });
  }
};

const logout = (req, res) => {
  res.clearCookie('session_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

const getCurrentUser = (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user.id || req.user.userId,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

module.exports = {
  login,
  register,
  logout,
  getCurrentUser,
};