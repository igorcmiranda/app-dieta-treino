import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSessionFromRequest } from '@/lib/server/auth';
import { dbExecute, dbQuery, isMySqlConfigured } from '@/lib/server/mysql';
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
  deviceId?: string | null;
  payer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
    address?: {
      zip_code?: string;
      street_name?: string;
      street_number?: string | number;
      neighborhood?: string;
      city?: string;
      federal_unit?: string;
    };
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
  const deviceId = String(input?.deviceId || '').trim();
  const payerEmail = String(input?.payer?.email || '').trim();
  const payerFirstName = String(input?.payer?.first_name || '').trim();
  const payerLastName = String(input?.payer?.last_name || '').trim();
  const payerPhoneAreaCode = sanitizeDigits(input?.payer?.phone?.area_code || '');
  const payerPhoneNumber = sanitizeDigits(input?.payer?.phone?.number || '');
  const payerZipCode = sanitizeDigits(input?.payer?.address?.zip_code || '');
  const payerStreetName = String(input?.payer?.address?.street_name || '').trim();
  const payerStreetNumberRaw = String(input?.payer?.address?.street_number || '').trim();
  const payerNeighborhood = String(input?.payer?.address?.neighborhood || '').trim();
  const payerCity = String(input?.payer?.address?.city || '').trim();
  const payerFederalUnit = String(input?.payer?.address?.federal_unit || '').trim().toUpperCase();
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
    deviceId,
    payerEmail,
    payerFirstName,
    payerLastName,
    payerPhoneAreaCode,
    payerPhoneNumber,
    payerZipCode,
    payerStreetName,
    payerStreetNumberRaw,
    payerNeighborhood,
    payerCity,
    payerFederalUnit,
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

async function ensurePaymentAttemptsTable() {
  if (!isMySqlConfigured) return;
  await dbExecute(`
    CREATE TABLE IF NOT EXISTS payment_attempts (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      plan VARCHAR(20) NOT NULL,
      provider VARCHAR(30) NOT NULL,
      payment_id VARCHAR(80) NULL,
      status VARCHAR(40) NULL,
      status_detail VARCHAR(120) NULL,
      amount DECIMAL(10,2) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_payment_attempts_user_created (user_id, created_at)
    )
  `);
}

async function savePaymentAttempt(params: {
  userId: string;
  plan: PlanId;
  paymentId?: string | number | null;
  status?: string | null;
  statusDetail?: string | null;
  amount?: number | null;
}) {
  if (!isMySqlConfigured) return;
  await ensurePaymentAttemptsTable();
  await dbExecute(
    `INSERT INTO payment_attempts (user_id, plan, provider, payment_id, status, status_detail, amount)
     VALUES (?, ?, 'mercadopago', ?, ?, ?, ?)`,
    [
      params.userId,
      params.plan,
      params.paymentId ? String(params.paymentId) : null,
      params.status || null,
      params.statusDetail || null,
      params.amount ?? null,
    ]
  );
}

async function getRecentAttempts(userId: string, limit = 5) {
  if (!isMySqlConfigured) return [];
  await ensurePaymentAttemptsTable();
  const rows = await dbQuery<any[]>(
    `SELECT payment_id, status, status_detail, amount, created_at
     FROM payment_attempts
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows.map((row) => ({
    paymentId: row.payment_id,
    status: row.status,
    statusDetail: row.status_detail,
    amount: row.amount,
    createdAt: row.created_at,
  }));
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
    const forwardedFor = req.headers.get('x-forwarded-for') || '';
    const ipAddress = forwardedFor.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined;

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

    if (!token) {
      return NextResponse.json({ error: 'Token de pagamento inválido.' }, { status: 400 });
    }

    const payerIdNumber = normalized.payerIdNumber || normalized.cpf;
    if (!payerIdNumber) {
      return NextResponse.json({ error: 'CPF do pagador é obrigatório.' }, { status: 400 });
    }

    const payerAddress =
      normalized.payerZipCode || normalized.payerStreetName || normalized.payerStreetNumberRaw
        ? {
            ...(normalized.payerZipCode ? { zip_code: normalized.payerZipCode } : {}),
            ...(normalized.payerStreetName ? { street_name: normalized.payerStreetName } : {}),
            ...(normalized.payerStreetNumberRaw && Number.isFinite(Number(normalized.payerStreetNumberRaw))
              ? { street_number: Number(normalized.payerStreetNumberRaw) }
              : {}),
          }
        : undefined;

    // 1) Primeira cobrança imediata para validar saldo/crédito real
    const firstPayment = await mercadoPagoRequest<any>('/v1/payments', {
      method: 'POST',
      headers: {
        'X-Idempotency-Key': randomUUID(),
        ...(normalized.deviceId ? { 'X-meli-session-id': normalized.deviceId } : {}),
      },
      body: JSON.stringify({
        transaction_amount: selectedPlan.amount,
        token,
        description: `FitAI Coach - Plano ${selectedPlan.name} (primeira cobrança)`,
        installments: normalized.installments,
        ...(paymentMethodId ? { payment_method_id: paymentMethodId } : {}),
        issuer_id: normalized.issuerId,
        binary_mode: true,
        capture: true,
        payer: {
          email: normalized.payerEmail || session.email,
          ...(normalized.payerFirstName ? { first_name: normalized.payerFirstName } : {}),
          ...(normalized.payerLastName ? { last_name: normalized.payerLastName } : {}),
          ...(normalized.payerPhoneAreaCode || normalized.payerPhoneNumber
            ? {
                phone: {
                  ...(normalized.payerPhoneAreaCode ? { area_code: normalized.payerPhoneAreaCode } : {}),
                  ...(normalized.payerPhoneNumber ? { number: normalized.payerPhoneNumber } : {}),
                },
              }
            : {}),
          ...(payerAddress ? { address: payerAddress } : {}),
          identification: {
            type: normalized.payerIdType,
            number: payerIdNumber,
          },
        },
        additional_info: {
          ...(ipAddress ? { ip_address: ipAddress } : {}),
          payer: {
            ...(normalized.payerFirstName ? { first_name: normalized.payerFirstName } : {}),
            ...(normalized.payerLastName ? { last_name: normalized.payerLastName } : {}),
            ...(normalized.payerPhoneAreaCode || normalized.payerPhoneNumber
              ? {
                  phone: {
                    ...(normalized.payerPhoneAreaCode ? { area_code: normalized.payerPhoneAreaCode } : {}),
                    ...(normalized.payerPhoneNumber ? { number: normalized.payerPhoneNumber } : {}),
                  },
                }
              : {}),
            ...(payerAddress ? { address: payerAddress } : {}),
          },
          items: [
            {
              id: `fitai-${selectedPlanId}`,
              title: `FitAI Coach - Plano ${selectedPlan.name}`,
              quantity: 1,
              unit_price: selectedPlan.amount,
            },
          ],
        },
        metadata: {
          app: 'fitai-coach',
          user_id: session.userId,
          plan: selectedPlanId,
          payer_neighborhood: normalized.payerNeighborhood || undefined,
          payer_city: normalized.payerCity || undefined,
          payer_state: normalized.payerFederalUnit || undefined,
        },
        external_reference: `${session.userId}|${selectedPlanId}|first_payment`,
      }),
    });

    const firstPaymentStatus = String(firstPayment?.status || '').toLowerCase();
    const firstPaymentStatusDetail = String(firstPayment?.status_detail || '').toLowerCase();
    const isFirstPaymentApproved = firstPaymentStatus === 'approved' && firstPaymentStatusDetail === 'accredited';

    await savePaymentAttempt({
      userId: session.userId,
      plan: selectedPlanId,
      paymentId: firstPayment?.id,
      status: firstPayment?.status,
      statusDetail: firstPayment?.status_detail,
      amount: Number(firstPayment?.transaction_amount || selectedPlan.amount),
    });

    if (!isFirstPaymentApproved) {
      const recentAttempts = await getRecentAttempts(session.userId, 5);
      return NextResponse.json(
        {
          error: firstPayment?.status_detail || firstPayment?.status || 'Pagamento não aprovado pelo Mercado Pago.',
          providerStatus: firstPayment?.status,
          providerStatusDetail: firstPayment?.status_detail,
          paymentId: firstPayment?.id,
          transactionAmount: firstPayment?.transaction_amount,
          recentAttempts,
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
          recentAttempts: await getRecentAttempts(session.userId, 5),
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
      payment_method_id: paymentMethodId || null,
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
    const includeAttempts = req.nextUrl.searchParams.get('attempts') === '1';
    if (!id) {
      if (includeAttempts) {
        const session = getSessionFromRequest(req);
        if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
        return NextResponse.json({ attempts: await getRecentAttempts(session.userId, 20) });
      }
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
