const db = require('../config/db');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

const loginUser = async ({ email, password }) => {
  const [users] = await db.execute('SELECT * FROM interview_platform.users WHERE email = ?', [email]);
  
  // 👇 ADD THIS LOG LINE TO SEE EXACTLY WHAT NODE RECEIVES
  console.log("-> Node Server received user array from DB:", users);

  if (!users || users.length === 0) {
    throw new Error('No user profile matching that email was found in the system.');
  }

  const user = users[0];
  const databaseHash = user.password_hash || user.password;

  if (!databaseHash) {
    throw new Error('User found, but password column missing. Check table schema.');
  }

  const isMatch = await bcrypt.compare(password, databaseHash);
  if (!isMatch) {
    throw new Error('Invalid credentials profile match.');
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'fallback_secret_key',
    { expiresIn: '8h' }
  );

  return { token, role: user.role };
};

const registerUser = async ({ username, email, password }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await db.execute(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [username, email, passwordHash, 'candidate']
  );
  return { id: result.insertId, username, email };
};

module.exports = {
  loginUser,
  registerUser
};