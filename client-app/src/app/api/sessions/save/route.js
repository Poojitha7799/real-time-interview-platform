import { NextResponse } from 'next/server';
import { dbPool } from '../../../../lib/db';

// GET: Gathers chronological run histories for the analytics dashboard
export async function GET(request) {
  try {
    // Reading email from cookies if your auth system uses them; otherwise fallback
    const userEmailCookie = request.cookies.get('user_email')?.value || 'anonymous@interviewflow.com';

    const [rows] = await dbPool.query(
      'SELECT id, topic, score, status, DATE_FORMAT(execution_date, "%Y-%m-%d") as execution_date FROM mock_sessions WHERE user_email = ? ORDER BY execution_date DESC, id DESC',
      [userEmailCookie]
    );

    return NextResponse.json({ success: true, sessions: rows });
  } catch (error) {
    console.error("🔴 Next.js analytics fetch backend failure:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Saves fresh metric data down to your MySQL mock_sessions table
export async function POST(request) {
  try {
    const { topic, score, status } = await request.json();
    const userEmailCookie = request.cookies.get('user_email')?.value || 'anonymous@interviewflow.com';
    const preciseDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await dbPool.query(
      'INSERT INTO mock_sessions (user_email, topic, score, status, execution_date) VALUES (?, ?, ?, ?, ?)',
      [userEmailCookie, topic, score, status, preciseDateTime]
    );

    return NextResponse.json({ success: true, message: "Mock performance metric saved." });
  } catch (error) {
    console.error("🔴 Next.js analytics save backend failure:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}