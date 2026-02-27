import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { dbExecute, dbQuery, isMySqlConfigured } from '@/lib/server/mysql';
import { mapUserRow, UserRow } from '@/lib/server/user-mapper';
import { setSessionCookie, signSession } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  try {
    if (!isMySqlConfigured) {
      return NextResponse.json({ error: 'MySQL não configurado.' }, { status: 503 });
    }

    const { name, email, password, phone, cpf } = await req.json();

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
        id, name, email, password_hash, phone, cpf, is_admin, email_verified,
        profile_json, subscription_json, billing_json
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 1, NULL, NULL, NULL)`,
      [id, String(name).trim(), normalizedEmail, passwordHash, phone || null, cpf || null]
    );

    const created = await dbQuery<UserRow[]>('SELECT * FROM users WHERE id = ?', [id]);
    const user = mapUserRow(created[0]);

    const token = signSession({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      name: user.name,
    });

    const response = NextResponse.json({ user, requiresEmailVerification: false });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json({ error: 'Erro interno no registro.' }, { status: 500 });
  }
}
