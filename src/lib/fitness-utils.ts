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
      foods: await generateMealFoods(mealCalories, macros, mealName, profile)
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

async function generateMealFoods(calories: number, macros: any, mealName: string, profile: UserProfile) {
  // Base de alimentos por refeição com validação adequada por tipo
  const foodDatabase = {
    'Café da Manhã': [
      { food: 'Aveia', calories: 68, protein: 2.4, carbs: 12, fat: 1.4, quantity: '30g' },
      { food: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, quantity: '1 unidade média' },
      { food: 'Leite desnatado', calories: 42, protein: 3.4, carbs: 5, fat: 0.1, quantity: '200ml' },
      { food: 'Ovo', calories: 70, protein: 6, carbs: 0.6, fat: 5, quantity: '1 unidade' },
      { food: 'Pão integral', calories: 69, protein: 3.6, carbs: 11.6, fat: 1.2, quantity: '1 fatia' },
      { food: 'Iogurte natural', calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, quantity: '100g' },
      { food: 'Granola', calories: 471, protein: 14.8, carbs: 64.7, fat: 18.1, quantity: '30g' }
    ],
    'Lanche da Manhã': [
      { food: 'Maçã', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, quantity: '1 unidade média' },
      { food: 'Castanha do Pará', calories: 656, protein: 14.3, carbs: 4.3, fat: 67.1, quantity: '15g' },
      { food: 'Iogurte natural', calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, quantity: '100g' },
      { food: 'Amendoim', calories: 567, protein: 26.2, carbs: 16.1, fat: 47.9, quantity: '20g' },
      { food: 'Suco natural laranja', calories: 45, protein: 0.7, carbs: 10.4, fat: 0.2, quantity: '200ml' }
    ],
    'Almoço': [
      { food: 'Arroz integral', calories: 111, protein: 2.6, carbs: 22, fat: 0.9, quantity: '100g' },
      { food: 'Feijão', calories: 76, protein: 4.8, carbs: 14, fat: 0.5, quantity: '100g' },
      { food: 'Frango grelhado', calories: 165, protein: 31, carbs: 0, fat: 3.6, quantity: '100g' },
      { food: 'Brócolis', calories: 25, protein: 3, carbs: 5, fat: 0.3, quantity: '100g' },
      { food: 'Salada verde', calories: 15, protein: 1.5, carbs: 3, fat: 0.2, quantity: '100g' },
      { food: 'Carne vermelha magra', calories: 250, protein: 26, carbs: 0, fat: 15, quantity: '100g' },
      { food: 'Peixe grelhado', calories: 96, protein: 20.4, carbs: 0, fat: 1.7, quantity: '100g' }
    ],
    'Lanche da Tarde': [
      { food: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, quantity: '1 unidade média' },
      { food: 'Biscoito integral', calories: 35, protein: 1.2, carbs: 5.8, fat: 1.0, quantity: '2 unidades' },
      { food: 'Chá verde', calories: 2, protein: 0.2, carbs: 0, fat: 0, quantity: '200ml' },
      { food: 'Vitamina de frutas', calories: 120, protein: 4, carbs: 25, fat: 1, quantity: '200ml' },
      { food: 'Torrada integral', calories: 65, protein: 2.4, carbs: 12.2, fat: 1.1, quantity: '2 fatias' },
      { food: 'Queijo cottage', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, quantity: '50g' }
    ],
    'Jantar': [
      { food: 'Batata doce', calories: 86, protein: 2, carbs: 20, fat: 0.1, quantity: '100g' },
      { food: 'Salmão grelhado', calories: 208, protein: 22, carbs: 0, fat: 12, quantity: '100g' },
      { food: 'Aspargos', calories: 20, protein: 2.2, carbs: 4, fat: 0.1, quantity: '100g' },
      { food: 'Quinoa', calories: 120, protein: 4.4, carbs: 22, fat: 1.9, quantity: '100g' },
      { food: 'Peixe grelhado', calories: 96, protein: 20.4, carbs: 0, fat: 1.7, quantity: '100g' },
      { food: 'Legumes refogados', calories: 35, protein: 1.5, carbs: 8, fat: 0.3, quantity: '150g' },
      { food: 'Frango grelhado', calories: 165, protein: 31, carbs: 0, fat: 3.6, quantity: '100g' }
    ],
    'Ceia': [
      { food: 'Iogurte natural', calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, quantity: '100g' },
      { food: 'Chá de camomila', calories: 2, protein: 0, carbs: 0.4, fat: 0, quantity: '200ml' },
      { food: 'Castanha do Pará', calories: 656, protein: 14.3, carbs: 4.3, fat: 67.1, quantity: '10g' },
      { food: 'Leite morno', calories: 42, protein: 3.4, carbs: 5, fat: 0.1, quantity: '150ml' },
      { food: 'Queijo cottage', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, quantity: '50g' }
    ]
  };
  
  // Garantir que cada refeição tenha alimentos apropriados
  const availableFoods = foodDatabase[mealName as keyof typeof foodDatabase];
  if (!availableFoods) {
    throw new Error(`Tipo de refeição não reconhecido: ${mealName}`);
  }
  
  // Seleção inteligente de alimentos para atingir as calorias da refeição
  const selectedFoods = [];
  let remainingCalories = calories;
  
  // Algoritmo simples de seleção
  for (let i = 0; i < Math.min(3, availableFoods.length) && remainingCalories > 50; i++) {
    const food = availableFoods[i];
    if (food.calories <= remainingCalories * 1.2) {
      selectedFoods.push(food);
      remainingCalories -= food.calories;
    }
  }
  
  return selectedFoods;
}

// Geração de plano de treino
export async function generateWorkoutPlan(
  profile: UserProfile,
  focusAreas: string[]
): Promise<WorkoutPlan> {
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
  if (focusAreas.length > 0) {
    workouts.forEach(workout => {
      if (focusAreas.some(area => workout.muscleGroup.toLowerCase().includes(area.toLowerCase()))) {
        // Adicionar um exercício extra para grupos prioritários
        const extraExercise = exerciseDatabase[focusAreas[0].toLowerCase() as keyof typeof exerciseDatabase]?.[0];
        if (extraExercise && !workout.exercises.find(e => e.name === extraExercise.name)) {
          workout.exercises.push(extraExercise);
        }
      }
    });
  }
  
  return {
    userId: '',
    focusAreas,
    workouts,
    createdAt: new Date()
  };
}