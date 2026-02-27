import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/server/auth';
import { dbExecute, dbQuery, isMySqlConfigured } from '@/lib/server/mysql';

export async function GET(req: NextRequest) {
  try {
    if (!isMySqlConfigured) return NextResponse.json([]);
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

    const rows = session.isAdmin
      ? await dbQuery<any[]>('SELECT * FROM workout_plans')
      : await dbQuery<any[]>('SELECT * FROM workout_plans WHERE user_id = ?', [session.userId]);

    const mapped = rows.map(row => {
      const parsed = typeof row.plan_json === 'string' ? JSON.parse(row.plan_json) : row.plan_json;
      return { ...parsed, userId: row.user_id, createdAt: row.created_at };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Erro GET /api/workout-plans:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isMySqlConfigured) return NextResponse.json({ error: 'MySQL não configurado.' }, { status: 503 });
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

    const body = await req.json();
    const userId = body.userId;
    if (!userId) return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });
    if (!session.isAdmin && session.userId !== userId) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    await dbExecute(
      `INSERT INTO workout_plans (user_id, plan_json) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE plan_json = VALUES(plan_json), updated_at = CURRENT_TIMESTAMP`,
      [userId, JSON.stringify(body)]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro POST /api/workout-plans:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
