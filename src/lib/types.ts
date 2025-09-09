// Tipos para o sistema de dieta e treinos

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  profile?: UserProfile;
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