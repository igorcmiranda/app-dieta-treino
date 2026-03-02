import { NextRequest, NextResponse } from 'next/server';
import { dbExecute, isMySqlConfigured } from '@/lib/server/mysql';
import { mercadoPagoRequest } from '@/lib/server/mercadopago';

type PlanId = 'starter' | 'standard' | 'premium';

function extractPlan(externalReference?: string | null): PlanId | null {
  if (!externalReference) return null;
  const [, plan] = externalReference.split('|');
  if (plan === 'starter' || plan === 'standard' || plan === 'premium') return plan;
  return null;
}

function extractUserId(externalReference?: string | null): string | null {
  if (!externalReference) return null;
  const [userId] = externalReference.split('|');
  return userId || null;
}

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const body = await req.json().catch(() => ({}));

    const candidateId =
      body?.data?.id ||
      body?.id ||
      searchParams.get('data.id') ||
      searchParams.get('id') ||
      null;

    if (!candidateId) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const subscription = await mercadoPagoRequest<any>(`/preapproval/${candidateId}`, {
      method: 'GET',
    });

    const externalReference: string | null = subscription?.external_reference || null;
    const userId = extractUserId(externalReference);
    const plan = extractPlan(externalReference);

    if (!userId || !plan) {
      return NextResponse.json({ received: true, ignored: true });
    }

    if (isMySqlConfigured) {
      const mpStatus = String(subscription?.status || '').toLowerCase();
      const isActive = mpStatus === 'authorized';
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const subscriptionJson = {
        plan,
        status: isActive ? 'active' : 'inactive',
        startDate: now,
        endDate,
        canDowngrade: false,
        downgradableDate: new Date(now.getTime() + 4 * 30 * 24 * 60 * 60 * 1000),
        dietsUsedThisMonth: 0,
        workoutsUsedThisMonth: 0,
        bodyAnalysesUsedThisMonth: 0,
        provider: 'mercadopago',
        providerSubscriptionId: subscription?.id,
        providerStatus: subscription?.status,
      };

      await dbExecute(
        'UPDATE users SET subscription_json = ? WHERE id = ?',
        [JSON.stringify(subscriptionJson), userId]
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook Mercado Pago:', error);
    return NextResponse.json({ received: true, error: true });
  }
}
