const MP_API_BASE = 'https://api.mercadopago.com';

export function getMercadoPagoAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.');
  }
  return token;
}

export async function mercadoPagoRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getMercadoPagoAccessToken();
  const response = await fetch(`${MP_API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  const data = await response.json();

  if (!response.ok) {
    const providerCauses = Array.isArray(data?.causes)
      ? data.causes
      : Array.isArray(data?.cause)
      ? data.cause
      : [];
    const causes = providerCauses
          .map((item: any) => item?.description || item?.code)
          .filter(Boolean)
          .join(' | ');
    const message =
      causes ||
      data?.message ||
      data?.error_description ||
      data?.error ||
      `Erro Mercado Pago (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}
