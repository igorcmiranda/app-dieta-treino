import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionFromRequest } from '@/lib/server/auth';
import { dbExecute, dbQuery, isMySqlConfigured } from '@/lib/server/mysql';
import { UserRow } from '@/lib/server/user-mapper';

export async function POST(req: NextRequest) {
  try {
    if (!isMySqlConfigured) {
      return NextResponse.json({ error: 'MySQL não configurado.' }, { status: 503 });
    }

    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Senha atual e nova senha são obrigatórias.' }, { status: 400 });
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
    }

    const rows = await dbQuery<UserRow[]>('SELECT * FROM users WHERE id = ?', [session.userId]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const user = rows[0];
    const validCurrentPassword = await bcrypt.compare(String(currentPassword), user.password_hash);
    if (!validCurrentPassword) {
      return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 });
    }

    const newPasswordHash = await bcrypt.hash(String(newPassword), 10);
    await dbExecute('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, session.userId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json({ error: 'Erro interno ao alterar senha.' }, { status: 500 });
  }
}
