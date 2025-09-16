"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CreditCard, Shield, CheckCircle, Lock, ArrowLeft, Loader2, Star, Users, Zap } from 'lucide-react';
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

  // Função para obter características do plano
  const getPlanFeatures = (planId: string) => {
    const features = {
      'fitai_starter_monthly': [
        '1 dieta personalizada por mês',
        '1 treino personalizado por mês', 
        'Análise corporal básica',
        'Suporte por email',
        'App móvel incluso'
      ],
      'fitai_standard_monthly': [
        '2 dietas personalizadas por mês',
        '2 treinos personalizados por mês',
        'Análise corporal avançada',
        'Suporte prioritário',
        'Relatórios de progresso',
        'Pode alterar dieta/treino'
      ],
      'fitai_premium_monthly': [
        'Dietas ilimitadas',
        '4 treinos personalizados por mês',
        'Chat com IA 24/7',
        'Análise corporal premium',
        'Consultoria de suplementação',
        'Suporte VIP',
        'Relatórios avançados'
      ]
    };
    return features[planId as keyof typeof features] || [];
  };

  const getPlanIcon = (planId: string) => {
    switch(planId) {
      case 'fitai_starter_monthly': return <Users className="w-5 h-5" />;
      case 'fitai_standard_monthly': return <Star className="w-5 h-5" />;
      case 'fitai_premium_monthly': return <Zap className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

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

    // VALIDAÇÃO SÍNCRONA CORRIGIDA - usando objeto local ao invés de estado assíncrono
    const validationErrors: {[key: string]: string} = {};
    const requiredFields = ['number', 'expiration', 'verification_value', 'full_name'];
    
    requiredFields.forEach(field => {
      const value = formData[field as keyof typeof formData];
      
      switch (field) {
        case 'number':
          const cleanNumber = value.replace(/\s/g, '');
          if (cleanNumber.length < 13 || cleanNumber.length > 19) {
            validationErrors.number = 'Número do cartão inválido';
          }
          break;
        case 'expiration':
          if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
            validationErrors.expiration = 'Data de expiração inválida (MM/AA)';
          } else {
            // Validar se não está expirado
            const [month, year] = value.split('/');
            const expDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
            const now = new Date();
            if (expDate < now) {
              validationErrors.expiration = 'Cartão expirado';
            }
          }
          break;
        case 'verification_value':
          if (!/^\d{3,4}$/.test(value)) {
            validationErrors.verification_value = 'CVV inválido';
          }
          break;
        case 'full_name':
          if (value.length < 3 || !/^[a-zA-ZÀ-ÿ\s]+$/.test(value)) {
            validationErrors.full_name = 'Nome do portador é obrigatório';
          }
          break;
      }
    });

    // Atualizar estado apenas uma vez e verificar erros localmente
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
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
      const cardData = {
        number: formData.number.replace(/\s/g, ''),
        verification_value: formData.verification_value,
        full_name: formData.full_name,
        month: formData.expiration.split('/')[0],
        year: '20' + formData.expiration.split('/')[1]
      };

      console.log('[IUGU] Criando token do cartão...');
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* LADO ESQUERDO - RESUMO DO PLANO */}
          <div className="order-2 lg:order-1">
            <Card className="sticky top-4 shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                <CardTitle className="flex items-center gap-3 text-xl">
                  {getPlanIcon(planIdentifier)}
                  Resumo da Assinatura
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Nome e Preço do Plano */}
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{planName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Cobrança mensal</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 text-lg font-bold px-3 py-1">
                      {formatPrice(planPrice)}/mês
                    </Badge>
                  </div>
                  
                  {/* CARACTERÍSTICAS DO PLANO */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      O que está incluído:
                    </h4>
                    <div className="space-y-3">
                      {getPlanFeatures(planIdentifier).map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* INFORMAÇÕES DE COBRANÇA */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="text-gray-900 dark:text-white">{formatPrice(planPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Taxa de serviço</span>
                      <span className="text-green-600 font-medium">Grátis</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-semibold text-lg text-gray-900 dark:text-white">Total Mensal</span>
                      <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">{formatPrice(planPrice)}</span>
                    </div>
                  </div>
                  
                  {/* BENEFÍCIOS */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                      🎉 Benefícios inclusos:
                    </h4>
                    <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
                      <li className="flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        Acesso imediato à plataforma
                      </li>
                      <li className="flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        Suporte técnico incluído
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3" />
                        Primeira cobrança apenas após confirmação
                      </li>
                      <li className="flex items-center gap-2">
                        <CreditCard className="w-3 h-3" />
                        Cancelamento a qualquer momento
                      </li>
                    </ul>
                  </div>

                  {/* SEGURANÇA */}
                  <div className="text-center text-sm text-gray-500 space-y-2 pt-4 border-t">
                    <p className="flex items-center justify-center gap-2">
                      <Shield className="w-4 h-4" />
                      Pagamento 100% seguro
                    </p>
                    <p className="flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" />
                      Dados criptografados com SSL
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* LADO DIREITO - FORMULÁRIO */}
          <div className="order-1 lg:order-2">
            {step === 'customer' ? (
              <Card className="shadow-xl border-0">
                <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                  <CardTitle className="flex items-center justify-center gap-2 text-xl">
                    <Shield className="w-6 h-6 text-blue-600" />
                    Confirmar Dados Pessoais
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Precisamos confirmar alguns dados para prosseguir
                  </p>
                </CardHeader>

                <CardContent className="p-6">
                  <form className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Nome Completo</Label>
                      <Input
                        id="name"
                        type="text"
                        value={userName}
                        disabled
                        className="bg-gray-50 dark:bg-gray-800 h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userEmail}
                        disabled
                        className="bg-gray-50 dark:bg-gray-800 h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpf" className="text-sm font-medium">CPF *</Label>
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        value={formData.cpf}
                        className={`h-12 ${errors.cpf ? 'border-red-500' : ''}`}
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
                      <Label htmlFor="phone" className="text-sm font-medium">Telefone *</Label>
                      <Input
                        id="phone"
                        type="text"
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                        value={formData.phone}
                        className={`h-12 ${errors.phone ? 'border-red-500' : ''}`}
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
                      <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {errors.general}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onBack}
                        className="flex-1 h-12"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                      </Button>
                      
                      <Button
                        type="button"
                        onClick={createCustomer}
                        disabled={loading || !formData.cpf || !formData.phone}
                        className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Validando...
                          </>
                        ) : (
                          'Continuar para Pagamento'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-xl border-0">
                <CardHeader className="text-center bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                  <CardTitle className="flex items-center justify-center gap-2 text-xl">
                    <Lock className="w-6 h-6 text-green-600" />
                    Pagamento Seguro
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Insira os dados do seu cartão para finalizar
                  </p>
                </CardHeader>

                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Número do Cartão */}
                    <div className="space-y-2">
                      <Label htmlFor="card-number" className="text-sm font-medium">Número do Cartão</Label>
                      <div className="relative">
                        <Input
                          id="card-number"
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          value={formData.number}
                          className={`h-12 pl-4 pr-12 ${errors.number ? 'border-red-500' : ''}`}
                          onChange={(e) => handleInputChange('number', e.target.value)}
                        />
                        <CreditCard className="absolute right-4 top-4 w-5 h-5 text-gray-400" />
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
                        <Label htmlFor="card-expiry" className="text-sm font-medium">Validade</Label>
                        <Input
                          id="card-expiry"
                          type="text"
                          placeholder="MM/AA"
                          maxLength={5}
                          value={formData.expiration}
                          className={`h-12 ${errors.expiration ? 'border-red-500' : ''}`}
                          onChange={(e) => handleInputChange('expiration', e.target.value)}
                        />
                        {errors.expiration && (
                          <p className="text-xs text-red-500">{errors.expiration}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="card-cvc" className="text-sm font-medium">CVV</Label>
                        <Input
                          id="card-cvc"
                          type="text"
                          placeholder="123"
                          maxLength={4}
                          value={formData.verification_value}
                          className={`h-12 ${errors.verification_value ? 'border-red-500' : ''}`}
                          onChange={(e) => handleInputChange('verification_value', e.target.value)}
                        />
                        {errors.verification_value && (
                          <p className="text-xs text-red-500">{errors.verification_value}</p>
                        )}
                      </div>
                    </div>

                    {/* Nome do Portador */}
                    <div className="space-y-2">
                      <Label htmlFor="card-holder" className="text-sm font-medium">Nome do Portador</Label>
                      <Input
                        id="card-holder"
                        type="text"
                        placeholder="Nome como impresso no cartão"
                        value={formData.full_name}
                        className={`h-12 ${errors.full_name ? 'border-red-500' : ''}`}
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
                      <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {errors.general}
                        </p>
                      </div>
                    )}

                    {/* Botões */}
                    <div className="flex gap-3 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep('customer')}
                        disabled={processing}
                        className="flex-1 h-12"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                      </Button>
                      
                      <Button
                        type="submit"
                        disabled={processing || !iuguLoaded || !customerId}
                        className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Finalizar Assinatura {formatPrice(planPrice)}/mês
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Informações de Segurança */}
                    <div className="text-center text-sm text-gray-500 space-y-2 pt-4 border-t">
                      <p className="flex items-center justify-center gap-2">
                        <Shield className="w-4 h-4" />
                        Processado com segurança pela Iugu
                      </p>
                      <p>🔒 Criptografia SSL de 256 bits</p>
                      <p>📱 Cancele a qualquer momento</p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}