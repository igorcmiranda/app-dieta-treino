import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/server/auth';
import { dbQuery, isMySqlConfigured } from '@/lib/server/mysql';
import { mapUserRow, UserRow } from '@/lib/server/user-mapper';

export async function GET(req: NextRequest) {
  try {
    if (!isMySqlConfigured) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ user: null }, { status: 401 });

    const rows = await dbQuery<UserRow[]>('SELECT * FROM users WHERE id = ?', [session.userId]);
    if (rows.length === 0) return NextResponse.json({ user: null }, { status: 401 });

    return NextResponse.json({ user: mapUserRow(rows[0]) });
  } catch (error) {
    console.error('Erro no auth/me:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
