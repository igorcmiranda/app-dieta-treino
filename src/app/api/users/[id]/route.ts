import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/server/auth';
import { dbExecute, dbQuery, isMySqlConfigured } from '@/lib/server/mysql';
import { mapUserRow, UserRow } from '@/lib/server/user-mapper';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isMySqlConfigured) return NextResponse.json({ error: 'MySQL não configurado.' }, { status: 503 });

    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

    const { id } = await params;
    if (!session.isAdmin && session.userId !== id) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const body = await req.json();
    const fields: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
    if (body.email !== undefined) { fields.push('email = ?'); values.push(String(body.email).toLowerCase()); }
    if (body.phone !== undefined) { fields.push('phone = ?'); values.push(body.phone || null); }
    if (body.cpf !== undefined) { fields.push('cpf = ?'); values.push(body.cpf || null); }
    if (body.emailVerified !== undefined) { fields.push('email_verified = ?'); values.push(body.emailVerified ? 1 : 0); }
    if (body.profile !== undefined) { fields.push('profile_json = ?'); values.push(body.profile ? JSON.stringify(body.profile) : null); }
    if (body.subscription !== undefined) { fields.push('subscription_json = ?'); values.push(body.subscription ? JSON.stringify(body.subscription) : null); }
    if (body.billing !== undefined) { fields.push('billing_json = ?'); values.push(body.billing ? JSON.stringify(body.billing) : null); }

    if (session.isAdmin && body.isAdmin !== undefined) {
      fields.push('is_admin = ?');
      values.push(body.isAdmin ? 1 : 0);
    }

    if (fields.length === 0) {
      const current = await dbQuery<UserRow[]>('SELECT * FROM users WHERE id = ?', [id]);
      if (current.length === 0) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
      return NextResponse.json(mapUserRow(current[0]));
    }

    values.push(id);
    await dbExecute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    const updated = await dbQuery<UserRow[]>('SELECT * FROM users WHERE id = ?', [id]);
    if (updated.length === 0) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

    return NextResponse.json(mapUserRow(updated[0]));
  } catch (error) {
    console.error('Erro PUT /api/users/[id]:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isMySqlConfigured) return NextResponse.json({ error: 'MySQL não configurado.' }, { status: 503 });

    const session = getSessionFromRequest(req);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const { id } = await params;
    await dbExecute('DELETE FROM users WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro DELETE /api/users/[id]:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
