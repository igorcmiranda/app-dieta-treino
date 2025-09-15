"use client";

import { useState, useEffect } from 'react';
import { User, UserProfile, FoodEntry, DietPlan, WorkoutPlan, BodyAnalysis, WorkoutProgress } from '@/lib/types';

// Dados demo para inicialização
const initializeDemoUsers = (): User[] => {
  return [
    {
      id: 'admin-1',
      name: 'Administrador',
      email: 'admin@fitai.com',
      password: 'admin123',
      isAdmin: true,
      emailVerified: true,
      createdAt: new Date()
    },
    {
      id: 'user-1',
      name: 'João Silva',
      email: 'user@fitai.com',
      password: 'user123',
      isAdmin: false,
      emailVerified: true,
      profile: {
        age: 32,
        gender: 'masculino',
        height: 180,
        weight: 75,
        activityLevel: 'moderado',
        goal: 'manter-peso-perder-gordura',
        preferredMuscleGroups: ['peito', 'braços', 'abdômen', 'pernas']
      },
      subscription: {
        plan: 'premium',
        status: 'active',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-12-01'),
        canDowngrade: true,
        downgradableDate: new Date('2025-10-01'),
        dietsUsedThisMonth: 0,
        workoutsUsedThisMonth: 0
      },
      createdAt: new Date()
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
        preferredMuscleGroups: ['pernas', 'glúteos']
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