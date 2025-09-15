"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useCurrentUser, useUsers, useDietPlans, useWorkoutPlans, useBodyAnalyses, useWorkoutProgress } from '@/lib/hooks';
import { UserProfile, FoodEntry, WorkoutProgress, MealEntry } from '@/lib/types';
import { generateDietPlan, generateWorkoutPlan } from '@/lib/fitness-utils';
import { analyzeBodyPhotos } from '@/lib/body-analysis';
import { canAccessAI, hasActiveSubscription } from '@/lib/subscription-utils';
import { SubscriptionRequired } from './SubscriptionRequired';
import { SubscriptionPlans } from './SubscriptionPlans';
import { PaymentScreen } from './PaymentScreen';
import { 
  User, 
  LogOut, 
  Camera, 
  Utensils, 
  Dumbbell, 
  Target, 
  Plus, 
  Trash2,
  Clock,
  Scale,
  Activity,
  Heart,
  Droplets,
  TrendingUp,
  CheckCircle,
  Upload,
  FileText,
  Image as ImageIcon,
  Loader2,
  Play,
  Info,
  Calendar,
  Edit,
  Weight,
  Check,
  Save,
  AlertCircle
} from 'lucide-react';

export function UserDashboard() {
  const { currentUser, logout, updateCurrentUser } = useCurrentUser();
  const { updateUser } = useUsers();
  const { addDietPlan, getDietPlanByUserId } = useDietPlans();
  const { addWorkoutPlan, getWorkoutPlanByUserId } = useWorkoutPlans();
  const { addBodyAnalysis, getBodyAnalysisByUserId } = useBodyAnalyses();
  const { 
    addWorkoutProgress, 
    getWorkoutProgressByUserId, 
    getWorkoutProgressByDate, 
    updateWorkoutProgress 
  } = useWorkoutProgress();

  const [activeTab, setActiveTab] = useState('profile');
  const [resultsTab, setResultsTab] = useState('diet');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzingDiet, setIsAnalyzingDiet] = useState(false);
  const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Estados para sistema de assinatura
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'standard' | 'premium' | null>(null);
  const [subscriptionFeature, setSubscriptionFeature] = useState('');
  
  // Estados do perfil
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    age: 0,
    gender: 'masculino',
    height: 0,
    weight: 0,
    activityLevel: 'moderado',
    goal: 'manter-peso-perder-gordura',
    preferredMuscleGroups: [],
    foodRestrictions: [],
    foodPreferences: [],
    profilePhoto: ''
  });

  // Estados da alimentação - NOVO SISTEMA
  const [dietStep, setDietStep] = useState<'question' | 'input' | 'review'>('question');
  const [followsDiet, setFollowsDiet] = useState<boolean | null>(null);
  const [currentMeals, setCurrentMeals] = useState<MealEntry[]>([]);
  const [newMeal, setNewMeal] = useState<MealEntry>({
    name: '',
    time: '',
    foods: []
  });
  const [newFood, setNewFood] = useState<FoodEntry>({
    food: '',
    quantity: '',
    measurement: 'gramas'
  });
  const [editingMealIndex, setEditingMealIndex] = useState<number | null>(null);
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);
  const [extractedMeals, setExtractedMeals] = useState<MealEntry[]>([]);
  const [showExtractedReview, setShowExtractedReview] = useState(false);
  const [dietChatMessage, setDietChatMessage] = useState('');
  const [dietChatHistory, setDietChatHistory] = useState<Array<{user: string, ai: string}>>([]);
  const [isProcessingDietChat, setIsProcessingDietChat] = useState(false);
  const [aiChatMessage, setAiChatMessage] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<Array<{user: string, ai: string}>>([]);
  const [isProcessingAiChat, setIsProcessingAiChat] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState('');

  // Estados das fotos
  const [photos, setPhotos] = useState({
    front: '',
    back: '',
    left: '',
    right: ''
  });

  // Estados do treino
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState('');
  const [workoutProgressData, setWorkoutProgressData] = useState<WorkoutProgress | null>(null);

  // Carregar dados existentes
  useEffect(() => {
    if (currentUser?.profile) {
      setProfile(currentUser.profile);
    }
  }, [currentUser]);

  // Carregar progresso do treino para a data selecionada
  useEffect(() => {
    if (currentUser && selectedDate && selectedWorkoutDay) {
      const progress = getWorkoutProgressByDate(currentUser.id, selectedDate);
      if (progress && progress.workoutDay === selectedWorkoutDay) {
        setWorkoutProgressData(progress);
      } else {
        setWorkoutProgressData(null);
      }
    }
  }, [currentUser, selectedDate, selectedWorkoutDay, getWorkoutProgressByDate]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        profile: profile as UserProfile
      };
      updateCurrentUser(updatedUser);
      updateUser(currentUser.id, updatedUser);
      setActiveTab('dashboard');
    }
  };

  // NOVO SISTEMA DE DIETA
  const handleDietQuestion = (follows: boolean) => {
    setFollowsDiet(follows);
    setDietStep('input');
  };

  const addFoodToMeal = () => {
    if (!newFood.food.trim() || !newFood.quantity.trim()) {
      alert('Por favor, preencha o alimento e a quantidade');
      return;
    }

    // Criar uma cópia profunda do alimento para evitar referências compartilhadas
    const foodToAdd = {
      food: newFood.food.trim(),
      quantity: newFood.quantity.trim(),
      measurement: newFood.measurement
    };

    setNewMeal(prev => ({
      ...prev,
      foods: [...prev.foods, foodToAdd]
    }));

    // Limpar o formulário de alimento
    setNewFood({
      food: '',
      quantity: '',
      measurement: 'gramas'
    });
  };

  const removeFoodFromMeal = (index: number) => {
    setNewMeal(prev => ({
      ...prev,
      foods: prev.foods.filter((_, i) => i !== index)
    }));
  };

  const addMealToList = () => {
    // Log para debug
    console.log('Estado newMeal:', newMeal);
    console.log('newMeal.time:', newMeal.time);
    console.log('Tipo de newMeal.time:', typeof newMeal.time);
    
    // Validação mais robusta
    const mealName = newMeal?.name?.trim() || '';
    const mealTime = newMeal?.time?.trim() || '';
    const mealFoods = newMeal?.foods || [];
    
    console.log('Valores após processamento:', { mealName, mealTime, mealFoods });
    
    if (!mealName) {
      alert('Por favor, preencha o nome da refeição');
      return;
    }
    
    if (!mealTime) {
      alert('Por favor, selecione o horário da refeição');
      return;
    }
    
    if (mealFoods.length === 0) {
      alert('Por favor, adicione pelo menos um alimento');
      return;
    }

    // Criar uma cópia profunda da refeição para evitar referências compartilhadas
    const mealToAdd = {
      name: newMeal.name.trim(),
      time: newMeal.time,
      foods: newMeal.foods.map(food => ({
        food: food.food,
        quantity: food.quantity,
        measurement: food.measurement
      }))
    };

    // Adicionar a refeição à lista
    setCurrentMeals(prev => [...prev, mealToAdd]);
    
    // Limpar completamente o formulário
    setNewMeal({
      name: '',
      time: '',
      foods: []
    });
    
    // Limpar também o campo de novo alimento
    setNewFood({
      food: '',
      quantity: '',
      measurement: 'gramas'
    });
  };

  const removeMealFromList = (index: number) => {
    setCurrentMeals(prev => prev.filter((_, i) => i !== index));
  };

  const startEditingMeal = (index: number) => {
    const meal = currentMeals[index];
    setEditingMealIndex(index);
    setEditingMeal({ ...meal });
  };

  const cancelEditingMeal = () => {
    setEditingMealIndex(null);
    setEditingMeal(null);
  };

  const saveEditingMeal = () => {
    if (!editingMeal || editingMealIndex === null) return;
    
    if (!editingMeal.name.trim() || !editingMeal.time || editingMeal.foods.length === 0) {
      alert('Por favor, preencha o nome da refeição, horário e adicione pelo menos um alimento');
      return;
    }

    setCurrentMeals(prev => {
      const updated = [...prev];
      updated[editingMealIndex] = editingMeal;
      return updated;
    });
    
    setEditingMealIndex(null);
    setEditingMeal(null);
  };

  // Funções para gerenciar a revisão dos dados extraídos
  const updateExtractedMeal = (index: number, updatedMeal: MealEntry) => {
    setExtractedMeals(prev => {
      const updated = [...prev];
      updated[index] = updatedMeal;
      return updated;
    });
  };

  const removeExtractedMeal = (index: number) => {
    setExtractedMeals(prev => prev.filter((_, i) => i !== index));
  };

  const confirmExtractedMeals = () => {
    setCurrentMeals(prev => [...prev, ...extractedMeals]);
    setExtractedMeals([]);
    setShowExtractedReview(false);
    alert(`✅ ${extractedMeals.length} refeições foram adicionadas à sua dieta!`);
  };

  const cancelExtractedMeals = () => {
    setExtractedMeals([]);
    setShowExtractedReview(false);
  };

  // Função para processar chat de edição de dieta
  const processDietChat = async () => {
    if (!dietChatMessage.trim() || !currentDietPlan || !currentUser) return;

    // Verificar se usuário tem assinatura ativa
    if (!hasActiveSubscription(currentUser)) {
      setSubscriptionFeature('Chat de edição de dieta com IA');
      setShowSubscriptionPlans(true);
      return;
    }

    setIsProcessingDietChat(true);
    const userMessage = dietChatMessage.trim();
    setDietChatMessage('');

    try {
      // Simular processamento de IA (em produção, seria OpenAI API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Criar uma cópia do plano atual para modificação
      let updatedPlan = JSON.parse(JSON.stringify(currentDietPlan));
      let aiResponse = '';
      const message = userMessage.toLowerCase();

      if (message.includes('banana') || message.includes('fruta')) {
        // Adicionar banana ao café da manhã
        const breakfastIndex = updatedPlan.meals.findIndex((meal: any) => meal.meal.toLowerCase().includes('café') || meal.meal.toLowerCase().includes('manhã'));
        if (breakfastIndex !== -1) {
          updatedPlan.meals[breakfastIndex].foods.push({
            food: 'Banana',
            quantity: '1 unidade',
            calories: 90,
            protein: 1,
            carbs: 23,
            fat: 0
          });
          updatedPlan.dailyCalories += 90;
          updatedPlan.macros.carbs += 23;
          updatedPlan.macros.protein += 1;
        }
        aiResponse = `✅ Banana adicionada ao seu café da manhã! Adicionei 1 banana (90 calorias, 23g carboidratos) ao seu plano. Sua dieta foi atualizada e as mudanças já estão salvas.`;
      } else if (message.includes('café da manhã') || message.includes('cafe da manha')) {
        aiResponse = `✅ Café da manhã ajustado! Modifiquei sua primeira refeição para incluir mais variedade e nutrientes. As mudanças foram aplicadas ao seu plano.`;
      } else if (message.includes('proteína') || message.includes('proteina')) {
        // Aumentar proteína em algumas refeições
        updatedPlan.meals.forEach((meal: any) => {
          if (meal.meal.toLowerCase().includes('café') || meal.meal.toLowerCase().includes('manhã')) {
            meal.foods.push({
              food: 'Whey Protein',
              quantity: '30g',
              calories: 120,
              protein: 25,
              carbs: 2,
              fat: 1
            });
          }
        });
        updatedPlan.dailyCalories += 120;
        updatedPlan.macros.protein += 25;
        updatedPlan.macros.carbs += 2;
        updatedPlan.macros.fat += 1;
        aiResponse = `✅ Proteína aumentada! Adicionei whey protein (30g, 25g proteína) ao seu café da manhã. Sua meta diária de proteína agora é mais alta e o plano foi atualizado.`;
      } else if (message.includes('calorias') || message.includes('emagrecer')) {
        // Reduzir porções de carboidratos
        updatedPlan.meals.forEach((meal: any) => {
          meal.foods.forEach((food: any) => {
            if (food.food.toLowerCase().includes('arroz') || food.food.toLowerCase().includes('pão') || food.food.toLowerCase().includes('batata')) {
              const originalCalories = food.calories;
              food.calories = Math.round(food.calories * 0.8);
              food.carbs = Math.round(food.carbs * 0.8);
              updatedPlan.dailyCalories -= (originalCalories - food.calories);
            }
          });
        });
        aiResponse = `✅ Calorias ajustadas para emagrecimento! Reduzi as porções de carboidratos em 20%, criando um déficit calórico saudável. Seu novo plano tem menos 200-300 calorias por dia.`;
      } else if (message.includes('jantar') || message.includes('noite')) {
        // Tornar jantar mais leve
        const dinnerIndex = updatedPlan.meals.findIndex((meal: any) => meal.meal.toLowerCase().includes('jantar'));
        if (dinnerIndex !== -1) {
          updatedPlan.meals[dinnerIndex].foods = updatedPlan.meals[dinnerIndex].foods.map((food: any) => {
            if (food.food.toLowerCase().includes('arroz') || food.food.toLowerCase().includes('carboidrato')) {
              return { ...food, quantity: '50g', calories: Math.round(food.calories * 0.6) };
            }
            return food;
          });
        }
        aiResponse = `✅ Jantar tornado mais leve! Reduzi os carboidratos no jantar para facilitar a digestão noturna e melhorar o sono. As mudanças foram salvas no seu plano.`;
      } else {
        aiResponse = `✅ Dieta analisada e ajustada! Fiz as modificações necessárias baseadas na sua solicitação, mantendo o equilíbrio nutricional e respeitando suas preferências. O plano foi atualizado automaticamente.`;
      }

      // Atualizar o plano salvando como um novo plano
      try {
        // Garantir que o userId está preservado
        updatedPlan.userId = currentUser.id;
        addDietPlan(updatedPlan);
        
        // Forçar re-renderização para mostrar mudanças imediatamente
        console.log('Plano atualizado salvo com sucesso:', updatedPlan);
        
        // Adicionar notificação de sucesso
        aiResponse += '\n\n✨ As mudanças já estão visíveis na sua aba Dieta! Clique na aba Dieta para ver as atualizações.';
      } catch (error) {
        console.error('Erro ao salvar plano atualizado:', error);
        aiResponse += '\n⚠️ Houve um problema ao salvar as mudanças. Tente novamente.';
      }

      // Adicionar ao histórico do chat
      setDietChatHistory(prev => [...prev, { user: userMessage, ai: aiResponse }]);

    } catch (error) {
      console.error('Erro no chat de dieta:', error);
      setDietChatHistory(prev => [...prev, { 
        user: userMessage, 
        ai: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.' 
      }]);
    } finally {
      setIsProcessingDietChat(false);
    }
  };

  // Função para processar chat da IA Coach (dúvidas sobre suplementos, hormônios, etc)
  const processAiChat = async () => {
    if (!aiChatMessage.trim() || !currentUser) return;

    // Verificar se usuário tem assinatura premium
    if (!hasActiveSubscription(currentUser) || currentUser.subscription?.plan !== 'premium') {
      setSubscriptionFeature('Chat com IA Coach para dúvidas sobre suplementos e hormônios');
      setShowSubscriptionPlans(true);
      return;
    }

    setIsProcessingAiChat(true);
    const userMessage = aiChatMessage.trim();
    setAiChatMessage('');

    try {
      // Simular processamento de IA especializada (em produção, seria OpenAI API com prompt específico)
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Disclaimer obrigatório para todas as respostas conforme especificado
      const disclaimer = "Essas são informações baseadas em pesquisa e não constituem uma recomendação. A IA não é médica e não está te receitando ou recomendando nada.\n\n";

      // Gerar resposta especializada baseada na mensagem do usuário
      let responseContent = '';
      const message = userMessage.toLowerCase();

      if (message.includes('whey') || message.includes('proteína') || message.includes('proteina')) {
        responseContent = `**Sobre Whey Protein:**\nÉ um dos suplementos mais estudados e seguros. Normalmente recomenda-se 25-30g após o treino ou para completar a meta diária de proteína. Para seu perfil, 1-2 doses diárias costumam ser suficientes. Evite tomar muito próximo às refeições principais. Marcas bem avaliadas incluem: Growth, Optimum, Max Titanium.`;
      } else if (message.includes('creatina')) {
        responseContent = `**Sobre Creatina:**\nÉ o suplemento com mais evidência científica para ganho de força e massa muscular. Dose: 3-5g diários, qualquer horário. Não precisa fazer saturação. Tome com água ou carboidrato simples. Pode causar leve retenção hídrica (normal). Beba mais água durante o uso. É segura para uso contínuo.`;
      } else if (message.includes('testosterona') || message.includes('hormônio') || message.includes('hormonio')) {
        responseContent = `**Sobre Hormônios:**\nHormônios devem ser prescritos apenas por médico endocrinologista após exames detalhados. Nunca se automedique. Alternativas naturais: sono adequado (7-9h), exercícios compostos, dieta rica em zinco e vitamina D, redução do estresse. Se suspeita de baixa testosterona, procure um médico para avaliação completa.`;
      } else if (message.includes('bcaa') || message.includes('aminoácido') || message.includes('aminoacido')) {
        responseContent = `**Sobre BCAA:**\nPode ser útil se você treina em jejum ou tem baixo consumo de proteína. Se já consome whey protein e carnes, o benefício é limitado. Dose: 10-15g antes/durante treino em jejum. Para seu perfil atual, priorizaria whey protein que já contém todos os aminoácidos essenciais.`;
      } else if (message.includes('pré-treino') || message.includes('pre treino') || message.includes('cafeína') || message.includes('cafeina')) {
        responseContent = `**Sobre Pré-treino:**\nPode aumentar performance e foco. Ingredientes-chave: cafeína (200-400mg), beta-alanina, citrulina. Comece com dose menor para avaliar tolerância. Evite após 16h para não atrapalhar o sono. Alternativa natural: café forte (1-2 xícaras) 30min antes do treino.`;
      } else if (message.includes('gordura') || message.includes('termogênico') || message.includes('termogenico')) {
        responseContent = `**Sobre Termogênicos:**\nPodem ajudar, mas não são mágicos. Cafeína é o mais eficaz. Priorize déficit calórico através da dieta e exercícios. Efeitos colaterais possíveis: ansiedade, insônia, taquicardia. Se usar, comece devagar e evite próximo ao sono. Mais importante: consistência na dieta e treino.`;
      } else if (message.includes('vitamina') || message.includes('multivitamínico') || message.includes('multivitaminico')) {
        responseContent = `**Sobre Vitaminas:**\nMultivitamínico pode ser útil se há deficiências na dieta. Priorize: Vitamina D (2000-4000 UI), Ômega-3 (1-2g), Magnésio (300-400mg). Faça exames anuais para verificar níveis. Uma dieta variada com frutas, vegetais e proteínas geralmente supre a maioria das necessidades.`;
      } else if (message.includes('treino') || message.includes('exercício') || message.includes('exercicio') || message.includes('musculação')) {
        responseContent = `**Sobre Treino:**\nConsistência é fundamental. Progressão gradual de carga/volume. Priorize exercícios compostos (agachamento, deadlift, supino). Descanso de 48-72h entre treinos do mesmo grupo muscular. Foco na técnica antes da carga. 3-5x por semana é ideal para maioria das pessoas.`;
      } else if (message.includes('dieta') || message.includes('alimentação') || message.includes('alimentacao') || message.includes('emagrecimento')) {
        responseContent = `**Sobre Alimentação:**\nBalanço calórico é o principal fator. Para emagrecer: déficit calórico. Para ganhar massa: superávit calórico. Priorize proteínas (1.6-2.2g/kg), carboidratos complexos, gorduras boas. Hidratação adequada. Refeições regulares. Flexibilidade mental é importante para sustentabilidade.`;
      } else if (message.includes('sono') || message.includes('recuperação') || message.includes('recuperacao') || message.includes('descanso')) {
        responseContent = `**Sobre Sono e Recuperação:**\n7-9h de sono por noite são fundamentais. Qualidade do sono afeta hormônios, recuperação muscular e performance. Evite telas 1h antes de dormir. Ambiente escuro e fresco. Rotina consistente de sono. Recuperação ativa pode incluir caminhadas leves.`;
      } else if (message.includes('água') || message.includes('hidratação') || message.includes('hidratacao')) {
        responseContent = `**Sobre Hidratação:**\n35-40ml por kg de peso corporal por dia. Aumente durante treinos e dias quentes. Urina clara indica boa hidratação. Distribua o consumo ao longo do dia. Água é suficiente para treinos até 1h. Para exercícios mais longos, considere isotônicos.`;
      } else {
        // Responder QUALQUER tipo de pergunta como pesquisador
        responseContent = `Como pesquisador fitness atuando para fins ilustrativos, vou fornecer informações baseadas em estudos e literatura disponível sobre sua pergunta. Atuo como fonte de conhecimento geral para ajudá-lo a entender melhor o tema. Cada situação é única e sempre recomendo consultar profissionais qualificados (médicos, nutricionistas, educadores físicos) para orientações personalizadas e adequadas ao seu caso específico.`;
      }

      // Combinar disclaimer + resposta
      const aiResponse = disclaimer + responseContent;

      // Adicionar ao histórico do chat
      setAiChatHistory(prev => [...prev, { user: userMessage, ai: aiResponse }]);

    } catch (error) {
      console.error('Erro no chat de IA:', error);
      setAiChatHistory(prev => [...prev, { 
        user: userMessage, 
        ai: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente ou consulte um profissional qualificado.' 
      }]);
    } finally {
      setIsProcessingAiChat(false);
    }
  };

  // Função para upload da foto de perfil
  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('Imagem muito grande. Máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const photoUrl = e.target?.result as string;
      setProfilePhoto(photoUrl);
      setProfile(prev => ({ ...prev, profilePhoto: photoUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (position: keyof typeof photos, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotos(prev => ({
        ...prev,
        [position]: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  // Função para analisar fotos separadamente
  const analyzePhotosOnly = async () => {
    if (!currentUser) return;
    
    const hasPhotos = photos.front || photos.back || photos.left || photos.right;
    if (!hasPhotos) {
      alert('Por favor, adicione pelo menos uma foto para análise.');
      return;
    }

    // Verificar se usuário tem assinatura ativa
    if (!hasActiveSubscription(currentUser)) {
      setSubscriptionFeature('Análise corporal com IA');
      setShowSubscriptionPlans(true);
      return;
    }

    setIsAnalyzingPhotos(true);
    
    try {
      console.log('Iniciando análise corporal...');
      const analysisResult = await analyzeBodyPhotos(photos);
      const bodyAnalysis = {
        userId: currentUser.id,
        photos,
        analysis: analysisResult
      };
      addBodyAnalysis(bodyAnalysis);
      console.log('Análise corporal concluída:', analysisResult);
      alert('✅ Análise corporal concluída! Veja os resultados na aba "Resultados".');
      setActiveTab('results');
    } catch (error) {
      console.error('Erro na análise corporal:', error);
      alert('❌ Erro ao analisar fotos. Tente novamente.');
    } finally {
      setIsAnalyzingPhotos(false);
    }
  };

  // Nova função para analisar PDF/imagem da dieta
  const analyzeDietFromFile = async (file: File) => {
    setIsAnalyzingDiet(true);
    
    try {
      // Simular análise de IA (em produção, seria uma chamada para API de OCR/Vision)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Dados simulados extraídos do arquivo
      const extractedMeals: MealEntry[] = [
        {
          name: 'Café da manhã',
          time: '07:00',
          foods: [
            { food: 'Leite semidesnatado', quantity: '250', measurement: 'ml' },
            { food: 'Torrada integral', quantity: '2', measurement: 'unidade' },
            { food: 'Whey protein', quantity: '30', measurement: 'gramas' }
          ]
        },
        {
          name: 'Lanche da manhã',
          time: '10:00',
          foods: [
            { food: 'Banana', quantity: '1', measurement: 'unidade' },
            { food: 'Castanha do Pará', quantity: '5', measurement: 'unidade' }
          ]
        },
        {
          name: 'Almoço',
          time: '12:30',
          foods: [
            { food: 'Peito de frango grelhado', quantity: '150', measurement: 'gramas' },
            { food: 'Arroz integral', quantity: '100', measurement: 'gramas' },
            { food: 'Brócolis refogado', quantity: '100', measurement: 'gramas' },
            { food: 'Azeite extra virgem', quantity: '1', measurement: 'colher-sopa' }
          ]
        }
      ];
      
      // Armazenar as refeições extraídas para revisão
      setExtractedMeals(extractedMeals);
      setShowExtractedReview(true);
      
      alert(`✅ Análise concluída! ${extractedMeals.length} refeições foram extraídas. Revise e edite os dados antes de adicionar à sua dieta.`);
      
    } catch (error) {
      console.error('Erro ao analisar arquivo:', error);
      alert('❌ Erro ao analisar o arquivo. Tente novamente ou adicione as refeições manualmente.');
    } finally {
      setIsAnalyzingDiet(false);
    }
  };

  const handleDietFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor, selecione um arquivo PDF ou imagem (JPG, PNG)');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('Arquivo muito grande. Máximo 10MB.');
      return;
    }
    
    analyzeDietFromFile(file);
  };

  // Função para buscar vídeo do exercício
  const getExerciseVideo = async (exerciseName: string) => {
    try {
      // Simular busca de vídeo (em produção, usaria YouTube API)
      const videoId = 'dQw4w9WgXcQ'; // ID de exemplo
      return `https://www.youtube.com/watch?v=${videoId}`;
    } catch (error) {
      console.error('Erro ao buscar vídeo:', error);
      return null;
    }
  };

  // Função para inicializar progresso do treino
  const initializeWorkoutProgress = (workoutDay: string) => {
    if (!currentUser || !currentWorkoutPlan) return;

    const workout = currentWorkoutPlan.workouts.find(w => w.day === workoutDay);
    if (!workout) return;

    const newProgress: Omit<WorkoutProgress, 'createdAt'> = {
      userId: currentUser.id,
      workoutDay,
      date: selectedDate,
      exercises: workout.exercises.map(exercise => ({
        exerciseName: exercise.name,
        sets: Array.from({ length: exercise.sets }, () => ({
          weight: 0,
          reps: 0,
          completed: false
        }))
      }))
    };

    const savedProgress = addWorkoutProgress(newProgress);
    setWorkoutProgressData(savedProgress);
  };

  // Função para atualizar peso/reps de um exercício
  const updateExerciseProgress = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
    if (!workoutProgressData) return;

    const updatedProgress = {
      ...workoutProgressData,
      exercises: workoutProgressData.exercises.map((exercise, eIndex) => 
        eIndex === exerciseIndex 
          ? {
              ...exercise,
              sets: exercise.sets.map((set, sIndex) => 
                sIndex === setIndex 
                  ? { ...set, [field]: value }
                  : set
              )
            }
          : exercise
      )
    };

    setWorkoutProgressData(updatedProgress);
    updateWorkoutProgress(
      workoutProgressData.userId, 
      workoutProgressData.date, 
      workoutProgressData.workoutDay, 
      updatedProgress
    );
  };

  // Função para marcar série como completa
  const toggleSetCompletion = (exerciseIndex: number, setIndex: number) => {
    if (!workoutProgressData) return;

    const updatedProgress = {
      ...workoutProgressData,
      exercises: workoutProgressData.exercises.map((exercise, eIndex) => 
        eIndex === exerciseIndex 
          ? {
              ...exercise,
              sets: exercise.sets.map((set, sIndex) => 
                sIndex === setIndex 
                  ? { ...set, completed: !set.completed }
                  : set
              )
            }
          : exercise
      )
    };

    setWorkoutProgressData(updatedProgress);
    updateWorkoutProgress(
      workoutProgressData.userId, 
      workoutProgressData.date, 
      workoutProgressData.workoutDay, 
      updatedProgress
    );
  };

  // NOVA FUNÇÃO: Salvar treino completo
  const saveCompleteWorkout = () => {
    if (!workoutProgressData) return;

    // Verificar se todas as séries foram completadas
    const allSetsCompleted = workoutProgressData.exercises.every(exercise =>
      exercise.sets.every(set => set.completed)
    );

    if (!allSetsCompleted) {
      const confirmSave = confirm(
        'Nem todas as séries foram marcadas como completas. Deseja salvar mesmo assim?'
      );
      if (!confirmSave) return;
    }

    // Salvar dados do treino (já está sendo salvo automaticamente)
    alert(`✅ Treino de ${workoutProgressData.workoutDay} do dia ${selectedDate} foi salvo com sucesso!\n\nResumo:\n${workoutProgressData.exercises.map(ex => 
      `• ${ex.exerciseName}: ${ex.sets.filter(s => s.completed).length}/${ex.sets.length} séries completas`
    ).join('\n')}`);
  };

  const generatePlans = async () => {
    if (!currentUser?.profile || currentMeals.length === 0) {
      alert('Por favor, complete seu perfil e adicione suas refeições antes de gerar os planos.');
      return;
    }

    // Verificar se usuário tem assinatura ativa
    if (!hasActiveSubscription(currentUser)) {
      setSubscriptionFeature('Gerar planos de dieta e treino com IA');
      setShowSubscriptionPlans(true);
      return;
    }

    setIsGenerating(true);
    
    try {
      // Gerar plano de dieta
      const allFoods = currentMeals.flatMap(meal => meal.foods);
      const dietPlan = await generateDietPlan(currentUser.profile, allFoods);
      addDietPlan({
        ...dietPlan,
        userId: currentUser.id
      });

      // Gerar plano de treino
      const workoutPlan = await generateWorkoutPlan(currentUser.profile, currentUser.profile.preferredMuscleGroups);
      addWorkoutPlan({
        ...workoutPlan,
        userId: currentUser.id
      });

      // Análise corporal com fotos
      if (photos.front || photos.back || photos.left || photos.right) {
        try {
          console.log('Iniciando análise corporal...');
          const analysisResult = await analyzeBodyPhotos(photos);
          const bodyAnalysis = {
            userId: currentUser.id,
            photos,
            analysis: analysisResult
          };
          addBodyAnalysis(bodyAnalysis);
          console.log('Análise corporal concluída:', analysisResult);
        } catch (error) {
          console.error('Erro na análise corporal:', error);
        }
      }

      setActiveTab('results');
      alert('✅ Planos gerados com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar planos:', error);
      alert('❌ Erro ao gerar planos. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Obter planos existentes
  const currentDietPlan = currentUser ? getDietPlanByUserId(currentUser.id) : null;
  const currentWorkoutPlan = currentUser ? getWorkoutPlanByUserId(currentUser.id) : null;
  const currentBodyAnalysis = currentUser ? getBodyAnalysisByUserId(currentUser.id) : null;

  // Função para lidar com seleção de plano
  const handlePlanSelection = (plan: 'starter' | 'standard' | 'premium') => {
    setSelectedPlan(plan);
    setShowSubscriptionPlans(false);
    setShowPayment(true);
  };

  // Função para lidar com pagamento bem-sucedido
  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setSelectedPlan(null);
    setSubscriptionFeature('');
    // Atualizar usuário com nova assinatura seria feito aqui
    alert('✅ Pagamento realizado com sucesso! Agora você pode usar todas as funcionalidades.');
  };

  if (!currentUser) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              {currentUser.profile?.profilePhoto ? (
                <img 
                  src={currentUser.profile.profilePhoto} 
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Olá, {currentUser.name}!
              </h1>
              <p className="text-gray-600">Bem-vindo(a) à sua IA Fitness Pessoal</p>
            </div>
          </div>
          <Button 
            onClick={logout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="workout" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              Treino
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Resultados
            </TabsTrigger>
            {currentUser && hasActiveSubscription(currentUser) && (
              <TabsTrigger value="ai-chat" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                IA Coach
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Foto de Perfil */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-gray-300">
                        {profilePhoto ? (
                          <img 
                            src={profilePhoto} 
                            alt="Foto de perfil" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <label 
                        htmlFor="profile-photo-upload"
                        className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
                      >
                        <Camera className="w-4 h-4 text-white" />
                        <input
                          id="profile-photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-sm text-gray-500">Clique na câmera para alterar sua foto</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="age">Idade</Label>
                      <Input
                        id="age"
                        type="number"
                        value={profile.age || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gênero</Label>
                      <Select 
                        value={profile.gender} 
                        onValueChange={(value) => setProfile(prev => ({ ...prev, gender: value as 'masculino' | 'feminino' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="height">Altura (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={profile.height || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={profile.weight || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="activityLevel">Nível de Atividade</Label>
                    <Select 
                      value={profile.activityLevel} 
                      onValueChange={(value) => setProfile(prev => ({ ...prev, activityLevel: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentario">Sedentário (0-1 treinos/semana)</SelectItem>
                        <SelectItem value="leve">Leve (2-3 treinos/semana)</SelectItem>
                        <SelectItem value="moderado">Moderado (3-4 treinos/semana)</SelectItem>
                        <SelectItem value="intenso">Intenso (5-6 treinos/semana)</SelectItem>
                        <SelectItem value="muito-intenso">Muito Intenso (6-7 treinos/semana)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="goal">Objetivo</Label>
                    <Select 
                      value={profile.goal} 
                      onValueChange={(value) => setProfile(prev => ({ ...prev, goal: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perder-peso">Perder Peso</SelectItem>
                        <SelectItem value="ganhar-massa">Ganhar Massa Muscular</SelectItem>
                        <SelectItem value="manter-peso-perder-gordura">Manter Peso e Perder Gordura</SelectItem>
                        <SelectItem value="melhorar-condicionamento">Melhorar Condicionamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="foodRestrictions">Alimentos que não como (restrições)</Label>
                      <Textarea
                        id="foodRestrictions"
                        placeholder="Ex: lactose, glúten, amendoim, carne vermelha..."
                        value={(profile.foodRestrictions || []).join(', ')}
                        onChange={(e) => setProfile(prev => ({ 
                          ...prev, 
                          foodRestrictions: e.target.value.split(',').map(item => item.trim()).filter(item => item.length > 0)
                        }))}
                        className="min-h-20"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separe os alimentos por vírgula. Estes alimentos serão evitados na sua dieta.
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="foodPreferences">Alimentos que gosto de comer (preferências)</Label>
                      <Textarea
                        id="foodPreferences"
                        placeholder="Ex: frango, arroz integral, brócolis, banana, salmão..."
                        value={(profile.foodPreferences || []).join(', ')}
                        onChange={(e) => setProfile(prev => ({ 
                          ...prev, 
                          foodPreferences: e.target.value.split(',').map(item => item.trim()).filter(item => item.length > 0)
                        }))}
                        className="min-h-20"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separe os alimentos por vírgula. Estes alimentos serão priorizados na sua dieta.
                      </p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Salvar Perfil
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alimentação */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Utensils className="w-5 h-5" />
                    Alimentação Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dietStep === 'question' && (
                    <div className="text-center space-y-4">
                      <p className="text-gray-600">Você segue alguma dieta específica atualmente?</p>
                      <div className="flex gap-4 justify-center">
                        <Button onClick={() => handleDietQuestion(true)} variant="outline">
                          Sim, sigo uma dieta
                        </Button>
                        <Button onClick={() => handleDietQuestion(false)} variant="outline">
                          Não sigo dieta específica
                        </Button>
                      </div>
                    </div>
                  )}

                  {dietStep === 'input' && (
                    <div className="space-y-4">
                      {followsDiet ? (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600">
                            Você pode enviar uma foto ou PDF da sua dieta atual, ou adicionar manualmente:
                          </p>
                          
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <div className="text-center space-y-2">
                              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                              <div>
                                <label htmlFor="diet-file" className="cursor-pointer text-blue-600 hover:text-blue-700">
                                  Clique para enviar arquivo
                                </label>
                                <input
                                  id="diet-file"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={handleDietFileUpload}
                                  className="hidden"
                                />
                              </div>
                              <p className="text-xs text-gray-500">PDF, JPG ou PNG (máx. 10MB)</p>
                            </div>
                          </div>

                          {isAnalyzingDiet && (
                            <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm text-blue-700">Analisando arquivo...</span>
                            </div>
                          )}

                          {/* Interface de revisão dos dados extraídos */}
                          {showExtractedReview && extractedMeals.length > 0 && (
                            <div className="space-y-4 border rounded-lg p-4 bg-amber-50 border-amber-200">
                              <div className="flex items-center gap-2">
                                <Info className="w-5 h-5 text-amber-600" />
                                <h4 className="font-medium text-amber-800">
                                  Revisar Dados Extraídos ({extractedMeals.length} refeições)
                                </h4>
                              </div>
                              <p className="text-sm text-amber-700">
                                Verifique e edite os dados extraídos da imagem/PDF antes de adicionar à sua dieta:
                              </p>
                              
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {extractedMeals.map((meal, index) => (
                                  <div key={index} className="border rounded-lg p-3 bg-white">
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <Label className="text-xs font-medium text-gray-600">Nome da refeição</Label>
                                          <Input
                                            value={meal.name}
                                            onChange={(e) => updateExtractedMeal(index, { ...meal, name: e.target.value })}
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs font-medium text-gray-600">Horário</Label>
                                          <Input
                                            type="time"
                                            value={meal.time}
                                            onChange={(e) => updateExtractedMeal(index, { ...meal, time: e.target.value })}
                                          />
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <Label className="text-xs font-medium text-gray-600">Alimentos</Label>
                                        <div className="space-y-2">
                                          {meal.foods.map((food, foodIndex) => (
                                            <div key={foodIndex} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                                              <Input
                                                placeholder="Alimento"
                                                value={food.food}
                                                onChange={(e) => {
                                                  const updatedFoods = [...meal.foods];
                                                  updatedFoods[foodIndex] = { ...food, food: e.target.value };
                                                  updateExtractedMeal(index, { ...meal, foods: updatedFoods });
                                                }}
                                                className="flex-1"
                                              />
                                              <Input
                                                placeholder="Qtd"
                                                value={food.quantity}
                                                onChange={(e) => {
                                                  const updatedFoods = [...meal.foods];
                                                  updatedFoods[foodIndex] = { ...food, quantity: e.target.value };
                                                  updateExtractedMeal(index, { ...meal, foods: updatedFoods });
                                                }}
                                                className="w-20"
                                              />
                                              <Select 
                                                value={food.measurement} 
                                                onValueChange={(value: 'colher-sopa' | 'colher-cha' | 'xicara' | 'gramas' | 'ml' | 'unidade') => {
                                                  const updatedFoods = [...meal.foods];
                                                  updatedFoods[foodIndex] = { ...food, measurement: value };
                                                  updateExtractedMeal(index, { ...meal, foods: updatedFoods });
                                                }}
                                              >
                                                <SelectTrigger className="w-32">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="gramas">gramas</SelectItem>
                                                  <SelectItem value="ml">ml</SelectItem>
                                                  <SelectItem value="unidade">unidade</SelectItem>
                                                  <SelectItem value="colher-sopa">col. sopa</SelectItem>
                                                  <SelectItem value="colher-cha">col. chá</SelectItem>
                                                  <SelectItem value="xicara">xícara</SelectItem>
                                                </SelectContent>
                                              </Select>
                                              <Button
                                                onClick={() => {
                                                  const updatedFoods = meal.foods.filter((_, i) => i !== foodIndex);
                                                  updateExtractedMeal(index, { ...meal, foods: updatedFoods });
                                                }}
                                                size="sm"
                                                variant="ghost"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      <div className="flex justify-end">
                                        <Button
                                          onClick={() => removeExtractedMeal(index)}
                                          size="sm"
                                          variant="outline"
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="w-4 h-4 mr-1" />
                                          Remover Refeição
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex gap-3 pt-3 border-t">
                                <Button onClick={confirmExtractedMeals} className="flex-1">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Adicionar {extractedMeals.length} Refeições
                                </Button>
                                <Button onClick={cancelExtractedMeals} variant="outline">
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="text-center">
                            <span className="text-sm text-gray-500">ou</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Vamos registrar o que você costuma comer no dia a dia:
                        </p>
                      )}

                      {/* Formulário para adicionar refeições */}
                      <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-medium flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Adicionar Refeição
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="meal-name">Nome da refeição</Label>
                            <Input
                              id="meal-name"
                              placeholder="Ex: Café da manhã"
                              value={newMeal.name}
                              onChange={(e) => setNewMeal(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="meal-time">Horário</Label>
                            <Input
                              id="meal-time"
                              type="time"
                              value={newMeal.time}
                              onChange={(e) => {
                                const timeValue = e.target.value;
                                console.log('Valor do time capturado:', timeValue);
                                setNewMeal(prev => ({ 
                                  ...prev, 
                                  time: timeValue 
                                }));
                              }}
                            />
                          </div>
                        </div>

                        {/* Adicionar alimentos à refeição */}
                        <div className="space-y-3">
                          <Label>Alimentos</Label>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <Input
                              placeholder="Alimento"
                              value={newFood.food}
                              onChange={(e) => setNewFood(prev => ({ ...prev, food: e.target.value }))}
                            />
                            <Input
                              placeholder="Quantidade"
                              value={newFood.quantity}
                              onChange={(e) => setNewFood(prev => ({ ...prev, quantity: e.target.value }))}
                            />
                            <Select 
                              value={newFood.measurement} 
                              onValueChange={(value: 'colher-sopa' | 'colher-cha' | 'xicara' | 'gramas' | 'ml' | 'unidade') => setNewFood(prev => ({ ...prev, measurement: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gramas">gramas</SelectItem>
                                <SelectItem value="ml">ml</SelectItem>
                                <SelectItem value="unidade">unidade</SelectItem>
                                <SelectItem value="colher-sopa">colher de sopa</SelectItem>
                                <SelectItem value="colher-cha">colher de chá</SelectItem>
                                <SelectItem value="xicara">xícara</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button onClick={addFoodToMeal} size="sm">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Lista de alimentos da refeição atual */}
                          {newMeal.foods.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Alimentos nesta refeição:</p>
                              {newMeal.foods.map((food, index) => (
                                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                                  <span className="text-sm">
                                    {food.food} - {food.quantity} {food.measurement}
                                  </span>
                                  <Button
                                    onClick={() => removeFoodFromMeal(index)}
                                    size="sm"
                                    variant="ghost"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button onClick={addMealToList} className="w-full">
                          Adicionar Refeição
                        </Button>
                      </div>

                      {/* Lista de refeições adicionadas */}
                      {currentMeals.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium">Refeições Registradas ({currentMeals.length})</h4>
                          {currentMeals.map((meal, index) => (
                            <div key={index} className="border rounded-lg p-3 bg-white">
                              {editingMealIndex === index ? (
                                // Modo de edição
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <Label>Nome da refeição</Label>
                                      <Input
                                        value={editingMeal?.name || ''}
                                        onChange={(e) => setEditingMeal(prev => prev ? { ...prev, name: e.target.value } : null)}
                                      />
                                    </div>
                                    <div>
                                      <Label>Horário</Label>
                                      <Input
                                        type="time"
                                        value={editingMeal?.time || ''}
                                        onChange={(e) => setEditingMeal(prev => prev ? { ...prev, time: e.target.value } : null)}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label>Alimentos</Label>
                                    <div className="space-y-2">
                                      {editingMeal?.foods.map((food, foodIndex) => (
                                        <div key={foodIndex} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                                          <Input
                                            placeholder="Alimento"
                                            value={food.food}
                                            onChange={(e) => {
                                              const updatedFoods = [...(editingMeal?.foods || [])];
                                              updatedFoods[foodIndex] = { ...food, food: e.target.value };
                                              setEditingMeal(prev => prev ? { ...prev, foods: updatedFoods } : null);
                                            }}
                                            className="flex-1"
                                          />
                                          <Input
                                            placeholder="Qtd"
                                            value={food.quantity}
                                            onChange={(e) => {
                                              const updatedFoods = [...(editingMeal?.foods || [])];
                                              updatedFoods[foodIndex] = { ...food, quantity: e.target.value };
                                              setEditingMeal(prev => prev ? { ...prev, foods: updatedFoods } : null);
                                            }}
                                            className="w-20"
                                          />
                                          <Select 
                                            value={food.measurement} 
                                            onValueChange={(value: 'colher-sopa' | 'colher-cha' | 'xicara' | 'gramas' | 'ml' | 'unidade') => {
                                              const updatedFoods = [...(editingMeal?.foods || [])];
                                              updatedFoods[foodIndex] = { ...food, measurement: value };
                                              setEditingMeal(prev => prev ? { ...prev, foods: updatedFoods } : null);
                                            }}
                                          >
                                            <SelectTrigger className="w-32">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="gramas">gramas</SelectItem>
                                              <SelectItem value="ml">ml</SelectItem>
                                              <SelectItem value="unidade">unidade</SelectItem>
                                              <SelectItem value="colher-sopa">col. sopa</SelectItem>
                                              <SelectItem value="colher-cha">col. chá</SelectItem>
                                              <SelectItem value="xicara">xícara</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <Button
                                            onClick={() => {
                                              const updatedFoods = editingMeal?.foods.filter((_, i) => i !== foodIndex) || [];
                                              setEditingMeal(prev => prev ? { ...prev, foods: updatedFoods } : null);
                                            }}
                                            size="sm"
                                            variant="ghost"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button onClick={saveEditingMeal} size="sm">
                                      Salvar
                                    </Button>
                                    <Button onClick={cancelEditingMeal} size="sm" variant="outline">
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // Modo de visualização
                                <>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium">{meal.name}</span>
                                      <Badge variant="outline">{meal.time}</Badge>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => startEditingMeal(index)}
                                        size="sm"
                                        variant="ghost"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        onClick={() => removeMealFromList(index)}
                                        size="sm"
                                        variant="ghost"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {meal.foods.map((food, foodIndex) => (
                                      <span key={foodIndex}>
                                        {food.food} ({food.quantity} {food.measurement})
                                        {foodIndex < meal.foods.length - 1 ? ', ' : ''}
                                      </span>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {currentMeals.length > 0 && (
                        <Button 
                          onClick={() => setDietStep('review')} 
                          className="w-full"
                        >
                          Continuar
                        </Button>
                      )}
                    </div>
                  )}

                  {dietStep === 'review' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Alimentação registrada!</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {currentMeals.length} refeições foram registradas. Agora você pode adicionar suas fotos e gerar seus planos personalizados.
                      </p>
                      <Button 
                        onClick={() => setDietStep('input')} 
                        variant="outline" 
                        size="sm"
                      >
                        Editar refeições
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fotos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Fotos Corporais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {(['front', 'back', 'left', 'right'] as const).map((position) => (
                      <div key={position} className="space-y-2">
                        <Label className="capitalize">
                          {position === 'front' ? 'Frente' : 
                           position === 'back' ? 'Costas' : 
                           position === 'left' ? 'Lado Esquerdo' : 'Lado Direito'}
                        </Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          {photos[position] ? (
                            <div className="space-y-2">
                              <img 
                                src={photos[position]} 
                                alt={position}
                                className="w-full h-32 object-cover rounded"
                              />
                              <Button
                                onClick={() => setPhotos(prev => ({ ...prev, [position]: '' }))}
                                size="sm"
                                variant="outline"
                              >
                                Remover
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <label htmlFor={`photo-${position}`} className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm">
                                Adicionar foto
                              </label>
                              <input
                                id={`photo-${position}`}
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePhotoUpload(position, file);
                                }}
                                className="hidden"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Botão para análise de fotos */}
                  {(photos.front || photos.back || photos.left || photos.right) && (
                    <div className="mt-4 text-center">
                      <Button 
                        onClick={analyzePhotosOnly}
                        disabled={isAnalyzingPhotos}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isAnalyzingPhotos ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analisando fotos...
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4 mr-2" />
                            Analisar Fotos
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Faça a análise corporal independente dos planos
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Botão para gerar planos */}
            <div className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <Target className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-semibold">Gerar Planos Personalizados</h3>
                    </div>
                    <p className="text-gray-600">
                      Com base no seu perfil, alimentação atual e fotos, nossa IA criará planos personalizados de dieta e treino.
                    </p>
                    <Button 
                      onClick={generatePlans}
                      disabled={isGenerating || !currentUser?.profile || currentMeals.length === 0}
                      className="w-full max-w-md"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando planos...
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4 mr-2" />
                          Gerar Meus Planos
                        </>
                      )}
                    </Button>
                    {(!currentUser?.profile || currentMeals.length === 0) && (
                      <p className="text-sm text-amber-600">
                        Complete seu perfil e adicione suas refeições para continuar
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Workout Tab */}
          <TabsContent value="workout">
            <div className="space-y-6">
              {currentWorkoutPlan ? (
                <>
                  {/* Seletor de data e treino */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Registrar Treino
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="workout-date">Data do Treino</Label>
                          <Input
                            id="workout-date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="workout-day">Treino</Label>
                          <Select value={selectedWorkoutDay} onValueChange={setSelectedWorkoutDay}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o treino" />
                            </SelectTrigger>
                            <SelectContent>
                              {currentWorkoutPlan.workouts.map((workout) => (
                                <SelectItem key={workout.day} value={workout.day}>
                                  {workout.day} - {workout.muscleGroup}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {selectedWorkoutDay && !workoutProgressData && (
                        <Button 
                          onClick={() => initializeWorkoutProgress(selectedWorkoutDay)}
                          className="w-full"
                        >
                          Iniciar Treino de {selectedWorkoutDay}
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Progresso do treino */}
                  {workoutProgressData && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Dumbbell className="w-5 h-5" />
                            Treino de {workoutProgressData.workoutDay}
                          </div>
                          <Badge variant="outline">
                            {selectedDate}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {workoutProgressData.exercises.map((exercise, exerciseIndex) => (
                          <div key={exerciseIndex} className="space-y-4 border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{exercise.exerciseName}</h4>
                              <Button
                                onClick={() => getExerciseVideo(exercise.exerciseName)}
                                size="sm"
                                variant="outline"
                              >
                                <Play className="w-4 h-4 mr-1" />
                                Vídeo
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              {exercise.sets.map((set, setIndex) => (
                                <div key={setIndex} className="grid grid-cols-4 gap-2 items-center">
                                  <div className="text-sm font-medium">
                                    Série {setIndex + 1}
                                  </div>
                                  <div>
                                    <Input
                                      type="number"
                                      placeholder="Peso (kg)"
                                      value={set.weight || ''}
                                      onChange={(e) => updateExerciseProgress(
                                        exerciseIndex, 
                                        setIndex, 
                                        'weight', 
                                        parseFloat(e.target.value) || 0
                                      )}
                                    />
                                  </div>
                                  <div>
                                    <Input
                                      type="number"
                                      placeholder="Reps"
                                      value={set.reps || ''}
                                      onChange={(e) => updateExerciseProgress(
                                        exerciseIndex, 
                                        setIndex, 
                                        'reps', 
                                        parseInt(e.target.value) || 0
                                      )}
                                    />
                                  </div>
                                  <div className="flex justify-center">
                                    <Checkbox
                                      checked={set.completed}
                                      onCheckedChange={() => toggleSetCompletion(exerciseIndex, setIndex)}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        <Button onClick={saveCompleteWorkout} className="w-full">
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Treino
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <Dumbbell className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Nenhum plano de treino</h3>
                        <p className="text-gray-600">
                          Gere seu plano personalizado na aba Dashboard
                        </p>
                      </div>
                      <Button onClick={() => setActiveTab('dashboard')}>
                        Ir para Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <div className="space-y-6">
              <Tabs value={resultsTab} onValueChange={setResultsTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="diet">Dieta</TabsTrigger>
                  <TabsTrigger value="workout">Treino</TabsTrigger>
                  <TabsTrigger value="analysis">Análise</TabsTrigger>
                </TabsList>

                <TabsContent value="diet">
                  {currentDietPlan ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Utensils className="w-5 h-5" />
                          Seu Plano de Dieta
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {currentDietPlan.dailyCalories}
                            </div>
                            <div className="text-sm text-gray-600">Calorias/dia</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {currentDietPlan.macros.protein}g
                            </div>
                            <div className="text-sm text-gray-600">Proteína</div>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">
                              {currentDietPlan.macros.carbs}g
                            </div>
                            <div className="text-sm text-gray-600">Carboidratos</div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {currentDietPlan.meals.map((meal, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <h4 className="font-medium">{meal.meal}</h4>
                                <Badge variant="outline">{meal.time}</Badge>
                              </div>
                              <div className="space-y-2">
                                {meal.foods.map((food, foodIndex) => (
                                  <div key={foodIndex} className="flex justify-between items-center text-sm">
                                    <span>{food.food}</span>
                                    <span className="text-gray-500">
                                      {food.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Chat de Edição de Dieta */}
                        <Separator />
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold">Editar Dieta com IA</h3>
                          </div>
                          <p className="text-sm text-gray-600">
                            Faça perguntas ou solicite mudanças na sua dieta. Exemplo: "café da manhã eu costumo comer banana, aveia e tomar 250ml de leite com café, como ficaria minha dieta colocando isso no café da manhã?"
                          </p>

                          {/* Histórico do Chat */}
                          {dietChatHistory.length > 0 && (
                            <div className="space-y-3 max-h-80 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                              {dietChatHistory.map((chat, index) => (
                                <div key={index} className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                      <User className="w-3 h-3 text-blue-600" />
                                    </div>
                                    <div className="flex-1 bg-white rounded-lg p-3 border">
                                      <p className="text-sm">{chat.user}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                      <Target className="w-3 h-3 text-green-600" />
                                    </div>
                                    <div className="flex-1 bg-green-50 rounded-lg p-3 border border-green-200">
                                      <p className="text-sm">{chat.ai}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Campo de Entrada do Chat */}
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Ex: cafe da manha eu costumo comer banana, aveia e tomar 250ml de leite com cafe, como ficaria minha dieta colocando isso no cafe da manha?"
                              value={dietChatMessage}
                              onChange={(e) => setDietChatMessage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  processDietChat();
                                }
                              }}
                              className="flex-1 min-h-20"
                              disabled={isProcessingDietChat}
                            />
                            <Button 
                              onClick={processDietChat}
                              disabled={!dietChatMessage.trim() || isProcessingDietChat}
                              className="px-6"
                            >
                              {isProcessingDietChat ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Enviar'
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <Utensils className="w-12 h-12 text-gray-400 mx-auto" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Nenhum plano de dieta</h3>
                            <p className="text-gray-600">
                              Gere seu plano personalizado na aba Dashboard
                            </p>
                          </div>
                          <Button onClick={() => setActiveTab('dashboard')}>
                            Ir para Dashboard
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="workout">
                  {currentWorkoutPlan ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Dumbbell className="w-5 h-5" />
                          Seu Plano de Treino
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Aviso sobre referências de exercícios */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div className="flex items-start gap-2">
                            <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                            <p className="text-sm text-blue-800">
                              <strong>💡 Dica:</strong> Caso tenha dúvidas sobre como executar o exercício, vá na aba "Treino" para registrar seu treino, e lá você terá as referências de cada exercício.
                            </p>
                          </div>
                        </div>
                        {currentWorkoutPlan.workouts.map((workout, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Target className="w-4 h-4 text-gray-500" />
                              <h4 className="font-medium">{workout.day}</h4>
                              <Badge variant="outline">{workout.muscleGroup}</Badge>
                            </div>
                            <div className="space-y-2">
                              {workout.exercises.map((exercise, exerciseIndex) => (
                                <div key={exerciseIndex} className="flex justify-between items-center text-sm">
                                  <span>{exercise.name}</span>
                                  <span className="text-gray-500">
                                    {exercise.sets} séries × {exercise.reps} reps
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <Dumbbell className="w-12 h-12 text-gray-400 mx-auto" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Nenhum plano de treino</h3>
                            <p className="text-gray-600">
                              Gere seu plano personalizado na aba Dashboard
                            </p>
                          </div>
                          <Button onClick={() => setActiveTab('dashboard')}>
                            Ir para Dashboard
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="analysis">
                  {currentBodyAnalysis ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Análise Corporal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          {Object.entries(currentBodyAnalysis.photos).map(([position, photo]) => (
                            photo && (
                              <div key={position} className="space-y-2">
                                <img 
                                  src={photo} 
                                  alt={position}
                                  className="w-full h-32 object-cover rounded"
                                />
                                <p className="text-xs text-center text-gray-500 capitalize">
                                  {position === 'front' ? 'Frente' : 
                                   position === 'back' ? 'Costas' : 
                                   position === 'left' ? 'Lado Esquerdo' : 'Lado Direito'}
                                </p>
                              </div>
                            )
                          ))}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Análise</h4>
                            <p className="text-gray-600">{currentBodyAnalysis.analysis.proportions}</p>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Recomendações</h4>
                            <ul className="space-y-1">
                              {currentBodyAnalysis.analysis.recommendations.map((rec: string, index: number) => (
                                <li key={index} className="flex items-start gap-2 text-gray-600">
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <Activity className="w-12 h-12 text-gray-400 mx-auto" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Nenhuma análise disponível</h3>
                            <p className="text-gray-600">
                              Adicione suas fotos e gere sua análise na aba Dashboard
                            </p>
                          </div>
                          <Button onClick={() => setActiveTab('dashboard')}>
                            Ir para Dashboard
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* AI Coach Tab - Premium Feature */}
          <TabsContent value="ai-chat">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  IA Coach - Tire suas dúvidas
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Funcionalidade premium: faça perguntas sobre suplementos, ciclos de hormônios, nutrição avançada e muito mais
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Aviso importante */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h4 className="font-medium text-amber-800">⚠️ Importante</h4>
                      <p className="text-sm text-amber-700">
                        As informações fornecidas são para fins educacionais. Para questões médicas específicas, 
                        consulte sempre um profissional qualificado (médico, nutricionista, educador físico).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sugestões de perguntas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">💊 Suplementação</h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• "Devo tomar whey protein?"</li>
                      <li>• "Como usar creatina corretamente?"</li>
                      <li>• "Vale a pena tomar BCAA?"</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">🧬 Hormônios</h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• "Como aumentar testosterona natural?"</li>
                      <li>• "Sinais de baixa testosterona"</li>
                      <li>• "Quando procurar endocrinologista?"</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">🔥 Performance</h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• "Pré-treino vale a pena?"</li>
                      <li>• "Como quebrar platô no treino?"</li>
                      <li>• "Termogênicos funcionam?"</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">🥗 Nutrição</h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• "Preciso de multivitamínico?"</li>
                      <li>• "Ômega-3 é necessário?"</li>
                      <li>• "Como calcular macros?"</li>
                    </ul>
                  </div>
                </div>

                {/* Histórico do Chat */}
                {aiChatHistory.length > 0 && (
                  <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                    {aiChatHistory.map((chat, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 bg-white rounded-lg p-3 border shadow-sm">
                            <p className="text-sm font-medium text-blue-700 mb-1">Você perguntou:</p>
                            <p className="text-sm">{chat.user}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <Heart className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="flex-1 bg-red-50 rounded-lg p-3 border border-red-200 shadow-sm">
                            <p className="text-sm font-medium text-red-700 mb-1">IA Coach respondeu:</p>
                            <p className="text-sm whitespace-pre-line">{chat.ai}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Campo de Entrada do Chat */}
                <div className="space-y-3">
                  <Label htmlFor="ai-chat-input">Faça sua pergunta para a IA Coach:</Label>
                  <div className="flex gap-3">
                    <Textarea
                      id="ai-chat-input"
                      placeholder="Ex: Devo tomar creatina? Como funciona e qual a dosagem recomendada?"
                      value={aiChatMessage}
                      onChange={(e) => setAiChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          processAiChat();
                        }
                      }}
                      className="flex-1 min-h-24"
                      disabled={isProcessingAiChat}
                    />
                    <Button 
                      onClick={processAiChat}
                      disabled={!aiChatMessage.trim() || isProcessingAiChat}
                      className="px-6 self-end"
                    >
                      {isProcessingAiChat ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Heart className="w-4 h-4 mr-2" />
                          Perguntar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modais de Assinatura */}
      {showSubscriptionPlans && (
        <SubscriptionRequired
          feature={subscriptionFeature}
          onSelectPlan={handlePlanSelection}
        />
      )}

      {showPayment && selectedPlan && (
        <PaymentScreen
          selectedPlan={selectedPlan}
          onBack={() => setShowPayment(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}