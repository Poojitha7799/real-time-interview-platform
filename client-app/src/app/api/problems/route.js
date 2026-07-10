import { NextResponse } from 'next/server';
import { dbPool } from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await dbPool.query('SELECT * FROM coding_problems');
    
    const normalizedRows = rows.map(row => {
      return {
        id: row.id ?? row.ID ?? row.problem_id ?? 1,
        title: row.title ?? row.TITLE ?? row.problem_title ?? row.name ?? 'Untitled Problem',
        difficulty: row.difficulty ?? row.DIFFICULTY ?? row.level ?? 'Medium',
        description: row.description ?? row.DESCRIPTION ?? row.statement ?? row.problem_desc ?? ''
      };
    });

    return NextResponse.json(normalizedRows);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}