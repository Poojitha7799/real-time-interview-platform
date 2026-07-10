import { NextResponse } from 'next/server';
import { dbPool } from '../../../../lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const cleanUsername = username.trim();
    const normalizedEmail = email.toLowerCase().trim();

    const [existingUsers] = await dbPool.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'Email address is already registered.' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await dbPool.query(
      'INSERT INTO users (username, email, password_hash, role, name, department, skills) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        cleanUsername,
        normalizedEmail,
        passwordHash,
        'candidate',
        cleanUsername,
        'General Engineering',
        ''
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Profile registered successfully.'
    });

  } catch (error) {
    console.error("🔴 Registration backend crash error:", error);
    return NextResponse.json({ 
      error: `Server Error: ${error.message || 'Failed to initialize account.'}` 
    }, { status: 500 });
  }
}