import { NextResponse } from 'next/server';
import { dbPool } from '../../../lib/db';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const [rows] = await dbPool.query(
      'SELECT id, session_type, candidate_email, interviewer_email, scheduled_date, scheduled_time, candidate_name, academic_dept, verified_skills, duration_minutes, created_at FROM interview_sessions'
    );

    return NextResponse.json({ sessions: rows });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Internal server error', sessions: [] }, { status: 500 });
  }
}