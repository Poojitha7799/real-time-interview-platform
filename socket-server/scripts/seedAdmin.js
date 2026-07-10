const bcrypt = require('bcrypt');
const db = require('../config/db');

async function seedAdmin() {
  const username = 'Admin';
  const email = 'admin@interviewflow.com';
  const password = 'AdminSecurePassword123';
  const role = 'admin';

  try {
    const [rows] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      console.log(`User with email ${email} already exists.`);
      process.exit(0);
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await db.execute(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, role]
    );

    console.log(`Successfully seeded ${role} user: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin entry:', error);
    process.exit(1);
  }
}

seedAdmin();