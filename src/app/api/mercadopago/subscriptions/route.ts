import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/server/auth';
import { mercadoPagoRequest } from '@/lib/server/mercadopago';

type PlanId = 'starter' | 'standard' | 'premium';

const PLAN_CONFIG: Record<PlanId, { name: string; amount: number }> = {
  starter: { name: 'Starter', amount: 19.97 },
  standard: { name: 'Standard', amount: 29.97 },
  premium: { name: 'Premium', amount: 49.97 },
};

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const { plan } = await req.json();
    if (!plan || !PLAN_CONFIG[plan as PlanId]) {
      return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 });
    }

    const selectedPlan = PLAN_CONFIG[plan as PlanId];
    const backUrl = `${req.nextUrl.origin}/?subscription_checkout=mercadopago`;

    const payload = {
      reason: `FitAI Coach - Plano ${selectedPlan.name}`,
      external_reference: `${session.userId}|${plan}`,
      payer_email: session.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: selectedPlan.amount,
        currency_id: 'BRL',
      },
      back_url: backUrl,
      status: 'pending',
    };

    const result = await mercadoPagoRequest<any>('/preapproval', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return NextResponse.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      status: result.status,
    });
  } catch (error) {
    console.error('Erro ao criar assinatura Mercado Pago:', error);
    const message = error instanceof Error ? error.message : 'Erro interno ao criar assinatura.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID da assinatura é obrigatório.' }, { status: 400 });
    }

    const result = await mercadoPagoRequest<any>(`/preapproval/${id}`, {
      method: 'GET',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao consultar assinatura Mercado Pago:', error);
    const message = error instanceof Error ? error.message : 'Erro interno ao consultar assinatura.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
