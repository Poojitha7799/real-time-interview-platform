module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  console.error(`[SYSTEM ERROR LOG] [${req.method} ${req.path}]:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞 Hidden' : err.stack
  });

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};