"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCurrentUser, useUsers } from '@/lib/hooks';
import { LogIn, Dumbbell, Heart, Target, UserPlus } from 'lucide-react';
import { UserRegister } from './UserRegister';
import { SubscriptionPlans } from './SubscriptionPlans';
import { PaymentScreen } from './PaymentScreen';

type AuthScreen = 'login' | 'register' | 'plans' | 'payment';

export function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'standard' | 'premium' | null>(null);
  const { login } = useCurrentUser();
  const { authenticateUser, users } = useUsers();

  // Debug: mostrar usuários carregados
  useEffect(() => {
    console.log('Usuários carregados no UserLogin:', users);
  }, [users]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Tentativa de login com:', { email, password });
      console.log('Usuários disponíveis para autenticação:', users);

      const user = authenticateUser(email, password);
      console.log('Resultado da autenticação:', user);
      
      if (user) {
        // Fazer login imediatamente
        login(user);
        // Não precisa mais de reload - o estado será atualizado automaticamente
      } else {
        setError('Email ou senha incorretos');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro interno. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setIsLoading(true);
    setEmail(demoEmail);
    setPassword(demoPassword);
    
    try {
      // Fazer login automaticamente
      const user = authenticateUser(demoEmail, demoPassword);
      if (user) {
        login(user);
        // Não precisa mais de reload - o estado será atualizado automaticamente
      } else {
        setError('Erro ao fazer login com credenciais demo');
      }
    } catch (error) {
      console.error('Erro no demo login:', error);
      setError('Erro interno. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSuccess = () => {
    // Após registro bem-sucedido, mostrar tela de planos
    setCurrentScreen('plans');
  };

  const handleSelectPlan = (planId: 'starter' | 'standard' | 'premium') => {
    setSelectedPlan(planId);
    setCurrentScreen('payment');
  };

  const handlePaymentSuccess = () => {
    // Após pagamento bem-sucedido, fazer login automático
    // Em um app real, você criaria o usuário no banco de dados
    // Por enquanto, vamos simular um login bem-sucedido
    const newUser = {
      id: 'new-user-' + Date.now(),
      name: 'Novo Usuário',
      email: 'novo@usuario.com',
      password: 'temp123',
      isAdmin: false,
      emailVerified: true,
      createdAt: new Date(),
      subscription: {
        plan: selectedPlan!,
        status: 'active' as const,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        canDowngrade: false,
        downgradableDate: new Date(Date.now() + 4 * 30 * 24 * 60 * 60 * 1000), // 4 meses
        dietsUsedThisMonth: 0,
        workoutsUsedThisMonth: 0
      }
    };
    
    login(newUser);
    // Não precisa mais de reload - o estado será atualizado automaticamente
  };

  // Renderizar tela baseada no estado atual
  if (currentScreen === 'register') {
    return (
      <UserRegister
        onBack={() => setCurrentScreen('login')}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  if (currentScreen === 'plans') {
    return (
      <SubscriptionPlans
        onSelectPlan={handleSelectPlan}
        onClose={() => setCurrentScreen('login')}
      />
    );
  }

  if (currentScreen === 'payment' && selectedPlan) {
    return (
      <PaymentScreen
        selectedPlan={selectedPlan}
        onBack={() => setCurrentScreen('plans')}
        onPaymentSuccess={handlePaymentSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center p-4 overflow-x-hidden">
      {/* Viewport meta tag para mobile nativo */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      
      <div className="w-full max-w-md">
        {/* Header - Mobile Optimized */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 sm:p-3 bg-blue-600 rounded-full">
              <Dumbbell className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
            FitAI Coach
          </h1>
          <p className="text-sm sm:text-base text-blue-700 dark:text-blue-300">
            Seu personal trainer com inteligência artificial
          </p>
        </div>

        {/* Login Form - Mobile First */}
        <Card className="shadow-xl border-blue-100 dark:border-blue-800">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl text-blue-900 dark:text-blue-100">
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
              Entrar na sua conta
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  disabled={isLoading}
                  className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 text-base"
                  autoComplete="email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 text-base"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            {/* Register Button - Mobile Optimized */}
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentScreen('register')}
                disabled={isLoading}
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 py-3 text-base"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Não tem conta? Cadastre-se agora mesmo
              </Button>
            </div>

            {/* Demo Credentials - Mobile Optimized */}
            <div className="mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <h4 className="font-semibold text-sm sm:text-base text-blue-900 dark:text-blue-100 mb-3">
                Contas de demonstração:
              </h4>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="w-full text-left justify-start border-blue-200 hover:bg-blue-100 text-xs sm:text-sm py-2"
                  onClick={() => handleDemoLogin('admin@fitai.com', 'admin123')}
                >
                  <strong>Admin:</strong>&nbsp;admin@fitai.com / admin123
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="w-full text-left justify-start border-blue-200 hover:bg-blue-100 text-xs sm:text-sm py-2"
                  onClick={() => handleDemoLogin('user@fitai.com', 'user123')}
                >
                  <strong>Usuário:</strong>&nbsp;user@fitai.com / user123
                </Button>
              </div>
            </div>

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                <p>Debug: {users.length} usuários carregados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features - Mobile Optimized */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
          <div className="p-3 sm:p-4 bg-white dark:bg-blue-900 rounded-lg shadow">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
              Dietas Personalizadas
            </p>
          </div>
          <div className="p-3 sm:p-4 bg-white dark:bg-blue-900 rounded-lg shadow">
            <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
              Treinos Inteligentes
            </p>
          </div>
          <div className="p-3 sm:p-4 bg-white dark:bg-blue-900 rounded-lg shadow">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
              Análise Corporal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}