import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/server/auth';
import { dbExecute, isMySqlConfigured } from '@/lib/server/mysql';
import { mercadoPagoRequest } from '@/lib/server/mercadopago';

type PlanId = 'starter' | 'standard' | 'premium';

const PLAN_CONFIG: Record<PlanId, { name: string; amount: number }> = {
  starter: { name: 'Starter', amount: 19.97 },
  standard: { name: 'Standard', amount: 29.97 },
  premium: { name: 'Premium', amount: 49.97 },
};

type PaymentInput = {
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardName?: string;
  cpf?: string;
};

function sanitizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function normalizePaymentInput(input: PaymentInput) {
  const cardNumber = sanitizeDigits(input.cardNumber || '');
  const cvv = sanitizeDigits(input.cvv || '');
  const cpf = sanitizeDigits(input.cpf || '');
  const [rawMonth, rawYear] = String(input.expiryDate || '').split('/');
  const month = sanitizeDigits(rawMonth || '');
  const year = sanitizeDigits(rawYear || '');

  return {
    cardNumber,
    cvv,
    cpf,
    cardName: String(input.cardName || '').trim(),
    month,
    year: year.length === 2 ? `20${year}` : year,
  };
}

function buildLocalSubscription(plan: PlanId, providerSubscriptionId: string | null, providerStatus: string) {
  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    plan,
    status: 'active' as const,
    startDate: now,
    endDate,
    canDowngrade: false,
    downgradableDate: new Date(now.getTime() + 4 * 30 * 24 * 60 * 60 * 1000),
    dietsUsedThisMonth: 0,
    workoutsUsedThisMonth: 0,
    bodyAnalysesUsedThisMonth: 0,
    provider: 'mercadopago',
    providerSubscriptionId,
    providerStatus,
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const { plan, paymentData } = await req.json();
    if (!plan || !PLAN_CONFIG[plan as PlanId]) {
      return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 });
    }

    const selectedPlanId = plan as PlanId;
    const selectedPlan = PLAN_CONFIG[selectedPlanId];
    const normalizedPayment = normalizePaymentInput(paymentData || {});

    const cardToken = await mercadoPagoRequest<{ id: string; payment_method_id?: string; first_six_digits?: string; last_four_digits?: string }>(
      '/v1/card_tokens',
      {
        method: 'POST',
        body: JSON.stringify({
          card_number: normalizedPayment.cardNumber,
          expiration_month: normalizedPayment.month,
          expiration_year: normalizedPayment.year,
          security_code: normalizedPayment.cvv,
          cardholder: {
            name: normalizedPayment.cardName,
            identification: {
              type: 'CPF',
              number: normalizedPayment.cpf,
            },
          },
        }),
      }
    );

    // 1) Cobra o primeiro mês imediatamente para validar crédito/saldo de verdade.
    const firstPayment = await mercadoPagoRequest<any>('/v1/payments', {
      method: 'POST',
      body: JSON.stringify({
        transaction_amount: selectedPlan.amount,
        token: cardToken.id,
        description: `FitAI Coach - Plano ${selectedPlan.name} (primeira cobrança)`,
        installments: 1,
        payment_method_id: cardToken.payment_method_id,
        payer: {
          email: session.email,
          identification: {
            type: 'CPF',
            number: normalizedPayment.cpf,
          },
        },
        external_reference: `${session.userId}|${selectedPlanId}|first_payment`,
      }),
    });

    const firstPaymentStatus = String(firstPayment?.status || '').toLowerCase();
    if (firstPaymentStatus !== 'approved') {
      return NextResponse.json(
        {
          error: firstPayment?.status_detail || 'Pagamento não aprovado pelo Mercado Pago.',
          providerStatus: firstPayment?.status,
          providerStatusDetail: firstPayment?.status_detail,
          paymentId: firstPayment?.id,
        },
        { status: 402 }
      );
    }

    // 2) Se a cobrança foi aprovada, cria a assinatura recorrente mensal.
    const backUrl = `${req.nextUrl.origin}/?subscription_checkout=mercadopago`;
    const preapproval = await mercadoPagoRequest<any>('/preapproval', {
      method: 'POST',
      body: JSON.stringify({
        reason: `FitAI Coach - Plano ${selectedPlan.name}`,
        external_reference: `${session.userId}|${selectedPlanId}`,
        payer_email: session.email,
        card_token_id: cardToken.id,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: selectedPlan.amount,
          currency_id: 'BRL',
        },
        back_url: backUrl,
        status: 'authorized',
      }),
    });

    const preapprovalStatus = String(preapproval?.status || '').toLowerCase();
    const isAuthorized = preapprovalStatus === 'authorized';

    if (!isAuthorized) {
      const initPoint = preapproval?.init_point || preapproval?.sandbox_init_point;
      if (initPoint) {
        return NextResponse.json({
          success: false,
          requiresAction: true,
          id: preapproval?.id,
          status: preapproval?.status,
          init_point: preapproval?.init_point,
          sandbox_init_point: preapproval?.sandbox_init_point,
        });
      }

      return NextResponse.json(
        {
          error: 'Pagamento não autorizado pelo Mercado Pago.',
          providerStatus: preapproval?.status,
          id: preapproval?.id,
        },
        { status: 402 }
      );
    }

    const subscription = buildLocalSubscription(selectedPlanId, preapproval?.id || null, preapproval?.status || 'authorized');

    if (isMySqlConfigured) {
      await dbExecute('UPDATE users SET subscription_json = ? WHERE id = ?', [JSON.stringify(subscription), session.userId]);
    }

    return NextResponse.json({
      success: true,
      id: preapproval?.id,
      status: preapproval?.status,
      first_payment_id: firstPayment?.id,
      first_payment_status: firstPayment?.status,
      payer_email: preapproval?.payer_email || session.email,
      payment_method_id: cardToken.payment_method_id,
      card_last4: cardToken.last_four_digits,
      subscription,
    });
  } catch (error) {
    console.error('Erro ao criar assinatura Mercado Pago:', error);
    const message = error instanceof Error ? error.message : 'Erro interno ao criar assinatura.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({
        plans: Object.entries(PLAN_CONFIG).map(([key, value]) => ({
          id: key,
          name: value.name,
          amount: value.amount,
          currency: 'BRL',
          recurrence: 'monthly',
        })),
      });
    }

    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const result = await mercadoPagoRequest<any>(`/preapproval/${id}`, {
      method: 'GET',
    });

    const externalReference = String(result?.external_reference || '');
    const [ownerUserId] = externalReference.split('|');

    if (ownerUserId && ownerUserId !== session.userId) {
      return NextResponse.json({ error: 'Assinatura não pertence ao usuário logado.' }, { status: 403 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao consultar assinatura Mercado Pago:', error);
    const message = error instanceof Error ? error.message : 'Erro interno ao consultar assinatura.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
