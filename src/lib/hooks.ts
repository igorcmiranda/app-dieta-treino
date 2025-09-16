"use client";

import { useState, useEffect } from 'react';
import { User, UserProfile, FoodEntry, DietPlan, WorkoutPlan, BodyAnalysis, WorkoutProgress, PasswordResetToken, ResetAttempt } from '@/lib/types';

// Dados demo para inicialização
const initializeDemoUsers = (): User[] => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  return [
    {
      id: 'admin-1',
      name: 'Pedro Silva',
      email: 'admin@fitai.com',
      password: 'admin123',
      isAdmin: true,
      emailVerified: true,
      profile: {
        age: 35,
        gender: 'masculino',
        height: 180,
        weight: 80,
        activityLevel: 'moderado',
        goal: 'manter-peso-perder-gordura',
        preferredMuscleGroups: ['peito', 'braços', 'abdômen', 'pernas'],
        foodRestrictions: [],
        foodPreferences: ['frango', 'arroz integral', 'brócolis', 'banana']
      },
      subscription: {
        plan: 'premium',
        status: 'active',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-09-01'),
        canDowngrade: true,
        downgradableDate: new Date('2025-10-01'),
        dietsUsedThisMonth: 0,
        workoutsUsedThisMonth: 0,
        bodyAnalysesUsedThisMonth: 0,
        monthlyResetDate: nextMonth
      },
      createdAt: new Date()
    },
    {
      id: 'starter-1',
      name: 'Usuário Starter',
      email: 'starter@test.com',
      password: 'teste123',
      isAdmin: false,
      emailVerified: true,
      profile: {
        age: 25,
        gender: 'masculino',
        height: 175,
        weight: 70,
        activityLevel: 'leve',
        goal: 'manter-peso-perder-gordura',
        preferredMuscleGroups: ['peito', 'braços'],
        foodRestrictions: [],
        foodPreferences: ['frango', 'arroz', 'salada']
      },
      subscription: {
        plan: 'starter',
        status: 'active',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-10-01'),
        canDowngrade: false,
        dietsUsedThisMonth: 0,
        workoutsUsedThisMonth: 0,
        bodyAnalysesUsedThisMonth: 0,
        monthlyResetDate: nextMonth
      },
      createdAt: new Date()
    },
    {
      id: 'standard-1',
      name: 'Usuário Standard',
      email: 'standard@test.com',
      password: 'teste123',
      isAdmin: false,
      emailVerified: true,
      profile: {
        age: 30,
        gender: 'feminino',
        height: 165,
        weight: 65,
        activityLevel: 'moderado',
        goal: 'emagrecer',
        preferredMuscleGroups: ['pernas', 'glúteos', 'abdômen'],
        foodRestrictions: ['lactose'],
        foodPreferences: ['peixe', 'quinoa', 'abacate', 'verduras']
      },
      subscription: {
        plan: 'standard',
        status: 'active',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-12-01'),
        canDowngrade: true,
        downgradableDate: new Date('2025-10-01'),
        dietsUsedThisMonth: 0,
        workoutsUsedThisMonth: 0,
        bodyAnalysesUsedThisMonth: 0,
        monthlyResetDate: nextMonth
      },
      createdAt: new Date()
    }
  ];
};

// Simulação de banco de dados local (localStorage)
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsedValue = JSON.parse(item);
          setStoredValue(parsedValue);
        } else if (key === 'fitness-app-users') {
          // Inicializar dados demo se não existirem usuários
          const demoUsers = initializeDemoUsers();
          window.localStorage.setItem(key, JSON.stringify(demoUsers));
          setStoredValue(demoUsers as T);
        }
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      if (key === 'fitness-app-users') {
        // Fallback para dados demo em caso de erro
        const demoUsers = initializeDemoUsers();
        setStoredValue(demoUsers as T);
      }
    } finally {
      setIsInitialized(true);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, isInitialized] as const;
}

// Hook para gerenciar usuários
export function useUsers() {
  const [users, setUsers, isInitialized] = useLocalStorage<User[]>('fitness-app-users', []);

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...updates } : user
    ));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  const getUserById = (id: string) => {
    return users.find(user => user.id === id);
  };

  const authenticateUser = (email: string, password: string) => {
    console.log('Tentando autenticar:', email, password);
    console.log('Usuários disponíveis:', users);
    const user = users.find(user => user.email === email && user.password === password);
    console.log('Usuário encontrado:', user);
    return user;
  };

  return {
    users,
    addUser,
    updateUser,
    deleteUser,
    getUserById,
    authenticateUser,
    isInitialized
  };
}

// Hook para gerenciar planos de dieta
export function useDietPlans() {
  const [dietPlans, setDietPlans] = useLocalStorage<DietPlan[]>('fitness-app-diet-plans', []);

  const addDietPlan = (plan: Omit<DietPlan, 'createdAt'>) => {
    const newPlan: DietPlan = {
      ...plan,
      createdAt: new Date(),
    };
    setDietPlans(prev => [...prev.filter(p => p.userId !== plan.userId), newPlan]);
    return newPlan;
  };

  const getDietPlanByUserId = (userId: string) => {
    return dietPlans.find(plan => plan.userId === userId);
  };

  return {
    dietPlans,
    addDietPlan,
    getDietPlanByUserId
  };
}

// Hook para gerenciar planos de treino
export function useWorkoutPlans() {
  const [workoutPlans, setWorkoutPlans] = useLocalStorage<WorkoutPlan[]>('fitness-app-workout-plans', []);

  const addWorkoutPlan = (plan: Omit<WorkoutPlan, 'createdAt'>) => {
    const newPlan: WorkoutPlan = {
      ...plan,
      createdAt: new Date(),
    };
    setWorkoutPlans(prev => [...prev.filter(p => p.userId !== plan.userId), newPlan]);
    return newPlan;
  };

  const getWorkoutPlanByUserId = (userId: string) => {
    return workoutPlans.find(plan => plan.userId === userId);
  };

  return {
    workoutPlans,
    addWorkoutPlan,
    getWorkoutPlanByUserId
  };
}

// Hook para gerenciar progresso de treino
export function useWorkoutProgress() {
  const [workoutProgress, setWorkoutProgress] = useLocalStorage<WorkoutProgress[]>('fitness-app-workout-progress', []);

  const addWorkoutProgress = (progress: Omit<WorkoutProgress, 'createdAt'>) => {
    const newProgress: WorkoutProgress = {
      ...progress,
      createdAt: new Date(),
    };
    setWorkoutProgress(prev => [...prev, newProgress]);
    return newProgress;
  };

  const getWorkoutProgressByUserId = (userId: string) => {
    return workoutProgress.filter(progress => progress.userId === userId);
  };

  const getWorkoutProgressByDate = (userId: string, date: string) => {
    return workoutProgress.find(progress => 
      progress.userId === userId && progress.date === date
    );
  };

  const updateWorkoutProgress = (userId: string, date: string, workoutDay: string, updates: Partial<WorkoutProgress>) => {
    setWorkoutProgress(prev => prev.map(progress => 
      progress.userId === userId && progress.date === date && progress.workoutDay === workoutDay
        ? { ...progress, ...updates }
        : progress
    ));
  };

  return {
    workoutProgress,
    addWorkoutProgress,
    getWorkoutProgressByUserId,
    getWorkoutProgressByDate,
    updateWorkoutProgress
  };
}

// Hook para gerenciar análises corporais
export function useBodyAnalyses() {
  const [bodyAnalyses, setBodyAnalyses] = useLocalStorage<BodyAnalysis[]>('fitness-app-body-analyses', []);

  const addBodyAnalysis = (analysis: Omit<BodyAnalysis, 'createdAt'>) => {
    const newAnalysis: BodyAnalysis = {
      ...analysis,
      createdAt: new Date(),
    };
    setBodyAnalyses(prev => [...prev.filter(a => a.userId !== analysis.userId), newAnalysis]);
    return newAnalysis;
  };

  const getBodyAnalysisByUserId = (userId: string) => {
    return bodyAnalyses.find(analysis => analysis.userId === userId);
  };

  return {
    bodyAnalyses,
    addBodyAnalysis,
    getBodyAnalysisByUserId
  };
}

// Hook para sessão atual
export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('fitness-app-current-user', null);

  const login = (user: User) => {
    console.log('Fazendo login do usuário:', user);
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
    }
  };

  return {
    currentUser,
    login,
    logout,
    updateCurrentUser,
    isLoggedIn: !!currentUser,
    isAdmin: currentUser?.isAdmin || false
  };
}

// Hook para gerenciar recuperação de senha - SEGURANÇA ROBUSTA
export function usePasswordReset() {
  const [resetTokens, setResetTokens] = useLocalStorage<Record<string, PasswordResetToken>>('fitness-app-reset-tokens', {});
  const [resetAttempts, setResetAttempts] = useLocalStorage<Record<string, ResetAttempt>>('fitness-app-reset-attempts', {});
  const { users, updateUser } = useUsers();

  // Gerar token seguro
  const generateSecureToken = (): string => {
    // Usar crypto API se disponível, senão fallback
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID() + '-' + Date.now();
    }
    // Fallback para environments que não suportam crypto
    return 'reset-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
  };

  // Verificar rate limiting (máximo 3 tentativas por hora)
  const checkRateLimit = (email: string): boolean => {
    const attempt = resetAttempts[email];
    if (!attempt) return true;

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Se está bloqueado, verificar se ainda está no período de bloqueio
    if (attempt.blockedUntil && now < attempt.blockedUntil) {
      return false;
    }

    // Se a última tentativa foi há mais de 1 hora, resetar contador
    if (attempt.lastAttempt < hourAgo) {
      setResetAttempts(prev => ({
        ...prev,
        [email]: { email, attempts: 0, lastAttempt: now }
      }));
      return true;
    }

    // Se já fez 3 ou mais tentativas na última hora
    if (attempt.attempts >= 3) {
      const blockedUntil = new Date(now.getTime() + 60 * 60 * 1000); // Bloquear por 1 hora
      setResetAttempts(prev => ({
        ...prev,
        [email]: { ...attempt, blockedUntil }
      }));
      return false;
    }

    return true;
  };

  // Incrementar tentativa
  const incrementAttempt = (email: string) => {
    const now = new Date();
    setResetAttempts(prev => ({
      ...prev,
      [email]: {
        email,
        attempts: (prev[email]?.attempts || 0) + 1,
        lastAttempt: now,
        blockedUntil: prev[email]?.blockedUntil
      }
    }));
  };

  // Criar token de reset
  const createResetToken = (email: string): string => {
    const token = generateSecureToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    
    const resetToken: PasswordResetToken = {
      email,
      token,
      expires,
      createdAt: new Date(),
      used: false
    };

    // Limpar tokens antigos para este email
    setResetTokens(prev => {
      const newTokens = { ...prev };
      Object.keys(newTokens).forEach(key => {
        if (newTokens[key].email === email) {
          delete newTokens[key];
        }
      });
      newTokens[token] = resetToken;
      return newTokens;
    });

    return token;
  };

  // Validar token
  const validateToken = (token: string): { valid: boolean; email?: string; error?: string } => {
    const resetToken = resetTokens[token];
    
    if (!resetToken) {
      return { valid: false, error: 'Token inválido ou expirado' };
    }

    if (resetToken.used) {
      return { valid: false, error: 'Este token já foi utilizado' };
    }

    if (new Date() > resetToken.expires) {
      return { valid: false, error: 'Token expirado. Solicite um novo link de recuperação.' };
    }

    return { valid: true, email: resetToken.email };
  };

  // Marcar token como usado
  const markTokenAsUsed = (token: string) => {
    setResetTokens(prev => ({
      ...prev,
      [token]: { ...prev[token], used: true }
    }));
  };

  // Limpar tokens expirados (limpeza automática)
  const cleanExpiredTokens = () => {
    const now = new Date();
    setResetTokens(prev => {
      const newTokens = { ...prev };
      Object.keys(newTokens).forEach(key => {
        if (newTokens[key].expires < now) {
          delete newTokens[key];
        }
      });
      return newTokens;
    });
  };

  // Verificar se email existe (sem revelar esta informação)
  const emailExists = (email: string): boolean => {
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
  };

  // Reset da senha
  const resetPassword = (token: string, newPassword: string): { success: boolean; error?: string } => {
    const validation = validateToken(token);
    
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const email = validation.email!;
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    // Validar força da senha
    if (newPassword.length < 6) {
      return { success: false, error: 'A senha deve ter pelo menos 6 caracteres' };
    }

    // Atualizar senha do usuário
    updateUser(user.id, { password: newPassword });
    
    // Marcar token como usado
    markTokenAsUsed(token);
    
    // Limpar tentativas para este email
    setResetAttempts(prev => {
      const newAttempts = { ...prev };
      delete newAttempts[email];
      return newAttempts;
    });

    return { success: true };
  };

  return {
    checkRateLimit,
    incrementAttempt,
    createResetToken,
    validateToken,
    resetPassword,
    emailExists,
    cleanExpiredTokens
  };
}