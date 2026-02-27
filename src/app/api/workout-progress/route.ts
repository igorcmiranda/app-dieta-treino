import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/server/auth';
import { dbExecute, dbQuery, isMySqlConfigured } from '@/lib/server/mysql';

export async function GET(req: NextRequest) {
  try {
    if (!isMySqlConfigured) return NextResponse.json([]);
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

    const rows = session.isAdmin
      ? await dbQuery<any[]>('SELECT * FROM workout_progress ORDER BY created_at DESC')
      : await dbQuery<any[]>('SELECT * FROM workout_progress WHERE user_id = ? ORDER BY created_at DESC', [session.userId]);

    const mapped = rows.map(row => {
      const parsed = typeof row.progress_json === 'string' ? JSON.parse(row.progress_json) : row.progress_json;
      return {
        ...parsed,
        userId: row.user_id,
        date: row.date,
        workoutDay: row.workout_day,
        createdAt: row.created_at,
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Erro GET /api/workout-progress:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isMySqlConfigured) return NextResponse.json({ error: 'MySQL não configurado.' }, { status: 503 });
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

    const body = await req.json();
    const { userId, date, workoutDay } = body;

    if (!userId || !date || !workoutDay) {
      return NextResponse.json({ error: 'userId, date e workoutDay são obrigatórios.' }, { status: 400 });
    }
    if (!session.isAdmin && session.userId !== userId) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    await dbExecute(
      `INSERT INTO workout_progress (user_id, date, workout_day, progress_json)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE progress_json = VALUES(progress_json), updated_at = CURRENT_TIMESTAMP`,
      [userId, date, workoutDay, JSON.stringify(body)]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro POST /api/workout-progress:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
