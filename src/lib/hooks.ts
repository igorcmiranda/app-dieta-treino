"use client";

import { useState, useEffect } from 'react';
import { User, UserProfile, DietPlan, WorkoutPlan, BodyAnalysis, WorkoutProgress, ActivityLog } from '@/lib/types';

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  cpf?: string;
};

const useMySqlApi = process.env.NEXT_PUBLIC_DB_PROVIDER === 'mysql';

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.error || `Erro HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

// Dados demo para fallback local (quando API MySQL não está configurada)
const initializeDemoUsers = (): User[] => {
  return [
    {
      id: 'admin-1',
      name: 'Administrador',
      email: 'admin@fitai.com',
      password: 'admin123',
      isAdmin: true,
      emailVerified: true,
      createdAt: new Date(),
    },
    {
      id: 'user-1',
      name: 'João Silva',
      email: 'user@fitai.com',
      password: 'user123',
      isAdmin: false,
      emailVerified: true,
      createdAt: new Date(),
    },
    {
      id: 'user-2',
      name: 'Maria Santos',
      email: 'maria@fitai.com',
      password: 'maria123',
      isAdmin: false,
      emailVerified: true,
      profile: {
        age: 28,
        gender: 'feminino',
        height: 165,
        weight: 60,
        activityLevel: 'moderado',
        goal: 'manter-peso-perder-gordura',
        preferredMuscleGroups: ['pernas', 'glúteos'],
        foodRestrictions: [],
        foodPreferences: [],
      },
      createdAt: new Date(),
    },
    {
      id: 'user-3',
      name: 'Igor',
      email: 'igor@fitai.com',
      password: 'igor123',
      isAdmin: false,
      emailVerified: true,
      subscription: {
        plan: 'premium',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        canDowngrade: false,
        downgradableDate: new Date(Date.now() + 4 * 30 * 24 * 60 * 60 * 1000),
        dietsUsedThisMonth: 0,
        workoutsUsedThisMonth: 0,
        bodyAnalysesUsedThisMonth: 0,
      },
      createdAt: new Date(),
    },
  ];
};

// Hook base de localStorage
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        if (typeof window === 'undefined') return;
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        } else if (key === 'fitness-app-users' && !useMySqlApi) {
          const demoUsers = initializeDemoUsers();
          window.localStorage.setItem(key, JSON.stringify(demoUsers));
          setStoredValue(demoUsers as T);
        } else {
          setStoredValue(initialValue);
        }
      } catch (error) {
        console.error(`Error syncing localStorage key "${key}":`, error);
      }
    };

    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        } else if (key === 'fitness-app-users' && !useMySqlApi) {
          const demoUsers = initializeDemoUsers();
          window.localStorage.setItem(key, JSON.stringify(demoUsers));
          setStoredValue(demoUsers as T);
        }
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      if (key === 'fitness-app-users' && !useMySqlApi) {
        setStoredValue(initializeDemoUsers() as T);
      }
    } finally {
      setIsInitialized(true);
    }

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === key) {
        syncFromStorage();
      }
    };

    const handleCustomSync = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      if (!detail?.key || detail.key === key) {
        syncFromStorage();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('local-storage-sync', handleCustomSync);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('local-storage-sync', handleCustomSync);
    };
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key } }));
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

  useEffect(() => {
    if (!useMySqlApi) return;

    let active = true;
    const loadUsers = async () => {
      try {
        const data = await apiRequest<User[]>('/api/users');
        if (active) {
          setUsers(data.map(user => ({ ...user, createdAt: new Date(user.createdAt) })));
        }
      } catch {
        // Ignora erro para manter app utilizável sem quebrar a UI.
      }
    };

    void loadUsers();
    return () => {
      active = false;
    };
  }, []);

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };

    setUsers(prev => [...prev, newUser]);

    if (useMySqlApi) {
      void apiRequest<User>('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          isAdmin: userData.isAdmin,
          emailVerified: userData.emailVerified,
        }),
      }).then(serverUser => {
        setUsers(prev => [...prev.filter(u => u.email !== serverUser.email), { ...serverUser, createdAt: new Date(serverUser.createdAt) }]);
      }).catch(() => {
        // noop
      });
    }

    return newUser;
  };

  const registerUser = async (payload: RegisterPayload) => {
    if (!useMySqlApi) {
      const newUser = addUser({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
        cpf: payload.cpf,
        isAdmin: false,
        emailVerified: true,
      });
      return { user: newUser, requiresEmailVerification: false };
    }

    const result = await apiRequest<{ user: User; requiresEmailVerification: boolean }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const user = { ...result.user, createdAt: new Date(result.user.createdAt) };
    setUsers(prev => {
      const exists = prev.some(u => u.id === user.id);
      if (exists) return prev.map(u => (u.id === user.id ? user : u));
      return [...prev, user];
    });

    return result;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(user => (user.id === id ? { ...user, ...updates } : user)));

    if (useMySqlApi) {
      void apiRequest<User>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }).then(serverUser => {
        setUsers(prev => prev.map(user => (user.id === id ? { ...serverUser, createdAt: new Date(serverUser.createdAt) } : user)));
      }).catch(() => {
        // noop
      });
    }
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));

    if (useMySqlApi) {
      void apiRequest<{ success: boolean }>(`/api/users/${id}`, {
        method: 'DELETE',
      }).catch(() => {
        // noop
      });
    }
  };

  const getUserById = (id: string) => {
    return users.find(user => user.id === id);
  };

  const authenticateUser = async (email: string, password: string) => {
    if (!useMySqlApi) {
      return users.find(user => user.email === email && user.password === password) || null;
    }

    try {
      const result = await apiRequest<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const user = { ...result.user, createdAt: new Date(result.user.createdAt) };
      setUsers(prev => {
        const exists = prev.some(u => u.id === user.id);
        if (exists) return prev.map(u => (u.id === user.id ? user : u));
        return [...prev, user];
      });
      return user;
    } catch {
      return null;
    }
  };

  return {
    users,
    addUser,
    registerUser,
    updateUser,
    deleteUser,
    getUserById,
    authenticateUser,
    isInitialized,
  };
}

// Hook para gerenciar planos de dieta
export function useDietPlans() {
  const [dietPlans, setDietPlans] = useLocalStorage<DietPlan[]>('fitness-app-diet-plans', []);

  useEffect(() => {
    if (!useMySqlApi) return;

    let active = true;
    const load = async () => {
      try {
        const data = await apiRequest<DietPlan[]>('/api/diet-plans');
        if (active) {
          setDietPlans(data.map(plan => ({ ...plan, createdAt: new Date(plan.createdAt) })));
        }
      } catch {
        // noop
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const addDietPlan = (plan: Omit<DietPlan, 'createdAt'>) => {
    const newPlan: DietPlan = {
      ...plan,
      createdAt: new Date(),
    };
    setDietPlans(prev => [...prev.filter(p => p.userId !== plan.userId), newPlan]);

    if (useMySqlApi) {
      void apiRequest<{ success: boolean }>('/api/diet-plans', {
        method: 'POST',
        body: JSON.stringify(newPlan),
      }).catch(() => {
        // noop
      });
    }

    return newPlan;
  };

  const getDietPlanByUserId = (userId: string) => {
    return dietPlans.find(plan => plan.userId === userId);
  };

  return {
    dietPlans,
    addDietPlan,
    getDietPlanByUserId,
  };
}

// Hook para gerenciar planos de treino
export function useWorkoutPlans() {
  const [workoutPlans, setWorkoutPlans] = useLocalStorage<WorkoutPlan[]>('fitness-app-workout-plans', []);

  useEffect(() => {
    if (!useMySqlApi) return;

    let active = true;
    const load = async () => {
      try {
        const data = await apiRequest<WorkoutPlan[]>('/api/workout-plans');
        if (active) {
          setWorkoutPlans(data.map(plan => ({ ...plan, createdAt: new Date(plan.createdAt) })));
        }
      } catch {
        // noop
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const addWorkoutPlan = (plan: Omit<WorkoutPlan, 'createdAt'>) => {
    const newPlan: WorkoutPlan = {
      ...plan,
      createdAt: new Date(),
    };
    setWorkoutPlans(prev => [...prev.filter(p => p.userId !== plan.userId), newPlan]);

    if (useMySqlApi) {
      void apiRequest<{ success: boolean }>('/api/workout-plans', {
        method: 'POST',
        body: JSON.stringify(newPlan),
      }).catch(() => {
        // noop
      });
    }

    return newPlan;
  };

  const getWorkoutPlanByUserId = (userId: string) => {
    return workoutPlans.find(plan => plan.userId === userId);
  };

  return {
    workoutPlans,
    addWorkoutPlan,
    getWorkoutPlanByUserId,
  };
}

// Hook para gerenciar progresso de treino
export function useWorkoutProgress() {
  const [workoutProgress, setWorkoutProgress] = useLocalStorage<WorkoutProgress[]>('fitness-app-workout-progress', []);

  useEffect(() => {
    if (!useMySqlApi) return;

    let active = true;
    const load = async () => {
      try {
        const data = await apiRequest<WorkoutProgress[]>('/api/workout-progress');
        if (active) {
          setWorkoutProgress(data.map(item => ({ ...item, createdAt: new Date(item.createdAt) })));
        }
      } catch {
        // noop
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const addWorkoutProgress = (progress: Omit<WorkoutProgress, 'createdAt'>) => {
    const newProgress: WorkoutProgress = {
      ...progress,
      createdAt: new Date(),
    };

    setWorkoutProgress(prev => {
      const withoutCurrent = prev.filter(
        p => !(p.userId === progress.userId && p.date === progress.date && p.workoutDay === progress.workoutDay)
      );
      return [...withoutCurrent, newProgress];
    });

    if (useMySqlApi) {
      void apiRequest<{ success: boolean }>('/api/workout-progress', {
        method: 'POST',
        body: JSON.stringify(newProgress),
      }).catch(() => {
        // noop
      });
    }

    return newProgress;
  };

  const getWorkoutProgressByUserId = (userId: string) => {
    return workoutProgress.filter(progress => progress.userId === userId);
  };

  const getWorkoutProgressByDate = (userId: string, date: string) => {
    return workoutProgress.find(progress => progress.userId === userId && progress.date === date);
  };

  const updateWorkoutProgress = (userId: string, date: string, workoutDay: string, updates: Partial<WorkoutProgress>) => {
    const existing = workoutProgress.find(
      p => p.userId === userId && p.date === date && p.workoutDay === workoutDay
    );
    const merged = { ...(existing || {}), ...updates, userId, date, workoutDay } as WorkoutProgress;

    setWorkoutProgress(prev =>
      prev.map(progress => {
        if (progress.userId === userId && progress.date === date && progress.workoutDay === workoutDay) {
          return { ...progress, ...updates };
        }
        return progress;
      })
    );

    if (useMySqlApi) {
      void apiRequest<{ success: boolean }>('/api/workout-progress', {
        method: 'POST',
        body: JSON.stringify(merged),
      }).catch(() => {
        // noop
      });
    }
  };

  return {
    workoutProgress,
    addWorkoutProgress,
    getWorkoutProgressByUserId,
    getWorkoutProgressByDate,
    updateWorkoutProgress,
  };
}

// Hook para gerenciar análises corporais
export function useBodyAnalyses() {
  const [bodyAnalyses, setBodyAnalyses] = useLocalStorage<BodyAnalysis[]>('fitness-app-body-analyses', []);

  useEffect(() => {
    if (!useMySqlApi) return;

    let active = true;
    const load = async () => {
      try {
        const data = await apiRequest<BodyAnalysis[]>('/api/body-analyses');
        if (active) {
          setBodyAnalyses(data.map(item => ({ ...item, createdAt: new Date(item.createdAt) })));
        }
      } catch {
        // noop
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const addBodyAnalysis = (analysis: Omit<BodyAnalysis, 'createdAt'>) => {
    const newAnalysis: BodyAnalysis = {
      ...analysis,
      createdAt: new Date(),
    };

    setBodyAnalyses(prev => [...prev.filter(a => a.userId !== analysis.userId), newAnalysis]);

    if (useMySqlApi) {
      void apiRequest<{ success: boolean }>('/api/body-analyses', {
        method: 'POST',
        body: JSON.stringify(newAnalysis),
      }).catch(() => {
        // noop
      });
    }

    return newAnalysis;
  };

  const getBodyAnalysisByUserId = (userId: string) => {
    return bodyAnalyses.find(analysis => analysis.userId === userId);
  };

  return {
    bodyAnalyses,
    addBodyAnalysis,
    getBodyAnalysisByUserId,
  };
}

// Hook para sessão atual
export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('fitness-app-current-user', null);

  useEffect(() => {
    if (!useMySqlApi) return;

    let active = true;
    const loadMe = async () => {
      try {
        const result = await apiRequest<{ user: User | null }>('/api/auth/me');
        if (!active) return;

        if (result.user) {
          setCurrentUser({ ...result.user, createdAt: new Date(result.user.createdAt) });
        } else {
          setCurrentUser(null);
        }
      } catch {
        if (active) setCurrentUser(null);
      }
    };

    void loadMe();
    return () => {
      active = false;
    };
  }, []);

  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = async () => {
    if (useMySqlApi) {
      try {
        await apiRequest<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
      } catch {
        // noop
      }
    }
    setCurrentUser(null);
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);

    if (useMySqlApi) {
      void apiRequest<User>(`/api/users/${updatedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }).catch(() => {
        // noop
      });
    }
  };

  return {
    currentUser,
    login,
    logout,
    updateCurrentUser,
    isLoggedIn: !!currentUser,
    isAdmin: currentUser?.isAdmin || false,
  };
}

// Hook simples de logs de atividade (local)
export function useActivityLogger() {
  const [logs, setLogs] = useLocalStorage<ActivityLog[]>('fitness-app-activity-logs', []);

  const logActivity = (entry: Omit<ActivityLog, 'id' | 'timestamp'> & { timestamp?: Date | string }) => {
    const newLog: ActivityLog = {
      ...entry,
      id: Date.now().toString(),
      timestamp: entry.timestamp || new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev].slice(0, 5000));
    return newLog;
  };

  const getActivityLogs = (filters?: {
    search?: string;
    userId?: string;
    action?: string;
    status?: 'success' | 'error' | 'warning';
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) => {
    let filtered = [...logs];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(log =>
        log.details.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.userEmail.toLowerCase().includes(q)
      );
    }
    if (filters?.userId) filtered = filtered.filter(log => log.userId === filters.userId);
    if (filters?.action) filtered = filtered.filter(log => log.action === filters.action);
    if (filters?.status) filtered = filtered.filter(log => log.status === filters.status);
    if (filters?.startDate) filtered = filtered.filter(log => new Date(log.timestamp) >= filters.startDate!);
    if (filters?.endDate) filtered = filtered.filter(log => new Date(log.timestamp) <= filters.endDate!);

    const total = filtered.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    const paged = filtered.slice(offset, offset + limit);

    return {
      logs: paged,
      total,
      hasMore: offset + limit < total,
    };
  };

  const getLogStats = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const byStatus = logs.reduce(
      (acc, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1;
        return acc;
      },
      { success: 0, error: 0, warning: 0 } as Record<'success' | 'error' | 'warning', number>
    );

    const byAction = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: logs.length,
      today: logs.filter(log => new Date(log.timestamp) >= startOfToday).length,
      yesterday: logs.filter(log => {
        const t = new Date(log.timestamp);
        return t >= startOfYesterday && t < startOfToday;
      }).length,
      thisWeek: logs.filter(log => new Date(log.timestamp) >= startOfWeek).length,
      byStatus,
      byAction,
    };
  };

  return {
    logActivity,
    getActivityLogs,
    getLogStats,
  };
}

// Hook simples para recuperação de senha (modo local)
export function usePasswordReset() {
  const [users, setUsers] = useLocalStorage<User[]>('fitness-app-users', []);
  const [tokens, setTokens] = useLocalStorage<Array<{ token: string; email: string; createdAt: string; used: boolean }>>(
    'fitness-app-password-reset-tokens',
    []
  );
  const [attempts, setAttempts] = useLocalStorage<Record<string, { count: number; firstAttemptAt: string }>>(
    'fitness-app-password-reset-attempts',
    {}
  );

  const checkRateLimit = (email: string) => {
    const item = attempts[email];
    if (!item) return true;
    const first = new Date(item.firstAttemptAt);
    const now = new Date();
    const withinHour = now.getTime() - first.getTime() < 60 * 60 * 1000;
    if (!withinHour) return true;
    return item.count < 5;
  };

  const incrementAttempt = (email: string) => {
    setAttempts(prev => {
      const now = new Date().toISOString();
      const item = prev[email];
      if (!item) return { ...prev, [email]: { count: 1, firstAttemptAt: now } };
      const first = new Date(item.firstAttemptAt);
      const withinHour = new Date().getTime() - first.getTime() < 60 * 60 * 1000;
      if (!withinHour) return { ...prev, [email]: { count: 1, firstAttemptAt: now } };
      return { ...prev, [email]: { ...item, count: item.count + 1 } };
    });
  };

  const emailExists = (email: string) => users.some(u => u.email.toLowerCase() === email.toLowerCase());

  const createResetToken = (email: string) => {
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setTokens(prev => [{ token, email, createdAt: new Date().toISOString(), used: false }, ...prev].slice(0, 500));
    return token;
  };

  const validateToken = (token: string) => {
    const found = tokens.find(t => t.token === token);
    if (!found) return { valid: false, error: 'Token inválido' };
    if (found.used) return { valid: false, error: 'Token já utilizado' };
    const created = new Date(found.createdAt);
    if (Date.now() - created.getTime() > 60 * 60 * 1000) {
      return { valid: false, error: 'Token expirado' };
    }
    return { valid: true, email: found.email };
  };

  const resetPassword = (token: string, newPassword: string) => {
    const validation = validateToken(token);
    if (!validation.valid || !validation.email) return { success: false, error: validation.error };

    setUsers(prev =>
      prev.map(u => (u.email.toLowerCase() === validation.email!.toLowerCase() ? { ...u, password: newPassword } : u))
    );
    setTokens(prev => prev.map(t => (t.token === token ? { ...t, used: true } : t)));
    return { success: true };
  };

  return {
    checkRateLimit,
    incrementAttempt,
    createResetToken,
    emailExists,
    validateToken,
    resetPassword,
  };
}
