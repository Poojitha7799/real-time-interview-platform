import { NextResponse } from 'next/server';
import { dbPool } from '../../../../lib/db';

export async function GET() {
  try {
    // Queries records directly by checking for the interviewer's 'active' session matrix
    const [rows] = await dbPool.query(
      `SELECT id, title, difficulty, candidate_email, interviewer_email, scheduled_date, scheduled_time 
       FROM interview_sessions 
       WHERE status = 'active'
       ORDER BY scheduled_date ASC, scheduled_time ASC`
    );

    return NextResponse.json({ 
      success: true,
      assignments: rows 
    });
  } catch (err) {
    console.error("🔴 Next.js active sessions database error:", err);
    return NextResponse.json({ 
      error: `Database connection error: ${err.message || 'Failed to retrieve sessions.'}` 
    }, { status: 500 });
  }
}