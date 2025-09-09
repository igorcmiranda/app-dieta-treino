// Sistema de análise de imagens corporais com IA

export interface BodyAnalysisResult {
  proportions: string;
  strengths: string[];
  improvementAreas: string[];
  recommendations: string[];
}

export async function analyzeBodyPhotos(photos: {
  front: string;
  back: string;
  left: string;
  right: string;
}): Promise<BodyAnalysisResult> {
  // Simulação de análise com IA (em produção, seria integrado com OpenAI Vision API)
  
  // Análises baseadas em padrões comuns de composição corporal
  const analyses = [
    {
      proportions: "Estrutura corporal equilibrada com potencial para desenvolvimento muscular. Postura adequada e simetria corporal dentro dos padrões normais.",
      strengths: ["Ombros bem proporcionais", "Core estável", "Postura adequada", "Simetria corporal"],
      improvementAreas: ["Desenvolvimento do peitoral", "Fortalecimento das pernas", "Definição abdominal"],
      recommendations: [
        "Focar em exercícios compostos para peitoral (supino, flexões)",
        "Aumentar volume de treino para pernas (agachamentos, leg press)",
        "Incluir exercícios específicos para core (prancha, abdominais)",
        "Manter consistência na dieta proposta para redução de gordura corporal"
      ]
    },
    {
      proportions: "Boa base muscular com distribuição harmoniosa. Estrutura favorável para ganho de massa magra e definição muscular.",
      strengths: ["Ombros desenvolvidos", "Braços proporcionais", "Boa postura", "Cintura definida"],
      improvementAreas: ["Desenvolvimento das costas", "Fortalecimento das pernas", "Aumento da massa muscular geral"],
      recommendations: [
        "Priorizar exercícios para costas (puxadas, remadas)",
        "Intensificar treino de pernas com exercícios compostos",
        "Aumentar ingestão proteica para ganho de massa muscular",
        "Incluir exercícios funcionais para melhora da força geral"
      ]
    },
    {
      proportions: "Estrutura atlética com bom potencial para recomposição corporal. Distribuição muscular adequada com espaço para otimização.",
      strengths: ["Estrutura atlética", "Boa proporção ombro-cintura", "Postura alinhada", "Simetria bilateral"],
      improvementAreas: ["Definição muscular", "Redução de gordura localizada", "Fortalecimento do core"],
      recommendations: [
        "Combinar treino de força com exercícios cardiovasculares",
        "Focar em exercícios compostos para queima calórica",
        "Manter déficit calórico controlado conforme dieta proposta",
        "Incluir exercícios de alta intensidade (HIIT) 2-3x por semana"
      ]
    }
  ];

  // Selecionar análise aleatória para demonstração
  const selectedAnalysis = analyses[Math.floor(Math.random() * analyses.length)];
  
  // Simular tempo de processamento da IA
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return selectedAnalysis;
}

export function generateWorkoutRecommendations(improvementAreas: string[]): string[] {
  const exerciseMap: { [key: string]: string[] } = {
    'peitoral': [
      'Supino reto com barra',
      'Supino inclinado com halteres',
      'Flexões de braço',
      'Crucifixo com halteres',
      'Paralelas para peitoral'
    ],
    'costas': [
      'Puxada frontal',
      'Remada curvada',
      'Barra fixa',
      'Remada sentada',
      'Pullover'
    ],
    'pernas': [
      'Agachamento livre',
      'Leg press 45°',
      'Afundo com halteres',
      'Extensão de pernas',
      'Flexão de pernas'
    ],
    'core': [
      'Prancha frontal',
      'Prancha lateral',
      'Abdominal supra',
      'Russian twist',
      'Mountain climbers'
    ],
    'braços': [
      'Rosca direta',
      'Tríceps testa',
      'Rosca martelo',
      'Tríceps pulley',
      'Rosca concentrada'
    ],
    'ombros': [
      'Desenvolvimento militar',
      'Elevação lateral',
      'Elevação frontal',
      'Elevação posterior',
      'Remada alta'
    ]
  };

  const recommendations: string[] = [];
  
  improvementAreas.forEach(area => {
    const areaKey = area.toLowerCase();
    Object.keys(exerciseMap).forEach(muscle => {
      if (areaKey.includes(muscle)) {
        recommendations.push(...exerciseMap[muscle].slice(0, 3));
      }
    });
  });

  return [...new Set(recommendations)]; // Remove duplicatas
}

export function calculateBodyMetrics(profile: { height: number; weight: number; age: number; gender: string }) {
  const { height, weight, age, gender } = profile;
  
  // IMC
  const bmi = weight / Math.pow(height / 100, 2);
  
  // Taxa Metabólica Basal (TMB)
  let bmr;
  if (gender === 'masculino') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
  
  // Peso ideal (fórmula de Robinson)
  let idealWeight;
  if (gender === 'masculino') {
    idealWeight = 52 + (1.9 * ((height - 152.4) / 2.54));
  } else {
    idealWeight = 49 + (1.7 * ((height - 152.4) / 2.54));
  }
  
  return {
    bmi: Math.round(bmi * 10) / 10,
    bmr: Math.round(bmr),
    idealWeight: Math.round(idealWeight * 10) / 10,
    bmiCategory: getBMICategory(bmi)
  };
}

function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Abaixo do peso';
  if (bmi < 25) return 'Peso normal';
  if (bmi < 30) return 'Sobrepeso';
  return 'Obesidade';
}