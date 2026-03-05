import { RowDataPacket } from 'mysql2/promise';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/server/auth';
import { dbExecute, dbQuery, isMySqlConfigured } from '@/lib/server/mysql';
import { mercadoPagoRequest } from '@/lib/server/mercadopago';

type UserSubscription = {
  plan: 'starter' | 'standard' | 'premium';
  status: 'active' | 'inactive' | 'cancelled';
  startDate: Date | string;
  endDate: Date | string;
  canDowngrade: boolean;
  downgradableDate?: Date | string;
  dietsUsedThisMonth: number;
  workoutsUsedThisMonth: number;
  bodyAnalysesUsedThisMonth: number;
  provider?: string;
  providerSubscriptionId?: string;
  providerStatus?: string;
};

type UserSubscriptionRow = RowDataPacket & {
  subscription_json: any;
};

function parseSubscription(value: any): UserSubscription | null {
  if (!value) return null;
  if (typeof value === 'object') return value as UserSubscription;
  try {
    return JSON.parse(value) as UserSubscription;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isMySqlConfigured) {
      return NextResponse.json({ error: 'MySQL não configurado.' }, { status: 503 });
    }

    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const rows = await dbQuery<UserSubscriptionRow[]>('SELECT subscription_json FROM users WHERE id = ?', [session.userId]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const currentSubscription = parseSubscription(rows[0].subscription_json);
    if (!currentSubscription) {
      return NextResponse.json({ error: 'Usuário não possui assinatura ativa.' }, { status: 400 });
    }

    const providerSubscriptionId = currentSubscription.providerSubscriptionId;
    const provider = String(currentSubscription.provider || '').toLowerCase();

    if (provider === 'mercadopago' && providerSubscriptionId) {
      await mercadoPagoRequest(`/preapproval/${providerSubscriptionId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' }),
      });
    }

    const now = new Date();
    const cancelledSubscription: UserSubscription = {
      ...currentSubscription,
      status: 'cancelled',
      endDate: now,
      canDowngrade: true,
      providerStatus: 'cancelled',
    };

    await dbExecute('UPDATE users SET subscription_json = ? WHERE id = ?', [JSON.stringify(cancelledSubscription), session.userId]);

    return NextResponse.json({ success: true, subscription: cancelledSubscription });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    const message = error instanceof Error ? error.message : 'Erro interno ao cancelar assinatura.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
