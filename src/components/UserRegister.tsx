"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Mail, Phone, CreditCard, ArrowLeft } from 'lucide-react';

interface UserRegisterProps {
  onBack: () => void;
  onRegisterSuccess: () => void;
}

export function UserRegister({ onBack, onRegisterSuccess }: UserRegisterProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Formato: (11) 99999-9999';
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(formData.cpf)) {
      newErrors.cpf = 'Formato: 000.000.000-00';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === 'phone') {
      formattedValue = formatPhone(value);
    } else if (field === 'cpf') {
      formattedValue = formatCPF(value);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simular criação de conta
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular envio de email de verificação
      setShowVerification(true);
    } catch (error) {
      setErrors({ general: 'Erro ao criar conta. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    // Simular verificação de email
    onRegisterSuccess();
  };

  if (showVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-blue-100 dark:border-blue-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              Verifique seu email
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-blue-700 dark:text-blue-300">
              Enviamos um link de verificação para:
            </p>
            <p className="font-semibold text-blue-900 dark:text-blue-100">
              {formData.email}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Clique no link do email para ativar sua conta e fazer login.
            </p>
            
            <div className="pt-4">
              <Button
                onClick={handleVerificationComplete}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Já verifiquei meu email
              </Button>
            </div>
            
            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full text-blue-600 hover:text-blue-700"
            >
              Voltar ao login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-blue-100 dark:border-blue-800">
          <CardHeader className="text-center">
            <Button
              variant="ghost"
              onClick={onBack}
              className="absolute left-4 top-4 p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="flex items-center justify-center gap-2 text-blue-900 dark:text-blue-100">
              <UserPlus className="w-5 h-5" />
              Criar conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-blue-800 dark:text-blue-200">
                  Nome completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Seu nome completo"
                  className={`border-blue-200 dark:border-blue-700 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-800 dark:text-blue-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="seu@email.com"
                  className={`border-blue-200 dark:border-blue-700 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-blue-800 dark:text-blue-200">
                  Telefone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className={`border-blue-200 dark:border-blue-700 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : ''
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-blue-800 dark:text-blue-200">
                  CPF
                </Label>
                <Input
                  id="cpf"
                  type="text"
                  value={formData.cpf}
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

              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-800 dark:text-blue-200">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  className={`border-blue-200 dark:border-blue-700 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-blue-800 dark:text-blue-200">
                  Confirmar senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className={`border-blue-200 dark:border-blue-700 focus:ring-blue-500 ${
                    errors.confirmPassword ? 'border-red-500' : ''
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                )}
              </div>

              {errors.general && (
                <div className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-950 p-2 rounded">
                  {errors.general}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-blue-600 hover:text-blue-700"
              >
                Já tem conta? Faça login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}