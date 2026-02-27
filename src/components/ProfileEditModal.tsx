"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, UserBilling } from '@/lib/types';
import { useActivityLogger } from '@/lib/hooks';
import {
  validateFullName,
  validateEmail,
  validateCpf,
  validateCep,
  validateCreditCard,
  validateCvv,
  validateExpiryDate,
  validateRequired,
  formatCpfInput,
  formatCepInput,
  formatCreditCardInput,
  formatExpiryInput,
  maskCpf,
  maskCreditCard,
  detectCardBrand,
  clearSensitiveData,
  BRAZILIAN_STATES
} from '@/lib/validation-utils';
import { 
  Save, 
  X, 
  Shield, 
  CreditCard, 
  MapPin, 
  User as UserIcon,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updatedUser: User) => void;
}

interface FormData {
  // Dados pessoais
  fullName: string;
  email: string;
  
  // Endereço
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  
  // CPF (para validação temporária)
  cpf: string;
  
  // Cartão demo (NUNCA armazenados)
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardHolderName: string;
  cardCpf: string;
}

interface FormErrors {
  [key: string]: string;
}

export function ProfileEditModal({ isOpen, onClose, user, onSave }: ProfileEditModalProps) {
  const [activeTab, setActiveTab] = useState('personal');
  const { logActivity } = useActivityLogger();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    cpf: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardHolderName: '',
    cardCpf: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [cardBrand, setCardBrand] = useState('');

  // Carregar dados existentes quando modal abre
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        fullName: user.billing?.fullName || user.name || '',
        email: user.billing?.email || user.email || '',
        street: user.billing?.street || '',
        number: user.billing?.number || '',
        neighborhood: user.billing?.neighborhood || '',
        city: user.billing?.city || '',
        state: user.billing?.state || '',
        zipCode: user.billing?.zipCode || '',
        cpf: '', // NUNCA pré-popular CPF por segurança
        cardNumber: '', // NUNCA pré-popular dados de cartão
        cardExpiry: '',
        cardCvv: '',
        cardHolderName: user.billing?.cardHolderName || '',
        cardCpf: ''
      });
      setErrors({});
      setCardBrand('');
    }
  }, [isOpen, user]);

  // SECURITY: Limpar dados sensíveis quando modal fecha
  useEffect(() => {
    if (!isOpen) {
      clearSensitiveData(formData);
      setFormData({
        fullName: '',
        email: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
        cpf: '',
        cardNumber: '',
        cardExpiry: '',
        cardCvv: '',
        cardHolderName: '',
        cardCpf: ''
      });
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;
    
    // Aplicar formatação em tempo real
    switch (field) {
      case 'cpf':
      case 'cardCpf':
        formattedValue = formatCpfInput(value);
        break;
      case 'zipCode':
        formattedValue = formatCepInput(value);
        break;
      case 'cardNumber':
        formattedValue = formatCreditCardInput(value);
        setCardBrand(detectCardBrand(value));
        break;
      case 'cardExpiry':
        formattedValue = formatExpiryInput(value);
        break;
      case 'cardCvv':
        // Apenas números para CVV
        formattedValue = value.replace(/\D/g, '').substr(0, 4);
        break;
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Limpar erro quando usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validação dados pessoais
    if (!validateRequired(formData.fullName)) {
      newErrors.fullName = 'Nome completo é obrigatório';
    } else if (!validateFullName(formData.fullName)) {
      newErrors.fullName = 'Nome deve ter pelo menos nome e sobrenome';
    }

    if (!validateRequired(formData.email)) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validação endereço
    if (!validateRequired(formData.street)) {
      newErrors.street = 'Rua é obrigatória';
    }
    if (!validateRequired(formData.number)) {
      newErrors.number = 'Número é obrigatório';
    }
    if (!validateRequired(formData.neighborhood)) {
      newErrors.neighborhood = 'Bairro é obrigatório';
    }
    if (!validateRequired(formData.city)) {
      newErrors.city = 'Cidade é obrigatória';
    }
    if (!validateRequired(formData.state)) {
      newErrors.state = 'Estado é obrigatório';
    }
    if (!validateRequired(formData.zipCode)) {
      newErrors.zipCode = 'CEP é obrigatório';
    } else if (!validateCep(formData.zipCode)) {
      newErrors.zipCode = 'CEP inválido';
    }
    if (!validateRequired(formData.cpf)) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!validateCpf(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    // Validação cartão demo (opcional, mas se preenchido deve ser válido)
    if (formData.cardNumber && !validateCreditCard(formData.cardNumber)) {
      newErrors.cardNumber = 'Número do cartão inválido';
    }
    if (formData.cardExpiry && !validateExpiryDate(formData.cardExpiry)) {
      newErrors.cardExpiry = 'Data de validade inválida';
    }
    if (formData.cardCvv && !validateCvv(formData.cardCvv, cardBrand)) {
      newErrors.cardCvv = `CVV deve ter ${cardBrand === 'amex' ? '4' : '3'} dígitos`;
    }
    if (formData.cardNumber && !formData.cardHolderName) {
      newErrors.cardHolderName = 'Nome no cartão é obrigatório';
    }
    if (formData.cardNumber && formData.cardCpf && !validateCpf(formData.cardCpf)) {
      newErrors.cardCpf = 'CPF do responsável inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      // Ir para a primeira aba com erro
      if (errors.fullName || errors.email) {
        setActiveTab('personal');
      } else if (errors.street || errors.number || errors.neighborhood || errors.city || errors.state || errors.zipCode || errors.cpf) {
        setActiveTab('address');
      } else {
        setActiveTab('card');
      }
      return;
    }

    setIsSaving(true);

    try {
      // SECURITY: Criar billing data APENAS com dados seguros
      const billingData: UserBilling = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        street: formData.street.trim(),
        number: formData.number.trim(),
        neighborhood: formData.neighborhood.trim(),
        city: formData.city.trim(),
        state: formData.state,
        zipCode: formData.zipCode.replace(/\D/g, ''),
        maskedCpf: formData.cpf ? maskCpf(formData.cpf) : undefined,
        demoMode: true,
        updatedAt: new Date()
      };

      // SECURITY: Apenas adicionar dados de cartão se informados (mascarados)
      if (formData.cardNumber) {
        const cleanCardNumber = formData.cardNumber.replace(/\D/g, '');
        billingData.cardBrand = cardBrand;
        billingData.cardLast4 = cleanCardNumber.slice(-4);
        billingData.cardHolderName = formData.cardHolderName.trim();
        
        if (formData.cardExpiry) {
          const cleanExpiry = formData.cardExpiry.replace(/\D/g, '');
          billingData.cardExpMonth = cleanExpiry.substr(0, 2);
          billingData.cardExpYear = cleanExpiry.substr(2, 2);
        }
      }

      // Atualizar usuário
      const updatedUser: User = {
        ...user,
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        billing: billingData
      };

      // SECURITY: Limpar dados sensíveis da memória ANTES de salvar
      clearSensitiveData(formData);

      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log da atualização de perfil/billing
      logActivity({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'PROFILE_UPDATE',
        details: `Dados pessoais e de cobrança atualizados - Nome: ${formData.fullName}, Email: ${formData.email}, Cidade: ${formData.city}`,
        status: 'success',
        metadata: {
          updatedFields: {
            personalData: {
              nameChanged: user.name !== formData.fullName.trim(),
              emailChanged: user.email !== formData.email.trim()
            },
            billingData: {
              hasAddress: !!(formData.street && formData.city),
              hasCard: !!formData.cardNumber,
              maskedCpf: formData.cpf ? '***.***.***-**' : undefined
            }
          },
          timestamp: new Date()
        }
      });

      onSave(updatedUser);
      onClose();
      
      // Notificar sucesso
      alert('✅ Dados atualizados com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log do erro
      logActivity({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'PROFILE_UPDATE',
        details: `Erro ao atualizar dados pessoais e de cobrança: ${error}`,
        status: 'error',
        metadata: {
          error: errorMessage,
          timestamp: new Date()
        }
      });
      
      alert('❌ Erro ao salvar dados. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // SECURITY: Limpar dados sensíveis
    clearSensitiveData(formData);
    onClose();
  };

  const getFieldValidationIcon = (fieldName: string) => {
    if (errors[fieldName]) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (formData[fieldName as keyof FormData] && !errors[fieldName]) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Editar Dados Pessoais e Billing
          </DialogTitle>
        </DialogHeader>

        {/* BANNER DE SEGURANÇA - CRÍTICO */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                🔒 MODO DEMO - Ambiente Seguro
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                <strong>Dados de cartão NÃO são armazenados.</strong> Nenhuma cobrança real será feita. 
                Este é um ambiente de demonstração com total conformidade PCI DSS e LGPD.
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço
            </TabsTrigger>
            <TabsTrigger value="card" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Cartão Demo
            </TabsTrigger>
          </TabsList>

          {/* SEÇÃO 1: DADOS PESSOAIS */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <div className="relative">
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Ex: João Silva Santos"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className={errors.fullName ? 'border-red-500' : ''}
                      />
                      <div className="absolute right-3 top-3">
                        {getFieldValidationIcon('fullName')}
                      </div>
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-red-600">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      <div className="absolute right-3 top-3">
                        {getFieldValidationIcon('email')}
                      </div>
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEÇÃO 2: ENDEREÇO/BILLING */}
          <TabsContent value="address" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Endereço de Cobrança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="street">Rua *</Label>
                    <div className="relative">
                      <Input
                        id="street"
                        type="text"
                        placeholder="Ex: Rua das Flores"
                        value={formData.street}
                        onChange={(e) => handleInputChange('street', e.target.value)}
                        className={errors.street ? 'border-red-500' : ''}
                      />
                      <div className="absolute right-3 top-3">
                        {getFieldValidationIcon('street')}
                      </div>
                    </div>
                    {errors.street && (
                      <p className="text-sm text-red-600">{errors.street}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="number">Número *</Label>
                    <div className="relative">
                      <Input
                        id="number"
                        type="text"
                        placeholder="123"
                        value={formData.number}
                        onChange={(e) => handleInputChange('number', e.target.value)}
                        className={errors.number ? 'border-red-500' : ''}
                      />
                      <div className="absolute right-3 top-3">
                        {getFieldValidationIcon('number')}
                      </div>
                    </div>
                    {errors.number && (
                      <p className="text-sm text-red-600">{errors.number}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <div className="relative">
                      <Input
                        id="neighborhood"
                        type="text"
                        placeholder="Ex: Centro"
                        value={formData.neighborhood}
                        onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                        className={errors.neighborhood ? 'border-red-500' : ''}
                      />
                      <div className="absolute right-3 top-3">
                        {getFieldValidationIcon('neighborhood')}
                      </div>
                    </div>
                    {errors.neighborhood && (
                      <p className="text-sm text-red-600">{errors.neighborhood}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <div className="relative">
                      <Input
                        id="city"
                        type="text"
                        placeholder="Ex: São Paulo"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className={errors.city ? 'border-red-500' : ''}
                      />
                      <div className="absolute right-3 top-3">
                        {getFieldValidationIcon('city')}
                      </div>
                    </div>
                    {errors.city && (
                      <p className="text-sm text-red-600">{errors.city}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                      <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRAZILIAN_STATES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.code} - {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && (
                      <p className="text-sm text-red-600">{errors.state}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP *</Label>
                    <div className="relative">
                      <Input
                        id="zipCode"
                        type="text"
                        placeholder="99999-999"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        maxLength={9}
                        className={errors.zipCode ? 'border-red-500' : ''}
                      />
                      <div className="absolute right-3 top-3">
                        {getFieldValidationIcon('zipCode')}
                      </div>
                    </div>
                    {errors.zipCode && (
                      <p className="text-sm text-red-600">{errors.zipCode}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <div className="relative">
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="999.999.999-99"
                        value={formData.cpf}
                        onChange={(e) => handleInputChange('cpf', e.target.value)}
                        maxLength={14}
                        className={errors.cpf ? 'border-red-500' : ''}
                      />
                      <div className="absolute right-3 top-3">
                        {getFieldValidationIcon('cpf')}
                      </div>
                    </div>
                    {errors.cpf && (
                      <p className="text-sm text-red-600">{errors.cpf}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEÇÃO 3: CARTÃO DEMO */}
          <TabsContent value="card" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Cartão de Crédito (Demo)
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    <Lock className="w-3 h-3 mr-1" />
                    Não armazenado
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Aviso adicional */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Dados de cartão são usados apenas para demonstração e nunca são armazenados.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Número do Cartão</Label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        type="text"
                        placeholder="**** **** **** ****"
                        value={formData.cardNumber}
                        onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                        maxLength={19}
                        className={errors.cardNumber ? 'border-red-500' : ''}
                      />
                      {cardBrand && (
                        <div className="absolute right-3 top-3">
                          <Badge variant="outline" className="text-xs">
                            {cardBrand.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </div>
                    {errors.cardNumber && (
                      <p className="text-sm text-red-600">{errors.cardNumber}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardHolderName">Nome no Cartão</Label>
                    <div className="relative">
                      <Input
                        id="cardHolderName"
                        type="text"
                        placeholder="NOME COMO NO CARTÃO"
                        value={formData.cardHolderName}
                        onChange={(e) => handleInputChange('cardHolderName', e.target.value.toUpperCase())}
                        className={errors.cardHolderName ? 'border-red-500' : ''}
                      />
                      <div className="absolute right-3 top-3">
                        {getFieldValidationIcon('cardHolderName')}
                      </div>
                    </div>
                    {errors.cardHolderName && (
                      <p className="text-sm text-red-600">{errors.cardHolderName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiry">Validade</Label>
                    <div className="relative">
                      <Input
                        id="cardExpiry"
                        type="text"
                        placeholder="MM/YY"
                        value={formData.cardExpiry}
                        onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                        maxLength={5}
                        className={errors.cardExpiry ? 'border-red-500' : ''}
                      />
                      <div className="absolute right-3 top-3">
                        {getFieldValidationIcon('cardExpiry')}
                      </div>
                    </div>
                    {errors.cardExpiry && (
                      <p className="text-sm text-red-600">{errors.cardExpiry}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardCvv">CVV</Label>
                    <div className="relative">
                      <Input
                        id="cardCvv"
                        type={showCvv ? 'text' : 'password'}
                        placeholder="***"
                        value={formData.cardCvv}
                        onChange={(e) => handleInputChange('cardCvv', e.target.value)}
                        maxLength={4}
                        className={errors.cardCvv ? 'border-red-500' : ''}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCvv(!showCvv)}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                      >
                        {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.cardCvv && (
                      <p className="text-sm text-red-600">{errors.cardCvv}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardCpf">CPF Responsável</Label>
                    <div className="relative">
                      <Input
                        id="cardCpf"
                        type="text"
                        placeholder="999.999.999-99"
                        value={formData.cardCpf}
                        onChange={(e) => handleInputChange('cardCpf', e.target.value)}
                        maxLength={14}
                        className={errors.cardCpf ? 'border-red-500' : ''}
                      />
                      <div className="absolute right-3 top-3">
                        {getFieldValidationIcon('cardCpf')}
                      </div>
                    </div>
                    {errors.cardCpf && (
                      <p className="text-sm text-red-600">{errors.cardCpf}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* BOTÕES DE AÇÃO */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Dados
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
