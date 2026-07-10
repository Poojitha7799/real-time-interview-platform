import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbPool } from '../../../../lib/db';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await dbPool.query('SELECT username, email, role, name, department, skills FROM users WHERE id = ?', [decoded.userId]);
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      username: users[0].username,
      email: users[0].email,
      role: users[0].role,
      name: users[0].name,
      department: users[0].department,
      skills: users[0].skills
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Invalid token integrity' }, { status: 401 });
  }
}