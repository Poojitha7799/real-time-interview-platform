module.exports = function authMiddleware(req, res, next) {
  const userEmail = req.cookies?.user_email;
  const userRole = req.cookies?.user_role;

  if (!userEmail || !userRole) {
    return res.status(401).json({ error: 'Unauthenticated. Please log in.' });
  }

  req.user = { email: userEmail, role: userRole };
  next();
};