import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
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
  token?: string;
  payment_method_id?: string;
  issuer_id?: string | number;
  installments?: string | number;
  payer?: {
    email?: string;
    identification?: {
      type?: string;
      number?: string;
    };
  };

  // fallback legado
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardName?: string;
  cpf?: string;
};

function sanitizeDigits(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

function normalizePaymentInput(input: PaymentInput) {
  const token = String(input?.token || '').trim();
  const paymentMethodId = String(input?.payment_method_id || '').trim();
  const payerEmail = String(input?.payer?.email || '').trim();
  const payerIdType = String(input?.payer?.identification?.type || 'CPF').trim() || 'CPF';
  const payerIdNumber = sanitizeDigits(input?.payer?.identification?.number || '');

  const installmentsRaw = Number(input?.installments || 1);
  const installments = Number.isFinite(installmentsRaw) && installmentsRaw > 0 ? Math.floor(installmentsRaw) : 1;

  const issuerIdRaw = input?.issuer_id;
  const issuerId = issuerIdRaw !== undefined && issuerIdRaw !== null && String(issuerIdRaw).trim() !== ''
    ? Number(issuerIdRaw)
    : undefined;

  // fallback para cartão manual (se token não veio)
  const cardNumber = sanitizeDigits(input?.cardNumber || '');
  const cvv = sanitizeDigits(input?.cvv || '');
  const cpf = sanitizeDigits(input?.cpf || payerIdNumber);
  const cardName = String(input?.cardName || '').trim();

  const expiryDigits = sanitizeDigits(input?.expiryDate || '');
  const monthRaw = expiryDigits.slice(0, 2);
  const yearRaw = expiryDigits.slice(2);
  const month = Number(monthRaw);
  const year = yearRaw.length >= 4 ? Number(yearRaw.slice(0, 4)) : yearRaw.length >= 2 ? 2000 + Number(yearRaw.slice(0, 2)) : NaN;

  return {
    token,
    paymentMethodId,
    payerEmail,
    payerIdType,
    payerIdNumber,
    installments,
    issuerId: issuerId !== undefined && Number.isFinite(issuerId) ? issuerId : undefined,
    cardNumber,
    cvv,
    cpf,
    cardName,
    month: Number.isFinite(month) && month >= 1 && month <= 12 ? month : null,
    year: Number.isFinite(year) ? year : null,
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
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

    const { plan, paymentData } = await req.json();
    if (!plan || !PLAN_CONFIG[plan as PlanId]) {
      return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 });
    }

    const selectedPlanId = plan as PlanId;
    const selectedPlan = PLAN_CONFIG[selectedPlanId];
    const normalized = normalizePaymentInput(paymentData || {});

    let token = normalized.token;
    let paymentMethodId = normalized.paymentMethodId;
    let cardLast4: string | undefined;

    // Fallback legado: gera token com dados manuais se não veio token do Brick
    if (!token) {
      if (!normalized.cardNumber || !normalized.cvv || !normalized.cardName || !normalized.cpf || !normalized.month || !normalized.year) {
        return NextResponse.json({ error: 'Dados do cartão incompletos.' }, { status: 400 });
      }

      const cardToken = await mercadoPagoRequest<{ id: string; payment_method_id?: string; last_four_digits?: string }>(
        '/v1/card_tokens',
        {
          method: 'POST',
          body: JSON.stringify({
            card_number: normalized.cardNumber,
            expiration_month: normalized.month,
            expiration_year: normalized.year,
            security_code: normalized.cvv,
            cardholder: {
              name: normalized.cardName,
              identification: {
                type: 'CPF',
                number: normalized.cpf,
              },
            },
          }),
        }
      );

      token = cardToken.id;
      paymentMethodId = paymentMethodId || cardToken.payment_method_id || '';
      cardLast4 = cardToken.last_four_digits;
    }

    if (!token || !paymentMethodId) {
      return NextResponse.json({ error: 'Token de pagamento inválido.' }, { status: 400 });
    }

    const payerIdNumber = normalized.payerIdNumber || normalized.cpf;
    if (!payerIdNumber) {
      return NextResponse.json({ error: 'CPF do pagador é obrigatório.' }, { status: 400 });
    }

    // 1) Primeira cobrança imediata para validar saldo/crédito real
    const firstPayment = await mercadoPagoRequest<any>('/v1/payments', {
      method: 'POST',
      headers: {
        'X-Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: selectedPlan.amount,
        token,
        description: `FitAI Coach - Plano ${selectedPlan.name} (primeira cobrança)`,
        installments: normalized.installments,
        payment_method_id: paymentMethodId,
        issuer_id: normalized.issuerId,
        binary_mode: true,
        capture: true,
        payer: {
          email: normalized.payerEmail || session.email,
          identification: {
            type: normalized.payerIdType,
            number: payerIdNumber,
          },
        },
        external_reference: `${session.userId}|${selectedPlanId}|first_payment`,
      }),
    });

    const firstPaymentStatus = String(firstPayment?.status || '').toLowerCase();
    const firstPaymentStatusDetail = String(firstPayment?.status_detail || '').toLowerCase();
    const isFirstPaymentApproved = firstPaymentStatus === 'approved' && firstPaymentStatusDetail === 'accredited';

    if (!isFirstPaymentApproved) {
      return NextResponse.json(
        {
          error: firstPayment?.status_detail || firstPayment?.status || 'Pagamento não aprovado pelo Mercado Pago.',
          providerStatus: firstPayment?.status,
          providerStatusDetail: firstPayment?.status_detail,
          paymentId: firstPayment?.id,
          transactionAmount: firstPayment?.transaction_amount,
        },
        { status: 402 }
      );
    }

    // 2) Com primeira cobrança aprovada, cria assinatura recorrente
    const backUrl = `${req.nextUrl.origin}/?subscription_checkout=mercadopago`;
    const preapproval = await mercadoPagoRequest<any>('/preapproval', {
      method: 'POST',
      body: JSON.stringify({
        reason: `FitAI Coach - Plano ${selectedPlan.name}`,
        external_reference: `${session.userId}|${selectedPlanId}`,
        payer_email: normalized.payerEmail || session.email,
        card_token_id: token,
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
    if (preapprovalStatus !== 'authorized') {
      return NextResponse.json(
        {
          error: 'Assinatura não autorizada após pagamento aprovado.',
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
      first_payment_status_detail: firstPayment?.status_detail,
      payer_email: preapproval?.payer_email || session.email,
      payment_method_id: paymentMethodId,
      card_last4: cardLast4,
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
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

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
