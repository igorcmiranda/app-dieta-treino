import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbQuery, isMySqlConfigured } from '@/lib/server/mysql';
import { mapUserRow, UserRow } from '@/lib/server/user-mapper';
import { setSessionCookie, signSession } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  try {
    if (!isMySqlConfigured) {
      return NextResponse.json({ error: 'MySQL não configurado.' }, { status: 503 });
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const rows = await dbQuery<UserRow[]>('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }

    const row = rows[0];
    const valid = await bcrypt.compare(String(password), row.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }

    const user = mapUserRow(row);
    const token = signSession({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      name: user.name,
    });

    const response = NextResponse.json({ user });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Erro interno no login.' }, { status: 500 });
  }
}
