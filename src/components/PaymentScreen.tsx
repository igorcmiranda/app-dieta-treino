"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    MP_DEVICE_SESSION_ID?: string;
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
const CHECKOUT_UI_VERSION = 3;

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

function loadMercadoPagoSecuritySdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.MP_DEVICE_SESSION_ID) return Promise.resolve();

  const existingScript = document.querySelector<HTMLScriptElement>('script[data-mp-security-sdk="v2"]');
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Falha ao carregar SDK de segurança do Mercado Pago.')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://www.mercadopago.com/v2/security.js';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-mp-security-sdk', 'v2');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar SDK de segurança do Mercado Pago.'));
    document.head.appendChild(script);
  });
}

export function PaymentScreen({ selectedPlan, onBack, onPaymentSuccess }: PaymentScreenProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isBrickLoading, setIsBrickLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolvedPublicKey, setResolvedPublicKey] = useState('');
  const [payerData, setPayerData] = useState({
    fullName: '',
    email: '',
    cpf: '',
    phone: '',
    zipCode: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    complement: '',
  });
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState('');
  const { currentUser } = useCurrentUser();
  const brickControllerRef = useRef<any>(null);
  const payerDataRef = useRef(payerData);
  const currentUserRef = useRef(currentUser);

  const plan = planDetails[selectedPlan];
  const directPublicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
  const payerEmail = useMemo(() => {
    const email = payerData.email.trim();
    if (email) return email;
    return currentUser?.email || '';
  }, [payerData.email, currentUser?.email]);

  useEffect(() => {
    if (!currentUser) return;
    setPayerData({
      fullName: currentUser.name || '',
      email: currentUser.email || '',
      cpf: currentUser.cpf || '',
      phone: currentUser.phone || '',
      zipCode: currentUser.billing?.zipCode || '',
      street: currentUser.billing?.street || '',
      number: currentUser.billing?.number || '',
      neighborhood: currentUser.billing?.neighborhood || '',
      city: currentUser.billing?.city || '',
      state: currentUser.billing?.state || '',
      complement: '',
    });
  }, [currentUser]);

  useEffect(() => {
    payerDataRef.current = payerData;
  }, [payerData]);

  useEffect(() => {
    const cepDigits = payerData.zipCode.replace(/\D/g, '');
    if (cepDigits.length !== 8) {
      setCepError('');
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        setIsLoadingCep(true);
        setCepError('');
        const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || data?.erro) {
          throw new Error('CEP não encontrado.');
        }
        if (!active) return;
        setPayerData((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      } catch (error) {
        if (!active) return;
        setCepError(error instanceof Error ? error.message : 'Erro ao buscar CEP.');
      } finally {
        if (active) setIsLoadingCep(false);
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [payerData.zipCode]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    let active = true;

    const loadPublicKey = async () => {
      if (directPublicKey) {
        setResolvedPublicKey(directPublicKey);
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
  }, [directPublicKey]);

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

        await loadMercadoPagoSdk();
        await loadMercadoPagoSecuritySdk();
        if (cancelled) return;

        if (!window.MercadoPago) {
          throw new Error('SDK do Mercado Pago não disponível no navegador.');
        }

        if (brickControllerRef.current?.unmount) {
          await brickControllerRef.current.unmount();
          brickControllerRef.current = null;
        }

        const mp = new window.MercadoPago(resolvedPublicKey, { locale: 'pt-BR' });
        const bricksBuilder = mp.bricks();
        const initialization: Record<string, any> = {
          amount: plan.price,
        };

        if (payerEmail) {
          initialization.payer = { email: payerEmail };
        }

        const controller = await bricksBuilder.create('cardPayment', BRICK_CONTAINER_ID, {
          initialization,
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
                const cleanDigits = (value: string) => value.replace(/\D/g, '');
                const latestPayerData = payerDataRef.current;
                const latestUser = currentUserRef.current;
                const fullName = latestPayerData.fullName.trim() || latestUser?.name || '';
                const nameParts = fullName.split(' ').filter(Boolean);
                const firstName = nameParts[0] || fullName;
                const lastName = nameParts.slice(1).join(' ');
                const phoneDigits = cleanDigits(latestPayerData.phone);
                const areaCode = phoneDigits.length >= 10 ? phoneDigits.slice(0, 2) : '';
                const phoneNumber = phoneDigits.length >= 10 ? phoneDigits.slice(2) : phoneDigits;
                const cpfDigits = cleanDigits(latestPayerData.cpf || latestUser?.cpf || '');

                const response = await fetch('/api/mercadopago/subscriptions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    plan: selectedPlan,
                    paymentData: {
                      ...formData,
                      deviceId: window.MP_DEVICE_SESSION_ID || null,
                      payer: {
                        ...(formData?.payer || {}),
                        email: payerEmail || formData?.payer?.email,
                        first_name: firstName || formData?.payer?.first_name,
                        last_name: lastName || formData?.payer?.last_name,
                        identification: {
                          type: 'CPF',
                          number: cpfDigits || formData?.payer?.identification?.number,
                        },
                        ...(phoneNumber
                          ? {
                              phone: {
                                ...(areaCode ? { area_code: areaCode } : {}),
                                number: phoneNumber,
                              },
                            }
                          : {}),
                        address: {
                          zip_code: cleanDigits(latestPayerData.zipCode),
                          street_name: latestPayerData.street.trim(),
                          street_number: latestPayerData.number.trim(),
                          neighborhood: latestPayerData.neighborhood.trim(),
                          city: latestPayerData.city.trim(),
                          federal_unit: latestPayerData.state.trim().toUpperCase(),
                          complement: latestPayerData.complement.trim(),
                        },
                      },
                    },
                  }),
                });

                const result = await response.json();
                if (!response.ok) {
                  throw new Error(result?.error || 'Erro ao processar assinatura no Mercado Pago.');
                }

                const isConfirmedPayment =
                  result?.success === true &&
                  String(result?.first_payment_status || '').toLowerCase() === 'approved' &&
                  String(result?.first_payment_status_detail || '').toLowerCase() === 'accredited' &&
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
              const providerDetail =
                error?.cause?.[0]?.description ||
                error?.cause?.[0]?.code ||
                error?.error ||
                error?.message;
              const message = providerDetail || 'Erro no checkout do Mercado Pago.';
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
      if (brickControllerRef.current?.unmount) {
        void brickControllerRef.current.unmount();
      }
      brickControllerRef.current = null;
    };
  }, [resolvedPublicKey, plan.price, payerEmail, selectedPlan, onPaymentSuccess]);

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
              <div className="mb-2 inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                Versão {CHECKOUT_UI_VERSION}
              </div>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <CreditCard className="w-5 h-5" />
                Pagamento com Mercado Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="payer-full-name">Nome do titular</Label>
                  <Input
                    id="payer-full-name"
                    value={payerData.fullName}
                    onChange={(e) => setPayerData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Nome completo"
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payer-cpf">CPF do titular</Label>
                  <Input
                    id="payer-cpf"
                    value={payerData.cpf}
                    onChange={(e) => setPayerData(prev => ({ ...prev, cpf: e.target.value }))}
                    placeholder="000.000.000-00"
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payer-phone">Telefone</Label>
                  <Input
                    id="payer-phone"
                    value={payerData.phone}
                    onChange={(e) => setPayerData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payer-zip">CEP</Label>
                  <Input
                    id="payer-zip"
                    value={payerData.zipCode}
                    onChange={(e) => setPayerData(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="00000-000"
                    disabled={isProcessing}
                  />
                  {isLoadingCep && <p className="text-xs text-slate-500">Buscando CEP...</p>}
                  {cepError && <p className="text-xs text-red-600">{cepError}</p>}
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="payer-street">Endereço</Label>
                  <Input
                    id="payer-street"
                    value={payerData.street}
                    onChange={(e) => setPayerData(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="Rua/Avenida"
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payer-number">Número</Label>
                  <Input
                    id="payer-number"
                    value={payerData.number}
                    onChange={(e) => setPayerData(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="123"
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payer-complement">Complemento</Label>
                  <Input
                    id="payer-complement"
                    value={payerData.complement}
                    onChange={(e) => setPayerData(prev => ({ ...prev, complement: e.target.value }))}
                    placeholder="Apto, bloco, referência"
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payer-neighborhood">Bairro</Label>
                  <Input
                    id="payer-neighborhood"
                    value={payerData.neighborhood}
                    onChange={(e) => setPayerData(prev => ({ ...prev, neighborhood: e.target.value }))}
                    placeholder="Bairro"
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payer-city">Cidade</Label>
                  <Input
                    id="payer-city"
                    value={payerData.city}
                    onChange={(e) => setPayerData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Cidade"
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payer-email">E-mail do titular</Label>
                  <Input
                    id="payer-email"
                    type="email"
                    value={payerData.email}
                    onChange={(e) => setPayerData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@dominio.com"
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payer-state">UF</Label>
                  <Input
                    id="payer-state"
                    value={payerData.state}
                    onChange={(e) => setPayerData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                    placeholder="SP"
                    maxLength={2}
                    disabled={isProcessing}
                  />
                </div>
              </div>

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

              <div className="text-center text-xs font-bold text-amber-700 dark:text-amber-300">
                Versão {CHECKOUT_UI_VERSION}
              </div>

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
