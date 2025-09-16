import { User, UserSubscription } from './types';

// Função para verificar se precisa resetar contadores mensais
export function shouldResetMonthlyUsage(user: User): boolean {
  if (!user.subscription || !user.subscription.monthlyResetDate) return false;
  
  const now = new Date();
  const resetDate = new Date(user.subscription.monthlyResetDate);
  return now >= resetDate;
}

// Função para resetar contadores mensais
export function resetMonthlyUsage(user: User): User {
  if (!user.subscription) return user;
  
  const now = new Date();
  const nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // Primeiro dia do próximo mês
  
  return {
    ...user,
    subscription: {
      ...user.subscription,
      dietsUsedThisMonth: 0,
      workoutsUsedThisMonth: 0,
      bodyAnalysesUsedThisMonth: 0,
      monthlyResetDate: nextResetDate
    }
  };
}

// Função para incrementar uso de dietas
export function incrementDietUsage(user: User): User {
  if (!user.subscription) return user;
  
  return {
    ...user,
    subscription: {
      ...user.subscription,
      dietsUsedThisMonth: user.subscription.dietsUsedThisMonth + 1
    }
  };
}

// Função para incrementar uso de treinos
export function incrementWorkoutUsage(user: User): User {
  if (!user.subscription) return user;
  
  return {
    ...user,
    subscription: {
      ...user.subscription,
      workoutsUsedThisMonth: user.subscription.workoutsUsedThisMonth + 1
    }
  };
}

// Função para incrementar uso de análises corporais
export function incrementBodyAnalysisUsage(user: User): User {
  if (!user.subscription) return user;
  
  return {
    ...user,
    subscription: {
      ...user.subscription,
      bodyAnalysesUsedThisMonth: (user.subscription.bodyAnalysesUsedThisMonth || 0) + 1
    }
  };
}

export function hasActiveSubscription(user: User): boolean {
  if (!user.subscription) return false;
  
  const now = new Date();
  // Ensure endDate is converted to Date object if it's a string
  const endDate = new Date(user.subscription.endDate);
  
  return (
    user.subscription.status === 'active' &&
    endDate > now
  );
}

export function canAccessAI(user: User): boolean {
  return hasActiveSubscription(user);
}

export function canUseDiet(user: User): boolean {
  if (!hasActiveSubscription(user)) return false;
  
  const subscription = user.subscription!;
  
  if (subscription.plan === 'premium') {
    return true; // Dietas ilimitadas
  }
  
  const maxDiets = subscription.plan === 'starter' ? 1 : 2;
  return subscription.dietsUsedThisMonth < maxDiets;
}

export function canChangeDict(user: User): boolean {
  if (!hasActiveSubscription(user)) return false;
  
  const subscription = user.subscription!;
  return subscription.plan === 'standard' || subscription.plan === 'premium';
}

export function canUseWorkout(user: User): boolean {
  if (!hasActiveSubscription(user)) return false;
  
  const subscription = user.subscription!;
  
  const maxWorkouts = {
    starter: 1,
    standard: 2,
    premium: 4
  }[subscription.plan];
  
  return subscription.workoutsUsedThisMonth < maxWorkouts;
}

export function canUseBodyAnalysis(user: User): boolean {
  if (!hasActiveSubscription(user)) return false;
  
  const subscription = user.subscription!;
  
  const maxAnalyses = {
    starter: 1,
    standard: 2,
    premium: 4
  }[subscription.plan];
  
  return subscription.bodyAnalysesUsedThisMonth < maxAnalyses;
}

export function canConsultSupplement(user: User): boolean {
  if (!hasActiveSubscription(user)) return false;
  
  return user.subscription!.plan === 'premium';
}

export function canDowngrade(user: User): boolean {
  if (!hasActiveSubscription(user)) return false;
  
  const subscription = user.subscription!;
  
  if (!subscription.downgradableDate) return false;
  
  const now = new Date();
  // Ensure downgradableDate is converted to Date object if it's a string
  const downgradableDate = new Date(subscription.downgradableDate);
  return now >= downgradableDate;
}

export function getSubscriptionLimits(user: User) {
  if (!hasActiveSubscription(user)) {
    return {
      dietsPerMonth: 0,
      workoutsPerMonth: 0,
      bodyAnalysesPerMonth: 0,
      canChangeDiet: false,
      supplementConsultation: false,
      hasAIAccess: false
    };
  }
  
  const subscription = user.subscription!;
  
  const limits = {
    starter: {
      dietsPerMonth: 1,
      workoutsPerMonth: 1,
      bodyAnalysesPerMonth: 1,
      canChangeDiet: false,
      supplementConsultation: false,
      hasAIAccess: false
    },
    standard: {
      dietsPerMonth: 2,
      workoutsPerMonth: 2,
      bodyAnalysesPerMonth: 2,
      canChangeDiet: true,
      supplementConsultation: false,
      hasAIAccess: false
    },
    premium: {
      dietsPerMonth: 4,
      workoutsPerMonth: 4,
      bodyAnalysesPerMonth: 4,
      canChangeDiet: true,
      supplementConsultation: true,
      hasAIAccess: true
    }
  };
  
  return limits[subscription.plan];
}

export function getUsageStatus(user: User) {
  if (!hasActiveSubscription(user)) {
    return {
      dietsUsed: 0,
      workoutsUsed: 0,
      bodyAnalysesUsed: 0,
      dietsRemaining: 0,
      workoutsRemaining: 0,
      bodyAnalysesRemaining: 0
    };
  }
  
  const subscription = user.subscription!;
  const limits = getSubscriptionLimits(user);
  
  return {
    dietsUsed: subscription.dietsUsedThisMonth,
    workoutsUsed: subscription.workoutsUsedThisMonth,
    bodyAnalysesUsed: subscription.bodyAnalysesUsedThisMonth || 0,
    dietsRemaining: Math.max(0, limits.dietsPerMonth - subscription.dietsUsedThisMonth),
    workoutsRemaining: Math.max(0, limits.workoutsPerMonth - subscription.workoutsUsedThisMonth),
    bodyAnalysesRemaining: Math.max(0, limits.bodyAnalysesPerMonth - (subscription.bodyAnalysesUsedThisMonth || 0))
  };
}