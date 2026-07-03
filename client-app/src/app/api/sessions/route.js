import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'interview_platform'
    });

    const [rows] = await connection.execute(
      "SELECT id, problem_id, created_at FROM interview_sessions ORDER BY created_at DESC"
    );

    await connection.end();
    return NextResponse.json({ sessions: rows });
  } catch (error) {
    console.error("Session database fetch failure:", error);
    return NextResponse.json({ error: 'Failed to synchronize interview sessions' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { id, problemId } = await request.json();
    if (!id || id.trim().length === 0) {
      return NextResponse.json({ error: 'Session Identifier cannot be empty' }, { status: 400 });
    }

    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const cleanProblemId = problemId || 'two-sum';

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'interview_platform'
    });

    const [existing] = await connection.execute(
      "SELECT id FROM interview_sessions WHERE id = ?",
      [cleanId]
    );

    if (existing.length > 0) {
      await connection.end();
      return NextResponse.json({ error: 'Session ID tracking constraint already exists' }, { status: 400 });
    }

    await connection.execute(
      "INSERT INTO interview_sessions (id, problem_id, created_at) VALUES (?, ?, NOW())",
      [cleanId, cleanProblemId]
    );

    await connection.end();
    
    return NextResponse.json({ 
      session: { id: cleanId, problem_id: cleanProblemId, created_at: new Date().toISOString() } 
    });
  } catch (error) {
    console.error("Session instantiation anomaly:", error);
    return NextResponse.json({ error: 'Failed to write session record row' }, { status: 500 });
  }
}