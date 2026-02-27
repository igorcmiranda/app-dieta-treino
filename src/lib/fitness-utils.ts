import { UserProfile, FoodEntry, DietPlan, WorkoutPlan } from './types';

// Cálculo da Taxa Metabólica Basal (TMB)
export function calculateTMB(profile: UserProfile): number {
  const { age, gender, height, weight } = profile;
  
  if (gender === 'masculino') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
}

// Cálculo das calorias diárias baseado no nível de atividade
export function calculateDailyCalories(tmb: number, activityLevel: string, goal: string): number {
  const activityMultipliers = {
    'sedentario': 1.2,
    'leve': 1.375,
    'moderado': 1.55,
    'intenso': 1.725,
    'muito-intenso': 1.9
  };
  
  const baseCalories = tmb * activityMultipliers[activityLevel as keyof typeof activityMultipliers];
  
  switch (goal) {
    case 'emagrecer':
      return Math.round(baseCalories * 0.8); // Déficit de 20%
    case 'engordar':
      return Math.round(baseCalories * 1.15); // Superávit de 15%
    case 'manter-peso-perder-gordura':
      return Math.round(baseCalories * 0.95); // Déficit leve de 5%
    default:
      return Math.round(baseCalories);
  }
}

// Cálculo da ingestão de água recomendada
export function calculateWaterIntake(weight: number, activityLevel: string): number {
  let baseWater = weight * 0.035; // 35ml por kg
  
  if (activityLevel === 'intenso' || activityLevel === 'muito-intenso') {
    baseWater += 0.5; // +500ml para atividade intensa
  }
  
  return Math.round(baseWater * 10) / 10; // Arredondar para 1 casa decimal
}

// Geração de plano de dieta com IA
export async function generateDietPlan(
  profile: UserProfile, 
  currentDiet: FoodEntry[]
): Promise<DietPlan> {
  const tmb = calculateTMB(profile);
  const dailyCalories = calculateDailyCalories(tmb, profile.activityLevel, profile.goal);
  const waterIntake = calculateWaterIntake(profile.weight, profile.activityLevel);
  
  // Análise da dieta atual
  const currentDietAnalysis = analyzeFoodEntries(currentDiet);
  
  // Distribuição de macronutrientes baseada no objetivo
  const macros = calculateMacroDistribution(dailyCalories, profile.goal);
  
  // Geração das refeições
  const meals = await generateMeals(dailyCalories, macros, currentDietAnalysis, profile);
  
  return {
    userId: '', // Será preenchido na implementação
    tmb,
    dailyCalories,
    waterIntake,
    meals,
    macros,
    createdAt: new Date()
  };
}

function analyzeFoodEntries(entries: FoodEntry[]) {
  return {
    preferredFoods: entries.map(e => e.food),
    mealTimes: entries.map(e => ({ meal: e.meal, time: e.time })),
    portions: entries.map(e => ({ food: e.food, quantity: e.quantity, measurement: e.measurement }))
  };
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function areFoodsSimilar(foodA: string, foodB: string): boolean {
  const a = normalizeText(foodA);
  const b = normalizeText(foodB);
  return a.includes(b) || b.includes(a);
}

function adjustQuantity(quantity: string, scale: number): string {
  const match = quantity.match(/(\d+([.,]\d+)?)/);
  if (!match) return quantity;

  const raw = match[0].replace(',', '.');
  const numeric = Number(raw);
  if (Number.isNaN(numeric)) return quantity;

  const adjusted = Math.max(1, Math.round(numeric * scale));
  return quantity.replace(match[0], adjusted.toString());
}

function calculateMacroDistribution(calories: number, goal: string) {
  let proteinPercent = 0.25;
  let carbPercent = 0.45;
  let fatPercent = 0.30;
  
  if (goal === 'engordar') {
    proteinPercent = 0.20;
    carbPercent = 0.50;
    fatPercent = 0.30;
  } else if (goal === 'emagrecer') {
    proteinPercent = 0.30;
    carbPercent = 0.35;
    fatPercent = 0.35;
  }
  
  return {
    protein: Math.round((calories * proteinPercent) / 4), // 4 cal/g
    carbs: Math.round((calories * carbPercent) / 4), // 4 cal/g
    fat: Math.round((calories * fatPercent) / 9) // 9 cal/g
  };
}

async function generateMeals(calories: number, macros: any, currentAnalysis: any, profile: UserProfile) {
  // Distribuição calórica por refeição
  const mealDistribution = {
    'Café da Manhã': 0.25,
    'Lanche da Manhã': 0.10,
    'Almoço': 0.30,
    'Lanche da Tarde': 0.10,
    'Jantar': 0.20,
    'Ceia': 0.05
  };
  
  const meals = [];
  
  for (const [mealName, percentage] of Object.entries(mealDistribution)) {
    const mealCalories = Math.round(calories * percentage);
    const meal = {
      meal: mealName,
      time: getMealTime(mealName),
      foods: await generateMealFoods(mealCalories, macros, mealName, profile, currentAnalysis)
    };
    meals.push(meal);
  }
  
  return meals;
}

function getMealTime(mealName: string): string {
  const times = {
    'Café da Manhã': '07:00',
    'Lanche da Manhã': '10:00',
    'Almoço': '12:30',
    'Lanche da Tarde': '15:30',
    'Jantar': '19:00',
    'Ceia': '21:30'
  };
  return times[mealName as keyof typeof times] || '12:00';
}

async function generateMealFoods(
  calories: number,
  macros: any,
  mealName: string,
  profile: UserProfile,
  currentAnalysis: any
) {
  // Base de alimentos por refeição
  const foodDatabase = {
    'Café da Manhã': [
      { food: 'Aveia', calories: 68, protein: 2.4, carbs: 12, fat: 1.4, quantity: '30g' },
      { food: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, quantity: '1 unidade média' },
      { food: 'Leite desnatado', calories: 42, protein: 3.4, carbs: 5, fat: 0.1, quantity: '200ml' },
      { food: 'Ovo', calories: 70, protein: 6, carbs: 0.6, fat: 5, quantity: '1 unidade' },
      { food: 'Pão integral', calories: 69, protein: 3.6, carbs: 11.6, fat: 1.2, quantity: '1 fatia' }
    ],
    'Lanche da Manhã': [
      { food: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, quantity: '1 unidade' },
      { food: 'Maçã', calories: 78, protein: 0.3, carbs: 21, fat: 0.2, quantity: '1 unidade' },
      { food: 'Iogurte natural', calories: 100, protein: 5.7, carbs: 7.8, fat: 5.0, quantity: '170g' },
      { food: 'Castanhas', calories: 87, protein: 2.2, carbs: 3.1, fat: 7.8, quantity: '15g' },
      { food: 'Whey protein', calories: 120, protein: 24, carbs: 3, fat: 2, quantity: '30g' }
    ],
    'Almoço': [
      { food: 'Arroz integral', calories: 111, protein: 2.6, carbs: 22, fat: 0.9, quantity: '100g' },
      { food: 'Feijão', calories: 76, protein: 4.8, carbs: 14, fat: 0.5, quantity: '100g' },
      { food: 'Frango grelhado', calories: 165, protein: 31, carbs: 0, fat: 3.6, quantity: '100g' },
      { food: 'Brócolis', calories: 25, protein: 3, carbs: 5, fat: 0.3, quantity: '100g' },
      { food: 'Salada verde', calories: 15, protein: 1.5, carbs: 3, fat: 0.2, quantity: '100g' }
    ],
    'Lanche da Tarde': [
      { food: 'Iogurte grego', calories: 130, protein: 10, carbs: 9, fat: 6, quantity: '120g' },
      { food: 'Pão integral', calories: 69, protein: 3.6, carbs: 11.6, fat: 1.2, quantity: '1 fatia' },
      { food: 'Queijo branco', calories: 70, protein: 5, carbs: 1, fat: 5, quantity: '40g' },
      { food: 'Fruta da estação', calories: 80, protein: 1, carbs: 20, fat: 0.2, quantity: '1 unidade' },
      { food: 'Pasta de amendoim', calories: 94, protein: 4, carbs: 3, fat: 8, quantity: '15g' }
    ],
    'Jantar': [
      { food: 'Batata doce', calories: 86, protein: 2, carbs: 20, fat: 0.1, quantity: '100g' },
      { food: 'Salmão grelhado', calories: 208, protein: 22, carbs: 0, fat: 12, quantity: '100g' },
      { food: 'Aspargos', calories: 20, protein: 2.2, carbs: 4, fat: 0.1, quantity: '100g' },
      { food: 'Quinoa', calories: 120, protein: 4.4, carbs: 22, fat: 1.9, quantity: '100g' }
    ],
    'Ceia': [
      { food: 'Iogurte natural', calories: 100, protein: 5.7, carbs: 7.8, fat: 5.0, quantity: '170g' },
      { food: 'Queijo cottage', calories: 84, protein: 11, carbs: 3, fat: 2, quantity: '80g' },
      { food: 'Leite desnatado', calories: 42, protein: 3.4, carbs: 5, fat: 0.1, quantity: '200ml' },
      { food: 'Ovo cozido', calories: 70, protein: 6, carbs: 0.6, fat: 5, quantity: '1 unidade' },
      { food: 'Mix de nuts', calories: 90, protein: 2.5, carbs: 3, fat: 8, quantity: '15g' }
    ]
  };
  
  const availableFoods = [...(foodDatabase[mealName as keyof typeof foodDatabase] || foodDatabase['Almoço'])];
  const preferredFoods: string[] = Array.isArray(currentAnalysis?.preferredFoods)
    ? currentAnalysis.preferredFoods
    : [];
  const preferredSet = new Set(preferredFoods.map(normalizeText));

  const isSnackOrSupper = ['Lanche da Manhã', 'Lanche da Tarde', 'Ceia'].includes(mealName);

  // Prioriza alimentos que o usuário já consome e evita padrão "almoço" em lanches/ceia.
  availableFoods.sort((a, b) => {
    const aPreferred = [...preferredSet].some(pref => areFoodsSimilar(a.food, pref)) ? 1 : 0;
    const bPreferred = [...preferredSet].some(pref => areFoodsSimilar(b.food, pref)) ? 1 : 0;
    const aLunchLike = /(arroz|feijao|feijão)/i.test(a.food) ? 1 : 0;
    const bLunchLike = /(arroz|feijao|feijão)/i.test(b.food) ? 1 : 0;

    if (aPreferred !== bPreferred) return bPreferred - aPreferred;
    if (isSnackOrSupper && aLunchLike !== bLunchLike) return aLunchLike - bLunchLike;
    return 0;
  });
  
  // Seleção inteligente de alimentos para atingir as calorias da refeição
  const selectedFoods = [];
  let remainingCalories = calories;
  
  // Seleção com preferência aos alimentos habituais do usuário.
  for (let i = 0; i < Math.min(3, availableFoods.length) && remainingCalories > 50; i++) {
    const food = availableFoods[i];
    if (food.calories <= remainingCalories * 1.2) {
      selectedFoods.push(food);
      remainingCalories -= food.calories;
    }
  }

  // Ajusta porções para aproximar o total calórico da refeição.
  const totalSelectedCalories = selectedFoods.reduce((sum, food) => sum + food.calories, 0);
  if (totalSelectedCalories <= 0) return selectedFoods;

  const scale = Math.min(1.8, Math.max(0.7, calories / totalSelectedCalories));

  return selectedFoods.map(food => ({
    ...food,
    quantity: adjustQuantity(food.quantity, scale),
    calories: Math.round(food.calories * scale),
    protein: Math.round(food.protein * scale * 10) / 10,
    carbs: Math.round(food.carbs * scale * 10) / 10,
    fat: Math.round(food.fat * scale * 10) / 10
  }));
}

// Geração de plano de treino
export async function generateWorkoutPlan(
  profile: UserProfile,
  focusAreas?: string[]
): Promise<WorkoutPlan> {
  const normalizedFocusAreas = Array.isArray(focusAreas)
    ? focusAreas
    : Array.isArray(profile.preferredMuscleGroups)
      ? profile.preferredMuscleGroups
      : [];

  const workouts = [];
  
  // Base de exercícios por grupo muscular
  const exerciseDatabase = {
    'peito': [
      { name: 'Supino reto', sets: 4, reps: '8-12', rest: '90s', alternatives: ['Supino inclinado', 'Flexão de braço'] },
      { name: 'Supino inclinado', sets: 3, reps: '10-12', rest: '90s', alternatives: ['Supino reto', 'Crucifixo'] },
      { name: 'Flexão de braço', sets: 3, reps: '12-15', rest: '60s', alternatives: ['Supino', 'Paralelas'] }
    ],
    'costas': [
      { name: 'Puxada frontal', sets: 4, reps: '8-12', rest: '90s', alternatives: ['Barra fixa', 'Remada curvada'] },
      { name: 'Remada curvada', sets: 4, reps: '8-10', rest: '90s', alternatives: ['Remada sentada', 'Puxada'] },
      { name: 'Remada sentada', sets: 3, reps: '10-12', rest: '90s', alternatives: ['Remada curvada', 'Puxada'] }
    ],
    'pernas': [
      { name: 'Agachamento', sets: 4, reps: '10-15', rest: '120s', alternatives: ['Leg press', 'Agachamento livre'] },
      { name: 'Leg press', sets: 4, reps: '12-15', rest: '90s', alternatives: ['Agachamento', 'Hack squat'] },
      { name: 'Extensão de pernas', sets: 3, reps: '12-15', rest: '60s', alternatives: ['Agachamento', 'Afundo'] }
    ],
    'bracos': [
      { name: 'Rosca direta', sets: 3, reps: '10-12', rest: '60s', alternatives: ['Rosca martelo', 'Rosca concentrada'] },
      { name: 'Tríceps testa', sets: 3, reps: '10-12', rest: '60s', alternatives: ['Tríceps pulley', 'Mergulho'] },
      { name: 'Rosca martelo', sets: 3, reps: '12-15', rest: '60s', alternatives: ['Rosca direta', 'Rosca alternada'] }
    ],
    'ombros': [
      { name: 'Desenvolvimento militar', sets: 4, reps: '8-12', rest: '90s', alternatives: ['Desenvolvimento com halteres', 'Elevação frontal'] },
      { name: 'Elevação lateral', sets: 3, reps: '12-15', rest: '60s', alternatives: ['Elevação frontal', 'Desenvolvimento'] },
      { name: 'Elevação posterior', sets: 3, reps: '12-15', rest: '60s', alternatives: ['Crucifixo inverso', 'Remada alta'] }
    ]
  };
  
  // Divisão de treino baseada no nível de atividade
  const trainingDays = profile.activityLevel === 'sedentario' || profile.activityLevel === 'leve' ? 3 : 5;
  
  if (trainingDays === 3) {
    // Treino ABC
    workouts.push(
      { day: 'Segunda-feira', muscleGroup: 'Peito e Tríceps', exercises: [...exerciseDatabase.peito.slice(0, 2), ...exerciseDatabase.bracos.filter(e => e.name.includes('Tríceps'))] },
      { day: 'Quarta-feira', muscleGroup: 'Costas e Bíceps', exercises: [...exerciseDatabase.costas.slice(0, 2), ...exerciseDatabase.bracos.filter(e => e.name.includes('Rosca'))] },
      { day: 'Sexta-feira', muscleGroup: 'Pernas e Ombros', exercises: [...exerciseDatabase.pernas.slice(0, 2), ...exerciseDatabase.ombros.slice(0, 2)] }
    );
  } else {
    // Treino ABCDE
    workouts.push(
      { day: 'Segunda-feira', muscleGroup: 'Peito', exercises: exerciseDatabase.peito },
      { day: 'Terça-feira', muscleGroup: 'Costas', exercises: exerciseDatabase.costas },
      { day: 'Quarta-feira', muscleGroup: 'Pernas', exercises: exerciseDatabase.pernas },
      { day: 'Quinta-feira', muscleGroup: 'Ombros', exercises: exerciseDatabase.ombros },
      { day: 'Sexta-feira', muscleGroup: 'Braços', exercises: exerciseDatabase.bracos }
    );
  }
  
  // Priorizar grupos musculares preferidos
  if (normalizedFocusAreas.length > 0) {
    workouts.forEach(workout => {
      if (normalizedFocusAreas.some(area => workout.muscleGroup.toLowerCase().includes(area.toLowerCase()))) {
        // Adicionar um exercício extra para grupos prioritários
        const extraExercise = exerciseDatabase[normalizedFocusAreas[0].toLowerCase() as keyof typeof exerciseDatabase]?.[0];
        if (extraExercise && !workout.exercises.find(e => e.name === extraExercise.name)) {
          workout.exercises.push(extraExercise);
        }
      }
    });
  }
  
  return {
    userId: '',
    focusAreas: normalizedFocusAreas,
    workouts,
    createdAt: new Date()
  };
}
