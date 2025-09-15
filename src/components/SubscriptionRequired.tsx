"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Zap, Lock, ArrowRight } from 'lucide-react';

interface SubscriptionRequiredProps {
  onSelectPlan: (planId: 'starter' | 'standard' | 'premium') => void;
  feature: string;
}

const plans = [
  {
    id: 'starter' as const,
    name: 'Starter',
    price: 19.97,
    icon: <Zap className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-600',
    features: [
      '1 dieta nova por mês',
      '1 treino por mês',
      'Análise corporal básica',
      'Suporte por email'
    ]
  },
  {
    id: 'standard' as const,
    name: 'Standard',
    price: 29.97,
    icon: <Star className="w-6 h-6" />,
    color: 'from-blue-500 to-indigo-600',
    features: [
      'Pode mudar dieta no meio do mês',
      '2 treinos por mês',
      'Análise corporal avançada',
      'Suporte prioritário'
    ]
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    price: 49.97,
    icon: <Crown className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-600',
    features: [
      'Dietas ilimitadas (quando quiser)',
      '4 treinos por mês',
      'Consultoria de suplementação',
      'Dúvidas sobre manipulados',
      'Suporte 24/7'
    ],
    popular: true
  }
];

export function SubscriptionRequired({ onSelectPlan, feature }: SubscriptionRequiredProps) {
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Você ainda não assinou um plano!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          Para continuar e ter acesso às informações da IA,
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          escolha o plano que melhor se adequa a você.
        </p>
        {feature && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Funcionalidade solicitada: <strong>{feature}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
              plan.popular
                ? 'border-2 border-purple-200 dark:border-purple-800 shadow-2xl'
                : 'shadow-xl hover:shadow-2xl border-gray-100 dark:border-gray-800'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 text-sm font-semibold">
                MAIS POPULAR
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className={`mx-auto w-16 h-16 bg-gradient-to-r ${plan.color} rounded-full flex items-center justify-center mb-4 text-white`}>
                {plan.icon}
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {plan.name}
              </CardTitle>
              <div className="text-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-gray-600 dark:text-gray-400">/mês</span>
              </div>
              {plan.id === 'premium' && (
                <Badge variant="outline" className="mx-auto mt-2 border-purple-300 text-purple-700">
                  Mínimo 4 meses
                </Badge>
              )}
            </CardHeader>
            
            <CardContent className="pt-0">
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              <Button
                onClick={() => onSelectPlan(plan.id)}
                className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white transition-all duration-300`}
              >
                Escolher {plan.name}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Important Notes */}
      <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
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
    </div>
  );
}