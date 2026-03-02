"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Crown,
  Star,
  Zap,
  Shield,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { UserSubscription } from '@/lib/types';
import { useCurrentUser } from '@/lib/hooks';

interface PaymentScreenProps {
  selectedPlan: 'starter' | 'standard' | 'premium';
  onBack: () => void;
  onPaymentSuccess: (subscription: UserSubscription) => void;
}

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

const planDetails = {
  starter: {
    name: 'Starter',
    price: 19.97,
    icon: <Zap className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-600'
  },
  standard: {
    name: 'Standard',
    price: 29.97,
    icon: <Star className="w-6 h-6" />,
    color: 'from-blue-500 to-indigo-600'
  },
  premium: {
    name: 'Premium',
    price: 49.97,
    icon: <Crown className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-600'
  }
};

const BRICK_CONTAINER_ID = 'mp-card-payment-brick-container';

function loadMercadoPagoSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.MercadoPago) return Promise.resolve();

  const existingScript = document.querySelector<HTMLScriptElement>('script[data-mp-sdk="v2"]');
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Falha ao carregar SDK do Mercado Pago.')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-mp-sdk', 'v2');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar SDK do Mercado Pago.'));
    document.head.appendChild(script);
  });
}

export function PaymentScreen({ selectedPlan, onBack, onPaymentSuccess }: PaymentScreenProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isBrickLoading, setIsBrickLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolvedPublicKey, setResolvedPublicKey] = useState<string>('');
  const brickControllerRef = useRef<any>(null);
  const { currentUser } = useCurrentUser();

  const plan = planDetails[selectedPlan];
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

  const payerEmail = useMemo(() => currentUser?.email || '', [currentUser?.email]);

  useEffect(() => {
    let active = true;

    const loadPublicKey = async () => {
      if (publicKey) {
        setResolvedPublicKey(publicKey);
        return;
      }

      try {
        const response = await fetch('/api/mercadopago/public-key', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Não foi possível carregar a chave pública do Mercado Pago.');
        }
        if (active) {
          setResolvedPublicKey(String(data?.publicKey || ''));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível carregar a chave pública do Mercado Pago.';
        if (active) {
          setErrors({ general: message });
          setIsBrickLoading(false);
        }
      }
    };

    void loadPublicKey();
    return () => {
      active = false;
    };
  }, [publicKey]);

  useEffect(() => {
    let cancelled = false;

    if (!resolvedPublicKey) {
      return () => {
        cancelled = true;
      };
    }

    const initBrick = async () => {
      try {
        setErrors({});
        setIsBrickLoading(true);

        if (!resolvedPublicKey) {
          throw new Error('Chave pública do Mercado Pago não configurada.');
        }

        await loadMercadoPagoSdk();
        if (cancelled) return;

        if (!window.MercadoPago) {
          throw new Error('SDK do Mercado Pago não disponível no navegador.');
        }

        const previousBrick = brickControllerRef.current;
        if (previousBrick?.unmount) {
          await previousBrick.unmount();
          brickControllerRef.current = null;
        }

        const mp = new window.MercadoPago(resolvedPublicKey, { locale: 'pt-BR' });
        const bricksBuilder = mp.bricks();

        const controller = await bricksBuilder.create('cardPayment', BRICK_CONTAINER_ID, {
          initialization: {
            amount: plan.price,
            payer: {
              email: payerEmail,
            },
          },
          customization: {
            paymentMethods: {
              maxInstallments: 1,
            },
          },
          callbacks: {
            onReady: () => {
              if (!cancelled) setIsBrickLoading(false);
            },
            onSubmit: async (formData: any) => {
              setIsProcessing(true);
              setErrors({});

              try {
                const response = await fetch('/api/mercadopago/subscriptions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    plan: selectedPlan,
                    paymentData: formData,
                  }),
                });

                const result = await response.json();
                if (!response.ok) {
                  throw new Error(result?.error || 'Erro ao processar assinatura no Mercado Pago.');
                }

                if (result?.requiresAction) {
                  const checkoutUrl = result?.init_point || result?.sandbox_init_point;
                  if (checkoutUrl) {
                    window.location.href = checkoutUrl;
                    return;
                  }
                  throw new Error('O Mercado Pago solicitou uma etapa adicional de autenticação.');
                }

                const isConfirmedPayment =
                  result?.success === true &&
                  String(result?.first_payment_status || '').toLowerCase() === 'approved' &&
                  String(result?.status || '').toLowerCase() === 'authorized' &&
                  Boolean(result?.subscription);

                if (!isConfirmedPayment) {
                  const providerDetail = result?.providerStatusDetail || result?.providerStatus || result?.status_detail;
                  throw new Error(
                    providerDetail
                      ? `Pagamento não aprovado: ${providerDetail}`
                      : 'Pagamento não aprovado pelo Mercado Pago.'
                  );
                }

                onPaymentSuccess(result.subscription as UserSubscription);
              } catch (error) {
                const message = error instanceof Error ? error.message : 'Erro ao processar pagamento.';
                setErrors({ general: message });
                throw error;
              } finally {
                setIsProcessing(false);
              }
            },
            onError: (error: any) => {
              const message = error?.message || error?.cause?.[0]?.description || 'Erro no checkout do Mercado Pago.';
              setErrors({ general: message });
              setIsBrickLoading(false);
            },
          },
        });

        brickControllerRef.current = controller;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao inicializar checkout.';
        setErrors({ general: message });
        setIsBrickLoading(false);
      }
    };

    void initBrick();

    return () => {
      cancelled = true;
      const brick = brickControllerRef.current;
      if (brick?.unmount) {
        void brick.unmount();
      }
      brickControllerRef.current = null;
    };
  }, [payerEmail, plan.price, resolvedPublicKey, selectedPlan, onPaymentSuccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-4 text-blue-600 hover:text-blue-700"
              disabled={isProcessing}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos planos
            </Button>

            <Card className="shadow-xl border-blue-100 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-blue-900 dark:text-blue-100">
                  <div className={`p-3 bg-gradient-to-r ${plan.color} rounded-full text-white`}>
                    {plan.icon}
                  </div>
                  Resumo do pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 dark:text-blue-200">Plano selecionado:</span>
                  <Badge className={`bg-gradient-to-r ${plan.color} text-white`}>
                    {plan.name}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-lg font-semibold">
                  <span className="text-blue-800 dark:text-blue-200">Valor mensal:</span>
                  <span className="text-blue-900 dark:text-blue-100">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-xl font-bold">
                    <span className="text-blue-900 dark:text-blue-100">Total:</span>
                    <span className="text-blue-900 dark:text-blue-100">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                      Cobrança recorrente
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Renovação automática todo mês. Cancele quando quiser.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-xl border-blue-100 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <CreditCard className="w-5 h-5" />
                Pagamento com Mercado Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isBrickLoading && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                  Carregando checkout seguro...
                </div>
              )}

              <div id={BRICK_CONTAINER_ID} className={isProcessing ? 'pointer-events-none opacity-70' : ''} />

              {errors.general && (
                <div className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-950 p-2 rounded">
                  {errors.general}
                </div>
              )}

              <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                    Checkout seguro oficial Mercado Pago
                  </span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Os dados do cartão são capturados e tokenizados pelo SDK oficial do Mercado Pago.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
