import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { getSessionFromRequest } from '@/lib/server/auth';
import { dbExecute, dbQuery, isMySqlConfigured } from '@/lib/server/mysql';
import { mapUserRow, UserRow } from '@/lib/server/user-mapper';

export async function GET(req: NextRequest) {
  try {
    if (!isMySqlConfigured) return NextResponse.json([]);

    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

    const rows = session.isAdmin
      ? await dbQuery<UserRow[]>('SELECT * FROM users ORDER BY created_at ASC')
      : await dbQuery<UserRow[]>('SELECT * FROM users WHERE id = ?', [session.userId]);

    return NextResponse.json(rows.map(mapUserRow));
  } catch (error) {
    console.error('Erro GET /api/users:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isMySqlConfigured) return NextResponse.json({ error: 'MySQL não configurado.' }, { status: 503 });

    const session = getSessionFromRequest(req);
    if (!session || !session.isAdmin) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

    const { name, email, password, isAdmin, emailVerified } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios.' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const exists = await dbQuery<UserRow[]>('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (exists.length > 0) {
      return NextResponse.json({ error: 'Email já cadastrado.' }, { status: 409 });
    }

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(String(password), 10);

    await dbExecute(
      `INSERT INTO users (
        id, name, email, password_hash, is_admin, email_verified,
        profile_json, subscription_json, billing_json
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL)`,
      [id, String(name).trim(), normalizedEmail, passwordHash, isAdmin ? 1 : 0, emailVerified ? 1 : 0]
    );

    const created = await dbQuery<UserRow[]>('SELECT * FROM users WHERE id = ?', [id]);
    return NextResponse.json(mapUserRow(created[0]));
  } catch (error) {
    console.error('Erro POST /api/users:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
