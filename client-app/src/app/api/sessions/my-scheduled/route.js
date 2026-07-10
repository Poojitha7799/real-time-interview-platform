import { NextResponse } from 'next/server';
import { dbPool } from '../../../../lib/db';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (email) {
      const [rows] = await dbPool.query(
        'SELECT id, candidate_email, interviewer_email, scheduled_date, scheduled_time FROM interview_sessions WHERE candidate_email = ? ORDER BY created_at DESC',
        [email]
      );
      return NextResponse.json(rows);
    }

    const [allRows] = await dbPool.query(
      'SELECT id, candidate_email, interviewer_email, scheduled_date, scheduled_time FROM interview_sessions ORDER BY created_at DESC'
    );
    return NextResponse.json(allRows);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { candidateEmail, interviewerEmail, scheduledDate, scheduledTime } = body;

    if (!candidateEmail || !scheduledDate || !scheduledTime) {
      return NextResponse.json({ error: 'Missing required validation keys.' }, { status: 400 });
    }

    const roomId = crypto.randomBytes(4).toString('hex').toUpperCase();

    await dbPool.query(
      'INSERT INTO interview_sessions (id, candidate_email, interviewer_email, scheduled_date, scheduled_time) VALUES (?, ?, ?, ?, ?)',
      [roomId, candidateEmail, interviewerEmail || 'Unassigned', scheduledDate, scheduledTime]
    );

    return NextResponse.json({ success: true, roomId });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}