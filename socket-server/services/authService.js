const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/db'); 

const authenticateUser = async (email, password) => {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    if (users.length === 0) {
      return { success: false, error: 'Invalid email or password' };
    }

    const user = users[0];
    const storedHash = user.password_hash || user.passwordHash || user.password;
    
    if (!storedHash) {
      return { success: false, error: 'Authentication structural failure: Account configuration issue.' };
    }

    const isMatch = await bcrypt.compare(password, storedHash);
    if (!isMatch) {
      return { success: false, error: 'Invalid email or password' };
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { success: true, token, user };
  } catch (err) {
    throw err;
  }
};

const registerUser = async (username, email, password) => {
  try {
    const cleanEmail = email.trim().toLowerCase();

    const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    if (existingUsers.length > 0) {
      return { success: false, error: 'Email is already registered' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let result;
    try {
      [result] = await db.execute(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [username, cleanEmail, hashedPassword, 'candidate']
      );
    } catch (firstErr) {
      try {
        [result] = await db.execute(
          'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
          [username, cleanEmail, hashedPassword, 'candidate']
        );
      } catch (secondErr) {
        [result] = await db.execute(
          'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
          [username, cleanEmail, hashedPassword, 'candidate']
        );
      }
    }

    const token = jwt.sign(
      { userId: result.insertId, email: cleanEmail, role: 'candidate' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      success: true,
      token,
      user: { id: result.insertId, email: cleanEmail, role: 'candidate' }
    };
  } catch (err) {
    console.error('\n❌ DATABASE CRASH DIAGNOSTICS:');
    console.error(err.message);
    console.error('--------------------------------');
    throw err;
  }
};

module.exports = {
  authenticateUser,
  registerUser
};