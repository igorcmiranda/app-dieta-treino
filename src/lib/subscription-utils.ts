import { User, UserSubscription } from './types';

export function hasActiveSubscription(user: User): boolean {
  if (!user.subscription) return false;
  
  const now = new Date();
  return (
    user.subscription.status === 'active' &&
    user.subscription.endDate > now
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

export function canConsultSupplement(user: User): boolean {
  if (!hasActiveSubscription(user)) return false;
  
  return user.subscription!.plan === 'premium';
}

export function canDowngrade(user: User): boolean {
  if (!hasActiveSubscription(user)) return false;
  
  const subscription = user.subscription!;
  
  if (!subscription.downgradableDate) return false;
  
  const now = new Date();
  return now >= subscription.downgradableDate;
}

export function getSubscriptionLimits(user: User) {
  if (!hasActiveSubscription(user)) {
    return {
      dietsPerMonth: 0,
      workoutsPerMonth: 0,
      canChangeDiet: false,
      supplementConsultation: false
    };
  }
  
  const subscription = user.subscription!;
  
  const limits = {
    starter: {
      dietsPerMonth: 1,
      workoutsPerMonth: 1,
      canChangeDiet: false,
      supplementConsultation: false
    },
    standard: {
      dietsPerMonth: 2,
      workoutsPerMonth: 2,
      canChangeDiet: true,
      supplementConsultation: false
    },
    premium: {
      dietsPerMonth: Infinity,
      workoutsPerMonth: 4,
      canChangeDiet: true,
      supplementConsultation: true
    }
  };
  
  return limits[subscription.plan];
}

export function getUsageStatus(user: User) {
  if (!hasActiveSubscription(user)) {
    return {
      dietsUsed: 0,
      workoutsUsed: 0,
      dietsRemaining: 0,
      workoutsRemaining: 0
    };
  }
  
  const subscription = user.subscription!;
  const limits = getSubscriptionLimits(user);
  
  return {
    dietsUsed: subscription.dietsUsedThisMonth,
    workoutsUsed: subscription.workoutsUsedThisMonth,
    dietsRemaining: limits.dietsPerMonth === Infinity 
      ? Infinity 
      : Math.max(0, limits.dietsPerMonth - subscription.dietsUsedThisMonth),
    workoutsRemaining: Math.max(0, limits.workoutsPerMonth - subscription.workoutsUsedThisMonth)
  };
}