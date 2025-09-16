"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CreditCard, Shield, CheckCircle, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Iugu: any;
  }
}

interface IuguCheckoutProps {
  planIdentifier: 'fitai_starter_monthly' | 'fitai_standard_monthly' | 'fitai_premium_monthly';
  planName: string;
  planPrice: number; // em centavos
  onSuccess: (subscriptionData: any) => void;
  onError: (error: string) => void;
  onBack: () => void;
  userId: string;
  userEmail: string;
  userName: string;
  userCPF?: string;
  userPhone?: string;
}

export function IuguCheckout({
  planIdentifier,
  planName,
  planPrice,
  onSuccess,
  onError,
  onBack,
  userId,
  userEmail,
  userName,
  userCPF,
  userPhone
}: IuguCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [iuguLoaded, setIuguLoaded] = useState(false);
  const [formData, setFormData] = useState({
    number: '',
    expiration: '',
    verification_value: '',
    full_name: '',
    cpf: userCPF || '',
    phone: userPhone || ''
  });
  const [step, setStep] = useState<'customer' | 'payment'>('customer');
  const [processing, setProcessing] = useState(false);

  // Carregar SDK da Iugu
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.iugu.com/v2';
    script.async = true;
    script.onload = () => {
      if (window.Iugu) {
        // Usar uma account ID de teste por padrão
        window.Iugu.setAccountID(process.env.NEXT_PUBLIC_IUGU_ACCOUNT_ID || 'test-account-id');
        window.Iugu.setTestMode(process.env.NODE_ENV !== 'production');
        setIuguLoaded(true);
        console.log('[IUGU] SDK carregado com sucesso');
      }
    };
    script.onerror = () => {
      console.error('[IUGU] Erro ao carregar SDK');
      onError('Erro ao carregar sistema de pagamento. Verifique sua conexão.');
    };
    document.head.appendChild(script);

    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {
        // Script já removido
      }
    };
  }, []);

  const createCustomer = async () => {
    if (!formData.cpf || !formData.phone) {
      setErrors({ 
        cpf: formData.cpf ? '' : 'CPF é obrigatório',
        phone: formData.phone ? '' : 'Telefone é obrigatório'
      });
      return false;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/iugu/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          cpf_cnpj: formData.cpf.replace(/\D/g, ''),
          phone: formData.phone.replace(/\D/g, '')
        })
      });

      const customer = await response.json();
      if (response.ok) {
        setCustomerId(customer.id);
        setStep('payment');
        toast({
          title: "✅ Dados confirmados",
          description: "Agora insira os dados do seu cartão."
        });
        return true;
      } else {
        console.error('Erro ao criar customer:', customer);
        setErrors({ general: customer.errors?.[0] || 'Erro ao validar dados' });
        return false;
      }
    } catch (error) {
      console.error('Erro ao criar customer:', error);
      setErrors({ general: 'Erro de conexão. Tente novamente.' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const formatCPF = (value: string) => {
    const v = value.replace(/\D/g, '');
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 10) {
      return v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'number':
        const cleanNumber = value.replace(/\s/g, '');
        if (cleanNumber.length < 13 || cleanNumber.length > 19) {
          newErrors.number = 'Número do cartão inválido';
        } else {
          delete newErrors.number;
        }
        break;
      case 'expiration':
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
          newErrors.expiration = 'Data de expiração inválida (MM/AA)';
        } else {
          // Validar se não está expirado
          const [month, year] = value.split('/');
          const expDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
          const now = new Date();
          if (expDate < now) {
            newErrors.expiration = 'Cartão expirado';
          } else {
            delete newErrors.expiration;
          }
        }
        break;
      case 'verification_value':
        if (!/^\d{3,4}$/.test(value)) {
          newErrors.verification_value = 'CVV inválido';
        } else {
          delete newErrors.verification_value;
        }
        break;
      case 'full_name':
        if (value.length < 3 || !/^[a-zA-ZÀ-ÿ\s]+$/.test(value)) {
          newErrors.full_name = 'Nome do portador é obrigatório';
        } else {
          delete newErrors.full_name;
        }
        break;
      case 'cpf':
        const cleanCPF = value.replace(/\D/g, '');
        if (cleanCPF.length !== 11) {
          newErrors.cpf = 'CPF deve ter 11 dígitos';
        } else {
          delete newErrors.cpf;
        }
        break;
      case 'phone':
        const cleanPhone = value.replace(/\D/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
          newErrors.phone = 'Telefone inválido';
        } else {
          delete newErrors.phone;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (name: string, value: string) => {
    let formattedValue = value;
    
    switch (name) {
      case 'number':
        formattedValue = formatCardNumber(value);
        break;
      case 'expiration':
        formattedValue = formatExpiry(value);
        break;
      case 'verification_value':
        formattedValue = value.replace(/\D/g, '');
        break;
      case 'cpf':
        formattedValue = formatCPF(value);
        break;
      case 'phone':
        formattedValue = formatPhone(value);
        break;
      case 'full_name':
        formattedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
        break;
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    validateField(name, formattedValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!iuguLoaded || !customerId) {
      onError('Sistema de pagamento não está pronto. Tente novamente.');
      return;
    }

    // Validar todos os campos
    const requiredFields = ['number', 'expiration', 'verification_value', 'full_name'];
    const hasErrors = requiredFields.some(field => {
      validateField(field, formData[field as keyof typeof formData]);
      return errors[field];
    });

    if (hasErrors || Object.keys(errors).length > 0) {
      toast({
        variant: "destructive",
        title: "❌ Erro no formulário",
        description: "Por favor, corrija os erros antes de continuar."
      });
      return;
    }

    setProcessing(true);
    setErrors({});

    try {
      // Preparar dados para a Iugu
      const cardData = {
        number: formData.number.replace(/\s/g, ''),
        verification_value: formData.verification_value,
        full_name: formData.full_name,
        month: formData.expiration.split('/')[0],
        year: '20' + formData.expiration.split('/')[1]
      };

      console.log('[IUGU] Criando token do cartão...');
      
      // Criar token usando SDK da Iugu
      window.Iugu.createPaymentToken(cardData, async (response: any) => {
        try {
          if (response.errors) {
            console.error('[IUGU] Erro ao tokenizar cartão:', response.errors);
            const errorMessages = Object.values(response.errors).flat();
            setErrors({ general: errorMessages.join(', ') });
            setProcessing(false);
            return;
          }

          console.log('[IUGU] Token criado com sucesso:', response.id);

          // Adicionar método de pagamento
          const paymentMethodResponse = await fetch('/api/iugu/payment-methods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_id: customerId,
              token: response.id,
              description: `Cartão ${formData.number.slice(-4)}`,
              set_as_default: true
            })
          });

          const paymentMethod = await paymentMethodResponse.json();
          
          if (!paymentMethodResponse.ok) {
            throw new Error(paymentMethod.error || 'Erro ao adicionar método de pagamento');
          }

          console.log('[IUGU] Método de pagamento adicionado:', paymentMethod.id);

          // Criar assinatura
          const subscriptionResponse = await fetch('/api/iugu/subscriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_id: customerId,
              plan_identifier: planIdentifier,
              payment_method_id: paymentMethod.id,
              user_id: userId
            })
          });

          const subscription = await subscriptionResponse.json();
          
          if (subscriptionResponse.ok) {
            console.log('[IUGU] Assinatura criada com sucesso:', subscription.id);
            toast({
              title: "🎉 Pagamento confirmado!",
              description: "Sua assinatura foi ativada com sucesso."
            });
            onSuccess(subscription);
          } else {
            throw new Error(subscription.error || 'Erro ao criar assinatura');
          }

        } catch (error) {
          console.error('[IUGU] Erro no processo de pagamento:', error);
          const errorMessage = error instanceof Error ? error.message : 'Erro inesperado no pagamento';
          setErrors({ general: errorMessage });
          onError(errorMessage);
        } finally {
          setProcessing(false);
        }
      });

    } catch (error) {
      console.error('[IUGU] Erro geral:', error);
      onError('Erro ao processar pagamento');
      setProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price / 100);
  };

  if (step === 'customer') {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Dados Pessoais
          </CardTitle>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">{planName}</h3>
            <Badge variant="secondary" className="text-lg bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
              {formatPrice(planPrice)}/mês
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                value={userName}
                disabled
                className="bg-gray-50 dark:bg-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userEmail}
                disabled
                className="bg-gray-50 dark:bg-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                maxLength={14}
                value={formData.cpf}
                className={errors.cpf ? 'border-red-500' : ''}
                onChange={(e) => handleInputChange('cpf', e.target.value)}
              />
              {errors.cpf && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.cpf}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                type="text"
                placeholder="(11) 99999-9999"
                maxLength={15}
                value={formData.phone}
                className={errors.phone ? 'border-red-500' : ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.phone}
                </p>
              )}
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.general}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              
              <Button
                type="button"
                onClick={createCustomer}
                disabled={loading || !formData.cpf || !formData.phone}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl">
      <CardHeader className="text-center bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardTitle className="flex items-center justify-center gap-2">
          <Lock className="w-5 h-5 text-green-600" />
          Pagamento Seguro
        </CardTitle>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">{planName}</h3>
          <Badge variant="secondary" className="text-lg bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
            {formatPrice(planPrice)}/mês
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Número do Cartão */}
          <div className="space-y-2">
            <Label htmlFor="card-number">Número do Cartão</Label>
            <div className="relative">
              <Input
                id="card-number"
                type="text"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                value={formData.number}
                className={errors.number ? 'border-red-500' : ''}
                onChange={(e) => handleInputChange('number', e.target.value)}
              />
              <CreditCard className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            </div>
            {errors.number && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.number}
              </p>
            )}
          </div>

          {/* Validade e CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="card-expiry">Validade</Label>
              <Input
                id="card-expiry"
                type="text"
                placeholder="MM/AA"
                maxLength={5}
                value={formData.expiration}
                className={errors.expiration ? 'border-red-500' : ''}
                onChange={(e) => handleInputChange('expiration', e.target.value)}
              />
              {errors.expiration && (
                <p className="text-xs text-red-500">{errors.expiration}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-cvc">CVV</Label>
              <Input
                id="card-cvc"
                type="text"
                placeholder="123"
                maxLength={4}
                value={formData.verification_value}
                className={errors.verification_value ? 'border-red-500' : ''}
                onChange={(e) => handleInputChange('verification_value', e.target.value)}
              />
              {errors.verification_value && (
                <p className="text-xs text-red-500">{errors.verification_value}</p>
              )}
            </div>
          </div>

          {/* Nome do Portador */}
          <div className="space-y-2">
            <Label htmlFor="card-holder">Nome do Portador</Label>
            <Input
              id="card-holder"
              type="text"
              placeholder="Nome como impresso no cartão"
              value={formData.full_name}
              className={errors.full_name ? 'border-red-500' : ''}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
            />
            {errors.full_name && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.full_name}
              </p>
            )}
          </div>

          {errors.general && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.general}
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('customer')}
              disabled={processing}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            
            <Button
              type="submit"
              disabled={processing || !iuguLoaded || !customerId}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Assinar {formatPrice(planPrice)}/mês
                </>
              )}
            </Button>
          </div>

          {/* Informações de Segurança */}
          <div className="text-center text-sm text-gray-500 space-y-1 pt-4 border-t">
            <p className="flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              Pagamento processado com segurança pela Iugu
            </p>
            <p>🔒 Dados do cartão criptografados e seguros</p>
            <p>📱 Você pode cancelar a qualquer momento</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}