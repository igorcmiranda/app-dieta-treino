import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/server/auth';
import { dbExecute, dbQuery, isMySqlConfigured } from '@/lib/server/mysql';

export async function GET(req: NextRequest) {
  try {
    if (!isMySqlConfigured) return NextResponse.json([]);
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

    const rows = session.isAdmin
      ? await dbQuery<any[]>('SELECT * FROM body_analyses')
      : await dbQuery<any[]>('SELECT * FROM body_analyses WHERE user_id = ?', [session.userId]);

    const mapped = rows.map(row => {
      const photos = typeof row.photos_json === 'string' ? JSON.parse(row.photos_json) : row.photos_json;
      const analysis = typeof row.analysis_json === 'string' ? JSON.parse(row.analysis_json) : row.analysis_json;
      return { userId: row.user_id, photos, analysis, createdAt: row.created_at };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Erro GET /api/body-analyses:', error);
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
      `INSERT INTO body_analyses (user_id, photos_json, analysis_json) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE photos_json = VALUES(photos_json), analysis_json = VALUES(analysis_json), updated_at = CURRENT_TIMESTAMP`,
      [userId, JSON.stringify(body.photos || {}), JSON.stringify(body.analysis || {})]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro POST /api/body-analyses:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
