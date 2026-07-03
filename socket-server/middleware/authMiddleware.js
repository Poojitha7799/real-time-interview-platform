const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token allocation missing or broken' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_marker');
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Session token validation has expired or is invalid' });
  }
};