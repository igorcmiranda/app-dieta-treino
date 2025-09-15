"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Lock, 
  ArrowLeft, 
  Check, 
  Crown, 
  Star, 
  Zap,
  Shield,
  Calendar,
  DollarSign
} from 'lucide-react';
import { PaymentData } from '@/lib/types';

interface PaymentScreenProps {
  selectedPlan: 'starter' | 'standard' | 'premium';
  onBack: () => void;
  onPaymentSuccess: () => void;
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

export function PaymentScreen({ selectedPlan, onBack, onPaymentSuccess }: PaymentScreenProps) {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    cpf: '',
    plan: selectedPlan
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const plan = planDetails[selectedPlan];

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const formatExpiryDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return numbers.substring(0, 2) + '/' + numbers.substring(2, 4);
    }
    return numbers;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!paymentData.cardNumber.replace(/\s/g, '')) {
      newErrors.cardNumber = 'Número do cartão é obrigatório';
    } else if (paymentData.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Número do cartão deve ter 16 dígitos';
    }

    if (!paymentData.expiryDate) {
      newErrors.expiryDate = 'Data de validade é obrigatória';
    } else if (!/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
      newErrors.expiryDate = 'Formato: MM/AA';
    }

    if (!paymentData.cvv) {
      newErrors.cvv = 'CVV é obrigatório';
    } else if (paymentData.cvv.length !== 3) {
      newErrors.cvv = 'CVV deve ter 3 dígitos';
    }

    if (!paymentData.cardName.trim()) {
      newErrors.cardName = 'Nome no cartão é obrigatório';
    }

    if (!paymentData.cpf) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(paymentData.cpf)) {
      newErrors.cpf = 'Formato: 000.000.000-00';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PaymentData, value: string) => {
    let formattedValue = value;

    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
      if (formattedValue.replace(/\s/g, '').length > 16) return;
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
      if (formattedValue.replace(/\D/g, '').length > 4) return;
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 3) return;
    } else if (field === 'cpf') {
      formattedValue = formatCPF(value);
      if (formattedValue.replace(/\D/g, '').length > 11) return;
    }

    setPaymentData(prev => ({ ...prev, [field]: formattedValue }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Simular processamento do pagamento
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setShowSuccess(true);
      
      // Após 2 segundos, chamar onPaymentSuccess
      setTimeout(() => {
        onPaymentSuccess();
      }, 2000);
    } catch (error) {
      setErrors({ general: 'Erro ao processar pagamento. Tente novamente.' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-green-100 dark:border-green-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-900 dark:text-green-100">
              Pagamento aprovado!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-green-700 dark:text-green-300">
              Seu plano <strong>{plan.name}</strong> foi ativado com sucesso!
            </p>
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                Você já pode aproveitar todos os recursos da IA.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-4 text-blue-600 hover:text-blue-700"
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

          {/* Payment Form */}
          <Card className="shadow-xl border-blue-100 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <CreditCard className="w-5 h-5" />
                Dados do pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-blue-800 dark:text-blue-200">
                    Número do cartão
                  </Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    value={paymentData.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    placeholder="0000 0000 0000 0000"
                    className={`border-blue-200 dark:border-blue-700 focus:ring-blue-500 ${
                      errors.cardNumber ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.cardNumber && (
                    <p className="text-red-500 text-sm">{errors.cardNumber}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate" className="text-blue-800 dark:text-blue-200">
                      Validade
                    </Label>
                    <Input
                      id="expiryDate"
                      type="text"
                      value={paymentData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      placeholder="MM/AA"
                      className={`border-blue-200 dark:border-blue-700 focus:ring-blue-500 ${
                        errors.expiryDate ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.expiryDate && (
                      <p className="text-red-500 text-sm">{errors.expiryDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="text-blue-800 dark:text-blue-200">
                      CVV
                    </Label>
                    <Input
                      id="cvv"
                      type="text"
                      value={paymentData.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value)}
                      placeholder="000"
                      className={`border-blue-200 dark:border-blue-700 focus:ring-blue-500 ${
                        errors.cvv ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.cvv && (
                      <p className="text-red-500 text-sm">{errors.cvv}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardName" className="text-blue-800 dark:text-blue-200">
                    Nome no cartão
                  </Label>
                  <Input
                    id="cardName"
                    type="text"
                    value={paymentData.cardName}
                    onChange={(e) => handleInputChange('cardName', e.target.value)}
                    placeholder="Nome como está no cartão"
                    className={`border-blue-200 dark:border-blue-700 focus:ring-blue-500 ${
                      errors.cardName ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.cardName && (
                    <p className="text-red-500 text-sm">{errors.cardName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-blue-800 dark:text-blue-200">
                    CPF do titular
                  </Label>
                  <Input
                    id="cpf"
                    type="text"
                    value={paymentData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    className={`border-blue-200 dark:border-blue-700 focus:ring-blue-500 ${
                      errors.cpf ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.cpf && (
                    <p className="text-red-500 text-sm">{errors.cpf}</p>
                  )}
                </div>

                {errors.general && (
                  <div className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-950 p-2 rounded">
                    {errors.general}
                  </div>
                )}

                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                      Pagamento seguro
                    </span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Seus dados são protegidos com criptografia SSL de 256 bits.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white text-lg py-6`}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processando pagamento...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Finalizar pagamento - R$ {plan.price.toFixed(2).replace('.', ',')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}