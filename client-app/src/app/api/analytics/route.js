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

    const query = "SELECT id, session_id, overall_score, code_efficiency, communication_rating, constructive_feedback, completed_at FROM interview_analytics ORDER BY id DESC";
    const [rows] = await connection.execute(query);
    
    await connection.end();

    // Sends the payload inside both 'analytics' descriptor object to satisfy the frontend check definitions
    return NextResponse.json({ analytics: rows });
  } catch (error) {
    console.error("Analytics fetch pipeline issue:", error);
    return NextResponse.json({ error: 'Database tracking read failure', analytics: [] }, { status: 500 });
  }
}