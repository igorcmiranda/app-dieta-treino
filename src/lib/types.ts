// Tipos para o sistema de dieta e treinos

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  cpf?: string;
  isAdmin: boolean;
  profile?: UserProfile;
  subscription?: UserSubscription;
  billing?: UserBilling; // SECURE BILLING DATA
  emailVerified: boolean;
  createdAt: Date;
}

export interface UserProfile {
  age: number;
  gender: 'masculino' | 'feminino';
  height: number; // em cm
  weight: number; // em kg
  activityLevel: 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'muito-intenso';
  goal: 'engordar' | 'emagrecer' | 'manter-peso-perder-gordura';
  preferredMuscleGroups: string[];
  // Novas preferências alimentares
  foodRestrictions: string[]; // Alimentos que não come
  foodPreferences: string[]; // Alimentos que gosta de comer
  profilePhoto?: string; // Foto de perfil em base64
}

export interface UserSubscription {
  plan: 'starter' | 'standard' | 'premium';
  status: 'active' | 'inactive' | 'cancelled';
  startDate: Date;
  endDate: Date;
  canDowngrade: boolean;
  downgradableDate?: Date; // Data quando pode fazer downgrade
  dietsUsedThisMonth: number;
  workoutsUsedThisMonth: number;
  bodyAnalysesUsedThisMonth: number; // Nova: tracking de análises corporais
  monthlyResetDate: Date; // Nova: data do próximo reset mensal
}

export interface SubscriptionPlan {
  id: 'starter' | 'standard' | 'premium';
  name: string;
  price: number;
  features: {
    dietsPerMonth: number | 'unlimited';
    workoutsPerMonth: number;
    canChangeDiet: boolean;
    supplementConsultation: boolean;
    minimumMonths?: number;
  };
  description: string[];
}

export interface FoodEntry {
  food: string;
  quantity: string;
  measurement: 'colher-sopa' | 'colher-cha' | 'xicara' | 'gramas' | 'ml' | 'unidade';
  time?: string; // opcional para compatibilidade
  meal?: 'cafe-manha' | 'lanche-manha' | 'almoco' | 'lanche-tarde' | 'jantar' | 'ceia'; // opcional para compatibilidade
}

// NOVO: Interface para refeições completas
export interface MealEntry {
  name: string; // Ex: "Café da manhã", "Lanche da tarde"
  time: string; // Ex: "07:00"
  foods: FoodEntry[]; // Lista de alimentos desta refeição
}

export interface DietPlan {
  userId: string;
  tmb: number;
  dailyCalories: number;
  waterIntake: number; // em litros
  meals: {
    meal: string;
    time: string;
    foods: {
      food: string;
      quantity: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }[];
  }[];
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt: Date;
}

export interface WorkoutPlan {
  userId: string;
  focusAreas: string[];
  workouts: {
    day: string;
    muscleGroup: string;
    exercises: {
      name: string;
      sets: number;
      reps: string;
      rest: string;
      alternatives?: string[];
      videoUrl?: string;
      instructions?: string;
    }[];
  }[];
  createdAt: Date;
}

export interface WorkoutProgress {
  userId: string;
  workoutDay: string;
  date: string;
  exercises: {
    exerciseName: string;
    sets: {
      weight: number;
      reps: number;
      completed: boolean;
    }[];
  }[];
  createdAt: Date;
}

export interface BodyAnalysis {
  userId: string;
  photos: {
    front: string;
    back: string;
    left: string;
    right: string;
  };
  analysis: {
    proportions: string;
    strengths: string[];
    improvementAreas: string[];
    recommendations: string[];
  };
  createdAt: Date;
}

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// SECURE BILLING INTERFACE - PCI COMPLIANCE & LGPD COMPLIANT
export interface UserBilling {
  // Dados pessoais (não sensíveis)
  fullName: string;
  email: string;
  
  // Endereço
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string; // UF
  zipCode: string; // CEP
  
  // CPF mascarado apenas (NUNCA armazenar CPF completo)
  maskedCpf?: string; // formato: ***.***.***-**
  
  // Cartão mascarado apenas (NUNCA armazenar PAN/CVV)
  cardBrand?: string; // visa, mastercard, etc.
  cardLast4?: string; // apenas últimos 4 dígitos
  cardExpMonth?: string;
  cardExpYear?: string;
  cardHolderName?: string;
  
  // Controle
  demoMode: boolean;
  updatedAt: Date;
}

export interface PaymentData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
  cpf: string;
  plan: 'starter' | 'standard' | 'premium';
}

// Password Reset System - SECURE TOKENS
export interface PasswordResetToken {
  email: string;
  token: string;
  expires: Date;
  createdAt: Date;
  used: boolean;
}

export interface PasswordResetRequest {
  email: string;
  timestamp: Date;
}

// Rate limiting for password reset attempts
export interface ResetAttempt {
  email: string;
  attempts: number;
  lastAttempt: Date;
  blockedUntil?: Date;
}

// ADMIN SYSTEM - Activity Logging
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string; // Ex: "LOGIN", "LOGOUT", "GENERATE_DIET", "BODY_ANALYSIS", etc.
  details: string; // Descrição detalhada da ação
  metadata?: any; // Dados extras quando relevante
  timestamp: Date;
  status: 'success' | 'error' | 'warning';
  ip?: string; // Para auditoria de segurança
}

// IUGU INTEGRATION TYPES - Payment System
export interface IuguCustomer {
  id: string;
  email: string;
  name: string;
  cpf_cnpj?: string;
  phone?: string;
  phone_prefix?: string;
  created_at: string;
  updated_at: string;
}

export interface IuguPlan {
  id: string;
  name: string;
  identifier: string;
  interval: number;
  interval_type: 'weeks' | 'months';
  value_cents: number;
  payable_with: ('credit_card' | 'bank_slip' | 'pix')[];
  features?: { name: string; value: string }[];
  created_at: string;
  updated_at: string;
}

export interface IuguPaymentMethod {
  id: string;
  customer_id: string;
  description: string;
  item_type: 'credit_card' | 'bank' | 'pix';
  data: {
    brand?: string;
    holder_name?: string;
    display_number?: string;
    month?: string;
    year?: string;
  };
  is_default: boolean;
  created_at: string;
}

export interface IuguSubscription {
  id: string;
  customer_id: string;
  plan_identifier: string;
  price_cents: number;
  currency: string;
  status: 'active' | 'suspended' | 'expired' | 'canceled';
  active: boolean;
  expires_at?: string;
  suspended: boolean;
  only_charge_on_success: boolean;
  payment_method?: IuguPaymentMethod;
  custom_variables?: { name: string; value: string }[];
  credits: number;
  credits_based: boolean;
  created_at: string;
  updated_at: string;
}

export interface IuguInvoice {
  id: string;
  customer_id: string;
  subscription_id?: string;
  total: string;
  total_cents: number;
  status: 'draft' | 'pending' | 'paid' | 'canceled' | 'refunded' | 'expired';
  secure_id: string;
  secure_url: string;
  notification_url?: string;
  items: {
    description: string;
    quantity: number;
    price_cents: number;
  }[];
  payer: {
    name: string;
    email: string;
    cpf_cnpj?: string;
    phone?: string;
  };
  due_date: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  custom_variables?: { name: string; value: string }[];
}

export interface IuguWebhookEvent {
  event: 
    | 'invoice.created'
    | 'invoice.status_changed'
    | 'subscription.created'
    | 'subscription.suspended'
    | 'subscription.activated'
    | 'subscription.expired'
    | 'payment_method.created';
  data: IuguInvoice | IuguSubscription | IuguPaymentMethod;
  id: string;
  created_at: string;
}

export interface IuguPaymentRequest {
  planIdentifier: 'fitai_starter_monthly' | 'fitai_standard_monthly' | 'fitai_premium_monthly';
  planName: string;
  planPrice: number; // em centavos
  userId: string;
  userEmail: string;
  userName: string;
  userCPF?: string;
  userPhone?: string;
}

export interface IuguCheckoutData {
  customerId: string;
  subscriptionId: string;
  planIdentifier: string;
  status: 'pending' | 'active' | 'failed';
  createdAt: Date;
}

// Enhanced UserSubscription para integração com Iugu
export interface EnhancedUserSubscription extends UserSubscription {
  // Dados da integração Iugu
  iugu?: {
    customerId: string;
    subscriptionId: string;
    paymentMethodId?: string;
    lastInvoiceId?: string;
    lastInvoiceStatus?: string;
    nextChargeDate?: Date;
  };
}