"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap, ArrowRight } from 'lucide-react';
import { SubscriptionPlan } from '@/lib/types';
import { IuguCheckout } from './IuguCheckout';
import { useCurrentUser, useUsers } from '@/lib/hooks';
import { toast } from '@/hooks/use-toast';

interface SubscriptionPlansProps {
  onSelectPlan: (planId: 'starter' | 'standard' | 'premium') => void;
  onClose: () => void;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19.97,
    features: {
      dietsPerMonth: 1,
      workoutsPerMonth: 1,
      canChangeDiet: false,
      supplementConsultation: false
    },
    description: [
      '1 dieta nova por mês',
      '1 treino por mês',
      'Análise corporal básica',
      'Suporte por email'
    ]
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 29.97,
    features: {
      dietsPerMonth: 2,
      workoutsPerMonth: 2,
      canChangeDiet: true,
      supplementConsultation: false
    },
    description: [
      'Pode mudar dieta no meio do mês',
      '2 treinos por mês',
      'Análise corporal avançada',
      'Suporte prioritário',
      'Relatórios de progresso'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 49.97,
    features: {
      dietsPerMonth: 'unlimited',
      workoutsPerMonth: 4,
      canChangeDiet: true,
      supplementConsultation: true,
      minimumMonths: 4
    },
    description: [
      'Dietas ilimitadas (quando quiser)',
      '4 treinos por mês',
      'Consultoria de suplementação',
      'Dúvidas sobre manipulados',
      'Suporte 24/7',
      'Análise corporal premium',
      'Acompanhamento personalizado'
    ]
  }
];

export function SubscriptionPlans({ onSelectPlan, onClose }: SubscriptionPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'standard' | 'premium' | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<{
    id: 'starter' | 'standard' | 'premium';
    identifier: string;
    name: string;
    price: number;
  } | null>(null);

  const { currentUser } = useCurrentUser();
  const { updateUser } = useUsers();

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Zap className="w-6 h-6" />;
      case 'standard':
        return <Star className="w-6 h-6" />;
      case 'premium':
        return <Crown className="w-6 h-6" />;
      default:
        return <Zap className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'starter':
        return 'from-green-500 to-emerald-600';
      case 'standard':
        return 'from-blue-500 to-indigo-600';
      case 'premium':
        return 'from-purple-500 to-pink-600';
      default:
        return 'from-green-500 to-emerald-600';
    }
  };

  // Mapear planos para identificadores da Iugu
  const getIuguPlanData = (planId: 'starter' | 'standard' | 'premium') => {
    const iuguMapping: {
      [K in 'starter' | 'standard' | 'premium']: {
        id: K;
        identifier: string;
        name: string;
        price: number;
      };
    } = {
      starter: {
        id: 'starter' as const,
        identifier: 'fitai_starter_monthly',
        name: 'FitAI Starter',
        price: 1997 // R$ 19,97 em centavos
      },
      standard: {
        id: 'standard' as const,
        identifier: 'fitai_standard_monthly',
        name: 'FitAI Standard',
        price: 2997 // R$ 29,97 em centavos
      },
      premium: {
        id: 'premium' as const,
        identifier: 'fitai_premium_monthly',
        name: 'FitAI Premium',
        price: 4997 // R$ 49,97 em centavos
      }
    };
    return iuguMapping[planId];
  };

  const handleSelectPlan = (planId: 'starter' | 'standard' | 'premium') => {
    setSelectedPlan(planId);
    
    // Preparar dados do checkout
    const iuguPlan = getIuguPlanData(planId);
    setCheckoutPlan(iuguPlan);
    
    setTimeout(() => {
      setShowCheckout(true);
    }, 300);
  };

  const handleCheckoutSuccess = (subscriptionData: any) => {
    console.log('[SUBSCRIPTION] Pagamento realizado com sucesso:', subscriptionData);
    
    if (currentUser) {
      // Atualizar usuário com dados da assinatura
      const updatedUser = {
        ...currentUser,
        subscription: {
          plan: checkoutPlan?.id as 'starter' | 'standard' | 'premium',
          status: 'active' as const,
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          canDowngrade: checkoutPlan?.id !== 'premium',
          downgradableDate: checkoutPlan?.id !== 'starter' ? new Date(new Date().setMonth(new Date().getMonth() + 4)) : undefined,
          dietsUsedThisMonth: 0,
          workoutsUsedThisMonth: 0,
          bodyAnalysesUsedThisMonth: 0,
          monthlyResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          // Dados da integração Iugu
          iugu: {
            customerId: subscriptionData.customer_id,
            subscriptionId: subscriptionData.id,
            paymentMethodId: subscriptionData.payment_method?.id,
            lastInvoiceStatus: 'active',
            nextChargeDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
          }
        }
      };

      updateUser(currentUser.id, updatedUser);
      
      toast({
        title: "🎉 Assinatura ativada!",
        description: `Bem-vindo ao plano ${checkoutPlan?.name}! Agora você tem acesso completo ao FitAI.`,
      });

      // Chamar callback original
      onSelectPlan(checkoutPlan?.id as 'starter' | 'standard' | 'premium');
    }
  };

  const handleCheckoutError = (error: string) => {
    console.error('[SUBSCRIPTION] Erro no checkout:', error);
    
    toast({
      variant: "destructive",
      title: "❌ Erro no pagamento",
      description: error || "Ocorreu um erro ao processar seu pagamento. Tente novamente.",
    });
    
    // Voltar para seleção de planos
    setShowCheckout(false);
    setSelectedPlan(null);
    setCheckoutPlan(null);
  };

  const handleBackFromCheckout = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
    setCheckoutPlan(null);
  };

  // Se estivermos no checkout, mostrar o componente de checkout
  if (showCheckout && checkoutPlan && currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 p-4 flex items-center justify-center">
        <IuguCheckout
          planIdentifier={checkoutPlan.identifier as 'fitai_starter_monthly' | 'fitai_standard_monthly' | 'fitai_premium_monthly'}
          planName={checkoutPlan.name}
          planPrice={checkoutPlan.price}
          onSuccess={handleCheckoutSuccess}
          onError={handleCheckoutError}
          onBack={handleBackFromCheckout}
          userId={currentUser.id}
          userEmail={currentUser.email}
          userName={currentUser.name}
          userCPF={currentUser.cpf}
          userPhone={currentUser.phone}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-4">
            Você ainda não assinou um plano!
          </h1>
          <p className="text-lg text-blue-700 dark:text-blue-300 mb-2">
            Para continuar e ter acesso às informações da IA,
          </p>
          <p className="text-lg text-blue-700 dark:text-blue-300">
            escolha o plano que melhor se adequa a você.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer ${
                selectedPlan === plan.id
                  ? 'ring-4 ring-blue-500 shadow-2xl'
                  : 'shadow-xl hover:shadow-2xl'
              } ${
                plan.id === 'premium'
                  ? 'border-2 border-purple-200 dark:border-purple-800'
                  : 'border-blue-100 dark:border-blue-800'
              }`}
              onClick={() => handleSelectPlan(plan.id)}
            >
              {plan.id === 'premium' && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 text-sm font-semibold">
                  MAIS POPULAR
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto w-16 h-16 bg-gradient-to-r ${getPlanColor(plan.id)} rounded-full flex items-center justify-center mb-4 text-white`}>
                  {getPlanIcon(plan.id)}
                </div>
                <CardTitle className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {plan.name}
                </CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">/mês</span>
                </div>
                {plan.features.minimumMonths && (
                  <Badge variant="outline" className="mx-auto mt-2 border-purple-300 text-purple-700">
                    Mínimo {plan.features.minimumMonths} meses
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                <ul className="space-y-3">
                  {plan.description.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-blue-800 dark:text-blue-200 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className={`w-full mt-6 bg-gradient-to-r ${getPlanColor(plan.id)} hover:opacity-90 text-white transition-all duration-300 ${
                    selectedPlan === plan.id ? 'scale-105' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(plan.id);
                  }}
                >
                  {selectedPlan === plan.id ? (
                    <>
                      Selecionado
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    'Escolher plano'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
            📋 Informações importantes sobre os planos:
          </h3>
          <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
            <li>• <strong>Upgrade:</strong> Pode ser feito a qualquer momento</li>
            <li>• <strong>Downgrade:</strong> Só é possível após 4 meses na categoria atual</li>
            <li>• <strong>Premium:</strong> Permanência mínima de 4 meses</li>
            <li>• <strong>Renovação:</strong> Automática mensalmente</li>
            <li>• <strong>Cancelamento:</strong> Pode ser feito a qualquer momento</li>
          </ul>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-blue-600 hover:text-blue-700"
          >
            Voltar para o app
          </Button>
        </div>
      </div>
    </div>
  );
}