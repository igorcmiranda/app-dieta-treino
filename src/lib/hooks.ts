"use client";

import { useState, useEffect } from 'react';
import { User, UserProfile, FoodEntry, DietPlan, WorkoutPlan, BodyAnalysis, WorkoutProgress, PasswordResetToken, ResetAttempt, ActivityLog } from '@/lib/types';

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
        
        if (key === 'fitness-app-users') {
          console.log('[USER INITIALIZATION] Checking demo users...');
          
          let existingUsers: User[] = [];
          if (item) {
            try {
              existingUsers = JSON.parse(item) as User[];
              console.log('[USER INITIALIZATION] Existing users found:', existingUsers.map(u => u.email));
            } catch (parseError) {
              console.error('[USER INITIALIZATION] Error parsing existing users:', parseError);
              existingUsers = [];
            }
          }
          
          // Verificar se usuários essenciais existem
          const requiredEmails = ['admin@fitai.com', 'starter@test.com', 'standard@test.com'];
          const existingEmails = existingUsers.map(u => u.email);
          const missingUsers = requiredEmails.filter(email => !existingEmails.includes(email));
          
          if (missingUsers.length > 0 || existingUsers.length === 0) {
            console.log('[USER INITIALIZATION] Missing essential users:', missingUsers);
            console.log('[USER INITIALIZATION] Initializing demo users...');
            
            // Criar usuários demo
            const demoUsers = initializeDemoUsers();
            console.log('[USER INITIALIZATION] Demo users created:', demoUsers.map(u => u.email));
            
            // Manter usuários manuais existentes que não sejam dos demos essenciais
            const manualUsers = existingUsers.filter(u => !requiredEmails.includes(u.email));
            if (manualUsers.length > 0) {
              console.log('[USER INITIALIZATION] Preserving manual users:', manualUsers.map(u => u.email));
            }
            
            // Combinar usuários demo + usuários manuais
            const allUsers = [...demoUsers, ...manualUsers];
            console.log('[USER INITIALIZATION] Final user list:', allUsers.map(u => ({ email: u.email, name: u.name, plan: u.subscription?.plan })));
            
            window.localStorage.setItem(key, JSON.stringify(allUsers));
            setStoredValue(allUsers as T);
          } else {
            console.log('[USER INITIALIZATION] All essential users exist, using existing data');
            setStoredValue(existingUsers as T);
          }
        } else if (item) {
          const parsedValue = JSON.parse(item);
          setStoredValue(parsedValue);
        } else {
          // Para outras chaves, usar valor inicial
          setStoredValue(initialValue);
        }
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      if (key === 'fitness-app-users') {
        // Fallback para dados demo em caso de erro
        console.log('[USER INITIALIZATION] Error fallback - creating demo users');
        const demoUsers = initializeDemoUsers();
        setStoredValue(demoUsers as T);
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(demoUsers));
          }
        } catch (writeError) {
          console.error('[USER INITIALIZATION] Error writing fallback users to localStorage:', writeError);
        }
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

// Função utilitária para forçar reset dos usuários demo
export function forceResetDemoUsers() {
  try {
    console.log('[FORCE RESET] Forçando reset dos usuários demo...');
    const demoUsers = initializeDemoUsers();
    
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('fitness-app-users', JSON.stringify(demoUsers));
      console.log('[FORCE RESET] Usuários demo reinicializados no localStorage:', demoUsers.map(u => u.email));
    }
    
    return demoUsers;
  } catch (error) {
    console.error('[FORCE RESET] Erro ao forçar reset dos usuários demo:', error);
    return [];
  }
}

// Hook para gerenciar usuários
export function useUsers() {
  const [users, setUsers, isInitialized] = useLocalStorage<User[]>('fitness-app-users', []);

  // Verificar e garantir que usuários demo existem quando o hook é inicializado
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      const requiredEmails = ['admin@fitai.com', 'starter@test.com', 'standard@test.com'];
      const existingEmails = users.map(u => u.email);
      const missingUsers = requiredEmails.filter(email => !existingEmails.includes(email));
      
      console.log('[useUsers] Verificando usuários essenciais...');
      console.log('[useUsers] Usuários existentes:', existingEmails);
      console.log('[useUsers] Usuários essenciais faltando:', missingUsers);
      
      if (missingUsers.length > 0) {
        console.log('[useUsers] Usuários demo essenciais faltando, forçando reinicialização...');
        const demoUsers = initializeDemoUsers();
        
        // Preservar usuários manuais que não sejam demos
        const manualUsers = users.filter(u => !requiredEmails.includes(u.email));
        if (manualUsers.length > 0) {
          console.log('[useUsers] Preservando usuários manuais:', manualUsers.map(u => u.email));
        }
        
        // Combinar demos + manuais
        const allUsers = [...demoUsers, ...manualUsers];
        console.log('[useUsers] Atualizando usuários para:', allUsers.map(u => ({ email: u.email, name: u.name, plan: u.subscription?.plan })));
        
        setUsers(allUsers);
      } else {
        console.log('[useUsers] Todos os usuários essenciais existem');
      }
    }
  }, [isInitialized, users.length]);

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

// Hook para logging de atividades administrativas
export function useActivityLogger() {
  const [logs, setLogs] = useLocalStorage<ActivityLog[]>('admin-activity-logs', []);

  // Função para registrar uma nova atividade
  const logActivity = (logData: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    try {
      const newLog: ActivityLog = {
        ...logData,
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };

      setLogs(prev => {
        // Adicionar o novo log no início (mais recente primeiro)
        const updatedLogs = [newLog, ...prev];
        
        // Implementar limpeza automática - manter apenas logs dos últimos 90 dias
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        return updatedLogs.filter(log => new Date(log.timestamp) >= ninetyDaysAgo);
      });

      console.log(`[ACTIVITY LOG] ${logData.action}: ${logData.details}`, logData);
    } catch (error) {
      console.error('Erro ao registrar log de atividade:', error);
    }
  };

  // Função para buscar logs com filtros opcionais
  const getActivityLogs = (filters?: {
    userId?: string;
    action?: string;
    status?: 'success' | 'error' | 'warning';
    startDate?: Date;
    endDate?: Date;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    try {
      let filteredLogs = [...logs];

      if (filters) {
        const {
          userId,
          action,
          status,
          startDate,
          endDate,
          search,
          limit = 50,
          offset = 0
        } = filters;

        // Filtrar por userId
        if (userId) {
          filteredLogs = filteredLogs.filter(log => log.userId === userId);
        }

        // Filtrar por ação
        if (action) {
          filteredLogs = filteredLogs.filter(log => 
            log.action.toLowerCase().includes(action.toLowerCase())
          );
        }

        // Filtrar por status
        if (status) {
          filteredLogs = filteredLogs.filter(log => log.status === status);
        }

        // Filtrar por período
        if (startDate) {
          filteredLogs = filteredLogs.filter(log => 
            new Date(log.timestamp) >= startDate
          );
        }

        if (endDate) {
          filteredLogs = filteredLogs.filter(log => 
            new Date(log.timestamp) <= endDate
          );
        }

        // Busca por texto
        if (search && search.trim()) {
          const searchTerm = search.toLowerCase();
          filteredLogs = filteredLogs.filter(log =>
            log.userName.toLowerCase().includes(searchTerm) ||
            log.userEmail.toLowerCase().includes(searchTerm) ||
            log.action.toLowerCase().includes(searchTerm) ||
            log.details.toLowerCase().includes(searchTerm)
          );
        }

        // Ordenar por timestamp (mais recente primeiro)
        filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Paginação
        return {
          logs: filteredLogs.slice(offset, offset + limit),
          total: filteredLogs.length,
          hasMore: filteredLogs.length > offset + limit
        };
      }

      // Retornar todos os logs ordenados se não houver filtros
      filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return {
        logs: filteredLogs,
        total: filteredLogs.length,
        hasMore: false
      };
    } catch (error) {
      console.error('Erro ao buscar logs de atividade:', error);
      return {
        logs: [],
        total: 0,
        hasMore: false
      };
    }
  };

  // Função para estatísticas rápidas
  const getLogStats = () => {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);

      return {
        total: logs.length,
        today: logs.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate.toDateString() === today.toDateString();
        }).length,
        yesterday: logs.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate.toDateString() === yesterday.toDateString();
        }).length,
        thisWeek: logs.filter(log => new Date(log.timestamp) >= thisWeek).length,
        byStatus: {
          success: logs.filter(log => log.status === 'success').length,
          error: logs.filter(log => log.status === 'error').length,
          warning: logs.filter(log => log.status === 'warning').length
        },
        byAction: logs.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas de logs:', error);
      return {
        total: 0,
        today: 0,
        yesterday: 0,
        thisWeek: 0,
        byStatus: { success: 0, error: 0, warning: 0 },
        byAction: {}
      };
    }
  };

  // Função para limpar logs antigos manualmente (opcional)
  const clearOldLogs = (daysToKeep: number = 90) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      setLogs(prev => prev.filter(log => new Date(log.timestamp) >= cutoffDate));
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
    }
  };

  return {
    logActivity,
    getActivityLogs,
    getLogStats,
    clearOldLogs,
    totalLogs: logs.length
  };
}