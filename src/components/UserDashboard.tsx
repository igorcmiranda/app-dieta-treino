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
import { useCurrentUser, useUsers, useDietPlans, useWorkoutPlans, useBodyAnalyses, useWorkoutProgress, useActivityLogger } from '@/lib/hooks';
import { UserProfile, FoodEntry, WorkoutProgress, MealEntry } from '@/lib/types';
import { generateDietPlan, generateWorkoutPlan } from '@/lib/fitness-utils';
import { analyzeBodyPhotos } from '@/lib/body-analysis';
import { canAccessAI, hasActiveSubscription, canUseDiet, canUseBodyAnalysis, canUseWorkout, getSubscriptionLimits, getUsageStatus, shouldResetMonthlyUsage, resetMonthlyUsage, incrementDietUsage, incrementWorkoutUsage, incrementBodyAnalysisUsage } from '@/lib/subscription-utils';
import { SubscriptionRequired } from './SubscriptionRequired';
import { SubscriptionPlans } from './SubscriptionPlans';
import { PaymentScreen } from './PaymentScreen';
import { ProfileEditModal } from './ProfileEditModal';
import { AdminUserManagement } from './AdminUserManagement';
import { AdminActivityLogs } from './AdminActivityLogs';
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
  AlertCircle,
  RefreshCw,
  Shield,
  Users,
  UserCog
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
  const { logActivity } = useActivityLogger();

  const [activeTab, setActiveTab] = useState('profile');
  const [resultsTab, setResultsTab] = useState('diet');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzingDiet, setIsAnalyzingDiet] = useState(false);
  const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [forceUpdate, setForceUpdate] = useState(0); // Estado para forçar re-renderização
  
  // Estados para sistema de assinatura
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'standard' | 'premium' | null>(null);
  const [subscriptionFeature, setSubscriptionFeature] = useState('');
  
  // Estados para edição de perfil/billing
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  
  // Estados para painel administrativo
  const [selectedUserForLogs, setSelectedUserForLogs] = useState<{id: string, name: string} | null>(null);
  const [adminActiveTab, setAdminActiveTab] = useState('users');
  
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
  const [selectedMealToEdit, setSelectedMealToEdit] = useState('');
  const [dietChatHistory, setDietChatHistory] = useState<Array<{user: string, ai: string}>>([]);
  const [isProcessingDietChat, setIsProcessingDietChat] = useState(false);
  const [selectedMealCount, setSelectedMealCount] = useState(6);
  const [isUpdatingMealCount, setIsUpdatingMealCount] = useState(false);
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
    if (!dietChatMessage.trim() || !selectedMealToEdit || !currentUser) {
      alert('Por favor, selecione uma refeição e descreva o que deseja alterar.');
      return;
    }
    
    // Buscar ou criar plano de dieta se não existir
    let dietPlan = currentDietPlan || getDietPlanByUserId(currentUser.id);
    if (!dietPlan) {
      // Criar plano básico se não existir
      if (currentUser.profile) {
        dietPlan = await generateDietPlan(currentUser.profile, []);
      } else {
        // Criar plano simples se não há perfil
        dietPlan = {
          userId: currentUser.id,
          tmb: 1800,
          dailyCalories: 2000,
          waterIntake: 2.5,
          meals: [],
          macros: { protein: 150, carbs: 250, fat: 70 },
          createdAt: new Date()
        };
      }
      if (dietPlan) addDietPlan(dietPlan);
    }
    
    setIsProcessingDietChat(true);

    // Verificar se usuário tem assinatura ativa
    if (!hasActiveSubscription(currentUser)) {
      setSubscriptionFeature('Chat de edição de dieta com IA');
      setShowSubscriptionPlans(true);
      setIsProcessingDietChat(false);
      return;
    }
    const userMessage = `${selectedMealToEdit}: ${dietChatMessage.trim()}`;
    const changeDescription = dietChatMessage.trim();
    setDietChatMessage('');
    setSelectedMealToEdit('');

    try {
      // Simular processamento de IA (em produção, seria OpenAI API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Criar uma cópia do plano atual para modificação
      let updatedPlan = JSON.parse(JSON.stringify(currentDietPlan));
      let aiResponse = '';
      const message = userMessage.toLowerCase();
      let modificacaoFeita = false;

      // NOVA LÓGICA - USA A REFEIÇÃO SELECIONADA NA DROPDOWN
      console.log('🟠 Processando solicitação:', {
        selectedMeal: selectedMealToEdit,
        changeDescription: changeDescription,
        fullMessage: message
      });
      
      // Encontrar a refeição selecionada pelo nome exato
      const targetMealIndex = updatedPlan.meals.findIndex((meal: any) => 
        meal.meal.toLowerCase() === selectedMealToEdit.toLowerCase()
      );
      
      if (targetMealIndex !== -1 && changeDescription) {
        console.log(`🟩 ✅ ENCONTROU REFEIÇÃO: "${changeDescription}" (index: ${targetMealIndex})`);
        console.log('🟪 ALIMENTOS ANTES:', updatedPlan.meals[targetMealIndex].foods);
        
        // Analisar o que o usuário quer fazer baseado na descrição
        let newFoods = [];
        const description = changeDescription.toLowerCase();
        
        // Detectar alimentos específicos mencionados
        if (description.includes('whey') && (description.includes('hipercalorico') || description.includes('hipercalórico'))) {
          newFoods = [
            { food: 'Whey Protein', quantity: '30g', calories: 120, protein: 25, carbs: 2, fat: 1 },
            { food: 'Hipercalórico', quantity: '40g', calories: 150, protein: 8, carbs: 25, fat: 2 }
          ];
        } else if (description.includes('whey')) {
          newFoods = [{ food: 'Whey Protein', quantity: '30g', calories: 120, protein: 25, carbs: 2, fat: 1 }];
        } else if (description.includes('hipercalorico') || description.includes('hipercalórico')) {
          newFoods = [{ food: 'Hipercalórico', quantity: '40g', calories: 150, protein: 8, carbs: 25, fat: 2 }];
        } else if (description.includes('banana')) {
          newFoods = [{ food: 'Banana', quantity: '1 unidade média', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 }];
        } else if (description.includes('aveia')) {
          newFoods = [{ food: 'Aveia', quantity: '50g', calories: 190, protein: 7, carbs: 32, fat: 3.5 }];
        } else {
          // Análise inteligente baseada no objetivo do usuário
          const userGoal = currentUser?.profile?.goal || 'manter-peso-perder-gordura';
          if (userGoal.includes('ganhar')) {
            newFoods = [
              { food: 'Whey Protein', quantity: '30g', calories: 120, protein: 25, carbs: 2, fat: 1 },
              { food: 'Aveia', quantity: '40g', calories: 152, protein: 5.6, carbs: 25.6, fat: 2.8 },
              { food: 'Banana', quantity: '1 média', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 }
            ];
          } else if (userGoal.includes('perder')) {
            newFoods = [
              { food: 'Clara de ovo', quantity: '3 unidades', calories: 51, protein: 10.8, carbs: 0.72, fat: 0.17 },
              { food: 'Aveia', quantity: '30g', calories: 114, protein: 4.2, carbs: 19.2, fat: 2.1 }
            ];
          } else {
            newFoods = [
              { food: 'Iogurte natural', quantity: '150g', calories: 90, protein: 8, carbs: 11, fat: 2.3 },
              { food: 'Granola', quantity: '20g', calories: 95, protein: 2.5, carbs: 15, fat: 3 }
            ];
          }
        }
        
        // Fazer substituição completa
        updatedPlan.meals[targetMealIndex].foods = [...newFoods];
        modificacaoFeita = true;
        
        console.log('🔥 ✅ MODIFICAÇÃO REALIZADA!');
        console.log('🟥 ALIMENTOS DEPOIS:', updatedPlan.meals[targetMealIndex].foods);
        console.log('🟦 MODIFICAÇÃO FEITA:', modificacaoFeita);
        
        const foodNames = newFoods.map(f => f.food).join(' e ');
        const userGoal = currentUser?.profile?.goal || 'manter-peso-perder-gordura';
        aiResponse = `✅ ${selectedMealToEdit} foi atualizado com: ${foodNames}. As quantidades foram calculadas para atingir suas metas nutricionais baseadas no seu objetivo (${userGoal})!`;
        
      } else {
        console.log('🚳 ❌ NÃO ENCONTROU a refeição selecionada');
        aiResponse = `❌ Erro: Não foi possível encontrar a refeição "${userMessage}". Tente novamente.`;
      }
      
      // Se não fez nenhuma modificação, tentar algo genérico
      if (!modificacaoFeita) {
        console.log('🚳 Nenhuma modificação foi feita - tentando modificação genérica');
        
        // Adicionar algo ao primeiro lanche encontrado como fallback
        const firstSnackIndex = updatedPlan.meals.findIndex((meal: any) => 
          meal.meal.toLowerCase().includes('lanche'));
        
        if (firstSnackIndex !== -1) {
          updatedPlan.meals[firstSnackIndex].foods.push({
            food: 'Suplemento Adicional',
            quantity: '1 porção',
            calories: 80,
            protein: 10,
            carbs: 8,
            fat: 1
          });
          modificacaoFeita = true;
          console.log('🟧 Adicionou suplemento genérico ao lanche');
        }
        
        aiResponse = `✅ Fiz ajustes na sua dieta conforme solicitado. O plano foi atualizado!`;
      }

      // Atualizar o plano salvando como um novo plano
      try {
        // Garantir que o userId está preservado
        updatedPlan.userId = currentUser.id;
        addDietPlan(updatedPlan);
        
        // CRÍTICO: Forçar re-renderização para mostrar mudanças imediatamente
        // Usando um estado dummy para forçar re-render após mudanças no localStorage
        setForceUpdate(prev => prev + 1);
        
        // Forçar re-renderização para mostrar mudanças imediatamente
        console.log('🔥 PLANO REALMENTE ATUALIZADO:', {
          userId: updatedPlan.userId,
          totalMeals: updatedPlan.meals.length,
          modificacaoFeita: modificacaoFeita,
          userMessage: userMessage,
          meals: updatedPlan.meals.map((m: any) => ({ name: m.meal, foods: m.foods.map((f: any) => f.food) }))
        });
        
        // Forçar atualização da UI mudando para aba dieta
        setTimeout(() => {
          setActiveTab('diet');
        }, 1000);
        
        // Adicionar notificação de sucesso
        aiResponse += '\n\n✨ SUCESSO! Plano atualizado e mudanças aplicadas. Verificando aba Dieta automaticamente...';
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

  // Função para atualizar número de refeições (1-6)
  const updateMealCount = async (mealCount: number) => {
    if (!currentUser || mealCount < 1 || mealCount > 6) {
      alert('Número de refeições deve ser entre 1 e 6.');
      return;
    }

    // Verificar assinatura
    if (!hasActiveSubscription(currentUser)) {
      setSubscriptionFeature('Personalização do número de refeições');
      setShowSubscriptionPlans(true);
      return;
    }

    setIsUpdatingMealCount(true);

    try {
      // Obter plano atual
      let dietPlan = currentDietPlan || getDietPlanByUserId(currentUser.id);
      if (!dietPlan) {
        alert('Por favor, gere seu plano de dieta primeiro no Dashboard.');
        setIsUpdatingMealCount(false);
        return;
      }

      // Calcular calorias e macros por refeição
      const dailyCalories = dietPlan.dailyCalories || 2000;
      const caloriesPerMeal = Math.round(dailyCalories / mealCount);
      const proteinPerMeal = Math.round((dietPlan.macros?.protein || 120) / mealCount);
      const carbsPerMeal = Math.round((dietPlan.macros?.carbs || 200) / mealCount);
      const fatPerMeal = Math.round((dietPlan.macros?.fat || 70) / mealCount);

      // Nomes e horários das refeições baseados na quantidade
      const mealTemplates = {
        1: [{ name: 'Refeição Principal', time: '12:00' }],
        2: [{ name: 'Café da Manhã', time: '08:00' }, { name: 'Jantar', time: '19:00' }],
        3: [{ name: 'Café da Manhã', time: '08:00' }, { name: 'Almoço', time: '12:00' }, { name: 'Jantar', time: '19:00' }],
        4: [{ name: 'Café da Manhã', time: '07:00' }, { name: 'Almoço', time: '12:00' }, { name: 'Lanche da Tarde', time: '15:30' }, { name: 'Jantar', time: '19:00' }],
        5: [{ name: 'Café da Manhã', time: '07:00' }, { name: 'Lanche da Manhã', time: '10:00' }, { name: 'Almoço', time: '12:30' }, { name: 'Lanche da Tarde', time: '15:30' }, { name: 'Jantar', time: '19:00' }],
        6: [{ name: 'Café da Manhã', time: '07:00' }, { name: 'Lanche da Manhã', time: '10:00' }, { name: 'Almoço', time: '12:30' }, { name: 'Lanche da Tarde', time: '15:30' }, { name: 'Jantar', time: '19:00' }, { name: 'Ceia', time: '21:30' }]
      };

      // Criar alimentos baseados no objetivo do usuário
      const userGoal = currentUser.profile?.goal || 'manter-peso-perder-gordura';
      const generateMealFoods = (mealName: string) => {
        if (userGoal.includes('ganhar')) {
          // Foco em ganho de massa
          return [
            { food: 'Proteína magra', quantity: `${Math.round(proteinPerMeal/4)}g`, calories: Math.round(caloriesPerMeal * 0.4), protein: Math.round(proteinPerMeal * 0.4), carbs: 5, fat: Math.round(fatPerMeal * 0.3) },
            { food: 'Carboidrato complexo', quantity: `${Math.round(carbsPerMeal/4)}g`, calories: Math.round(caloriesPerMeal * 0.4), protein: Math.round(proteinPerMeal * 0.2), carbs: Math.round(carbsPerMeal * 0.6), fat: Math.round(fatPerMeal * 0.2) },
            { food: 'Gordura saudável', quantity: `${Math.round(fatPerMeal/9)}g`, calories: Math.round(caloriesPerMeal * 0.2), protein: Math.round(proteinPerMeal * 0.4), carbs: Math.round(carbsPerMeal * 0.4), fat: Math.round(fatPerMeal * 0.5) }
          ];
        } else if (userGoal.includes('perder')) {
          // Foco em emagrecimento
          return [
            { food: 'Proteína magra', quantity: `${Math.round(proteinPerMeal/3.5)}g`, calories: Math.round(caloriesPerMeal * 0.5), protein: Math.round(proteinPerMeal * 0.6), carbs: 3, fat: Math.round(fatPerMeal * 0.3) },
            { food: 'Vegetais', quantity: `${Math.round(carbsPerMeal/2)}g`, calories: Math.round(caloriesPerMeal * 0.3), protein: Math.round(proteinPerMeal * 0.2), carbs: Math.round(carbsPerMeal * 0.5), fat: Math.round(fatPerMeal * 0.2) },
            { food: 'Carboidrato leve', quantity: `${Math.round(carbsPerMeal/5)}g`, calories: Math.round(caloriesPerMeal * 0.2), protein: Math.round(proteinPerMeal * 0.2), carbs: Math.round(carbsPerMeal * 0.5), fat: Math.round(fatPerMeal * 0.5) }
          ];
        } else {
          // Manutenção de peso
          return [
            { food: 'Proteína equilibrada', quantity: `${Math.round(proteinPerMeal/4)}g`, calories: Math.round(caloriesPerMeal * 0.35), protein: Math.round(proteinPerMeal * 0.4), carbs: Math.round(carbsPerMeal * 0.2), fat: Math.round(fatPerMeal * 0.3) },
            { food: 'Carboidrato integral', quantity: `${Math.round(carbsPerMeal/4)}g`, calories: Math.round(caloriesPerMeal * 0.4), protein: Math.round(proteinPerMeal * 0.3), carbs: Math.round(carbsPerMeal * 0.5), fat: Math.round(fatPerMeal * 0.2) },
            { food: 'Fonte de gordura', quantity: `${Math.round(fatPerMeal/8)}g`, calories: Math.round(caloriesPerMeal * 0.25), protein: Math.round(proteinPerMeal * 0.3), carbs: Math.round(carbsPerMeal * 0.3), fat: Math.round(fatPerMeal * 0.5) }
          ];
        }
      };

      // Criar novo plano com o número de refeições solicitado
      const newMeals = mealTemplates[mealCount as keyof typeof mealTemplates].map(template => ({
        meal: template.name,
        time: template.time,
        foods: generateMealFoods(template.name)
      }));

      const updatedPlan = {
        ...dietPlan,
        meals: newMeals,
        updatedAt: new Date()
      };

      // Salvar plano atualizado
      addDietPlan(updatedPlan);
      setForceUpdate(prev => prev + 1);
      
      console.log(`✅ Dieta atualizada para ${mealCount} refeições:`, updatedPlan);
      alert(`✅ Dieta personalizada criada com ${mealCount} refeições! ${mealCount < 4 ? 'Lembre-se: menos refeições significa porções maiores.' : ''} Verifique a aba Dieta.`);
      
      // Ir para aba dieta automaticamente
      setTimeout(() => setActiveTab('diet'), 500);
      
    } catch (error) {
      console.error('Erro ao atualizar número de refeições:', error);
      alert('❌ Erro ao personalizar dieta. Tente novamente.');
    } finally {
      setIsUpdatingMealCount(false);
    }
  };

  // Função para processar chat da IA Coach (dúvidas sobre suplementos, hormônios, etc)
  const processAiChat = async () => {
    if (!aiChatMessage.trim() || !currentUser) return;

    // Verificar se usuário tem assinatura premium
    if (currentUser.subscription?.plan !== 'premium') {
      alert('Vire um usuário premium para usar esse recurso');
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
      } else if (message.includes('oxandrolona') || message.includes('stanozolol') || message.includes('anabolizante') || message.includes('esteroide')) {
        if (message.includes('oxandrolona') && message.includes('stanozolol')) {
          responseContent = `**Comparação Oxandrolona vs Stanozolol:**\n\n**Oxandrolona (Anavar):**\n- Considerada mais "leve" entre os esteroides\n- Dosagem típica: 20-30mg/dia para homens, 5-10mg/dia para mulheres\n- Menos hepatotóxica que o Stanozolol\n- Efeitos: ganho de massa magra, queima de gordura\n- Meia-vida: 8-12 horas\n\n**Stanozolol (Winstrol):**\n- Esteroide mais potente e hepatotóxico\n- Dosagem típica: 30-50mg/dia via oral, 50mg a cada 2 dias injetável\n- Muito eficaz para definição muscular\n- Efeitos colaterais mais severos\n- Meia-vida: 8-9 horas (oral)\n\n**Qual é "melhor":** Oxandrolona para iniciantes devido menor toxicidade. Stanozolol para cutting/definição avançada.`;
        } else if (message.includes('oxandrolona')) {
          responseContent = `**Oxandrolona (Anavar) - Informações Técnicas:**\n\n**Dosagem típica:**\n- Homens: 20-30mg/dia\n- Mulheres: 5-10mg/dia\n\n**Como tomar:**\n- Dividir dose diária em 2 tomadas (meia-vida 8-12h)\n- Preferencialmente com alimentação\n- Ciclo típico: 6-8 semanas\n\n**Características:**\n- Menos hepatotóxica que outros orais\n- Boa para recomposição corporal\n- Efeitos androgênicos baixos`;  
        } else if (message.includes('stanozolol')) {
          responseContent = `**Stanozolol (Winstrol) - Informações Técnicas:**\n\n**Dosagem típica:**\n- Oral: 30-50mg/dia\n- Injetável: 50mg a cada 2 dias\n\n**Como tomar:**\n- Oral: dividir em 2-3 doses/dia\n- Injetável: aplicar em dias alternados\n- Ciclo típico: 6-8 semanas\n\n**Características:**\n- Muito hepatotóxico (oral)\n- Excelente para definição muscular\n- Reduz SHBG (aumenta testosterona livre)`;
        } else {
          responseContent = `**Sobre Esteroides Anabolizantes:**\nSão drogas derivadas da testosterona com efeitos anabólicos (construção muscular) e androgênicos (características masculinas). Uso controlado requer acompanhamento médico rigoroso devido aos riscos: problemas hepáticos, cardiovasculares, hormonais, psicológicos.`;
        }
      } else if (message.includes('ciclo') || message.includes('tpc') || message.includes('post-ciclo')) {
        responseContent = `**Sobre Ciclos e TPC:**\nCiclos de esteroides requerem acompanhamento médico rigoroso. TPC (Terapia Pós-Ciclo) é fundamental para recuperar produção hormonal natural. Sem supervisão médica, riscos incluem: infertilidade, ginecomastia, depressão, problemas cardiovasculares. Priorize métodos naturais: treino consistente, alimentação balanceada, suplementação básica (creatina, whey).`;
      } else if (message.includes('gh') || message.includes('hormônio do crescimento') || message.includes('hormonio do crescimento')) {
        responseContent = `**Sobre Hormônio do Crescimento (GH):**\nUso apenas com prescrição médica para deficiências comprovadas. Efeitos colaterais: diabetes, problemas articulares, crescimento excessivo de órgãos. Para otimizar GH natural: sono adequado (7-9h), exercícios intensos, jejum intermitente, redução do açúcar. Suplementos naturais: arginina, glicina, GABA podem ajudar marginalmente.`;
      } else {
        // Responder QUALQUER pergunta sobre hormônios com informações específicas
        if (message.includes('durateston') || message.includes('enantato') || message.includes('cipionato') || message.includes('propionato') || message.includes('undecanoato')) {
          if (message.includes('durateston') && (message.includes('enantato') || message.includes('diferença'))) {
            responseContent = `**Durateston vs Enantato de Testosterona:**\n\n**Durateston (Mistura de Ésteres):**\n- 4 ésteres diferentes: Propionato, Fenilpropionato, Isocaproato, Decanoato\n- Liberação rápida inicial + sustentada\n- Aplicação: 1x por semana ou a cada 10 dias\n- Dosagem típica: 250-500mg/semana\n- Pico rápido nas primeiras 24-48h\n\n**Enantato de Testosterona:**\n- Éster único de ação prolongada\n- Liberação mais linear e previsível\n- Aplicação: 2x por semana (mais estável)\n- Dosagem típica: 250-500mg/semana\n- Meia-vida: 7-10 dias\n\n**Qual é melhor:** Enantato é mais previsível para controle de níveis hormonais. Durateston pode causar mais oscilações.`;
          } else if (message.includes('durateston')) {
            responseContent = `**Durateston - Informações Detalhadas:**\n\n**Composição:**\n- Propionato 30mg (ação rápida)\n- Fenilpropionato 60mg (ação média)\n- Isocaproato 60mg (ação média-longa)\n- Decanoato 100mg (ação prolongada)\n\n**Protocolo de Uso:**\n- Dose iniciante: 250mg/semana\n- Dose intermediária: 500mg/semana\n- Frequência: 1x/semana ou a cada 10 dias\n- Via: Intramuscular profunda\n\n**Características:**\n- Início de ação: 24-48h\n- Pico sérico: 3-7 dias\n- Duração: 2-3 semanas`;
          } else if (message.includes('enantato')) {
            responseContent = `**Enantato de Testosterona - Informações Detalhadas:**\n\n**Características Farmacológicas:**\n- Éster de cadeia longa\n- Meia-vida: 7-10 dias\n- Liberação constante e previsível\n- Menos oscilações hormonais\n\n**Protocolo de Uso:**\n- Dose iniciante: 250mg/semana\n- Dose intermediária: 500mg/semana\n- Frequência: 2x/semana (mais estável)\n- Exemplo: 250mg segunda + 250mg quinta\n\n**Vantagens:**\n- Mais fácil controlar níveis séricos\n- Menos efeitos colaterais por oscilação\n- Melhor para TRT (reposição)`;
          }
        } else if (message.includes('masteron') || message.includes('drostanolona') || message.includes('propionato de drostanolona')) {
          responseContent = `**Masteron (Drostanolona) - Informações Técnicas:**\n\n**Características:**\n- Derivado da DHT (di-hidrotestosterona)\n- Propriedades anti-estrogênicas\n- Excelente para definição muscular\n- Não aromatiza (não vira estrogênio)\n\n**Dosagem e Uso:**\n- Propionato: 100mg a cada 2 dias\n- Enantato: 200mg 2x/semana\n- Ciclo típico: 6-8 semanas\n- Melhor em cutting (definição)\n\n**Efeitos:**\n- Define músculos (aspecto 'seco')\n- Reduz retenção hídrica\n- Melhora vascularização\n- Aumenta dureza muscular`;
        } else if (message.includes('trenbolona') || message.includes('tren') || message.includes('acetato de trenbolona')) {
          responseContent = `**Trenbolona - Informações Técnicas:**\n\n**Características:**\n- Esteroide extremamente potente\n- 5x mais anabólico que testosterona\n- Não aromatiza\n- Efeitos colaterais severos\n\n**Variações:**\n- Acetato: 75-100mg/dia\n- Enantato: 200-400mg/semana\n- Hexaidrobenzilcarbonato: 200mg/semana\n\n**Efeitos:**\n- Ganho rápido de massa\n- Queima de gordura simultânea\n- Força extrema\n- Vascularização intensa\n\n**Riscos:**\n- Insônia severa\n- Suor noturno\n- Agressividade\n- Problemas cardiovasculares`;
        } else if (message.includes('dianabol') || message.includes('metandrostenolona') || message.includes('dbol')) {
          responseContent = `**Dianabol (Metandrostenolona) - Informações Técnicas:**\n\n**Características:**\n- Esteroide oral clássico\n- Ganho rápido de massa e força\n- Aromatiza facilmente\n- Hepatotóxico\n\n**Dosagem:**\n- Iniciante: 20-30mg/dia\n- Intermediário: 30-50mg/dia\n- Dividir em 2-3 doses/dia\n- Ciclo: 4-6 semanas máximo\n\n**Efeitos:**\n- Ganho rápido de peso (água+músculo)\n- Aumento significativo de força\n- Bombeamento muscular intenso\n- Retenção hídrica\n\n**Precauções:**\n- Usar hepatoprotetores\n- Controlar pressão arterial\n- Anti-estrogênicos necessários`;
        } else if (message.includes('boldenona') || message.includes('equipoise') || message.includes('undecilenoato')) {
          responseContent = `**Boldenona (Equipoise) - Informações Técnicas:**\n\n**Características:**\n- Derivado da testosterona modificado\n- Ação muito prolongada\n- Meia-vida: 14 dias\n- Efeitos colaterais moderados\n\n**Dosagem:**\n- Homens: 400-800mg/semana\n- Mulheres: 50-100mg/semana\n- Aplicação: 2x/semana\n- Ciclo: 12-16 semanas\n\n**Efeitos:**\n- Ganho lento mas qualitativo\n- Aumento do apetite\n- Melhora da vascularização\n- Ganhos mais 'limpos'\n\n**Vantagens:**\n- Poucos efeitos colaterais\n- Não hepatotóxico\n- Bom para iniciantes`;
        } else if (message.includes('primobolan') || message.includes('metenolona') || message.includes('primo')) {
          responseContent = `**Primobolan (Metenolona) - Informações Técnicas:**\n\n**Características:**\n- Esteroide muito seguro\n- Derivado da DHT\n- Não aromatiza\n- Mínimos efeitos colaterais\n\n**Variações:**\n- Oral (acetato): 50-100mg/dia\n- Injetável (enantato): 400-600mg/semana\n- Oral tem baixa biodisponibilidade\n\n**Efeitos:**\n- Ganhos lentos mas duradouros\n- Preserva massa em cutting\n- Define músculos\n- Queima gordura moderadamente\n\n**Ideal para:**\n- Mulheres (muito seguro)\n- Primeira experiência\n- Cutting/definição\n- Recomposição corporal`;
        } else if (message.includes('anadrol') || message.includes('oximetolona') || message.includes('hemogenin')) {
          responseContent = `**Anadrol (Oximetolona) - Informações Técnicas:**\n\n**Características:**\n- Esteroide oral extremamente potente\n- Ganhos muito rápidos\n- Altamente hepatotóxico\n- Retenção hídrica intensa\n\n**Dosagem:**\n- Iniciante: 25-50mg/dia\n- Avançado: 50-100mg/dia\n- Ciclo: 4-6 semanas máximo\n- Tomar pela manhã\n\n**Efeitos:**\n- Ganho de 5-10kg em 4 semanas\n- Força explosiva\n- Bombeamento extremo\n- Melhora da recuperação\n\n**Riscos:**\n- Hepatotoxicidade severa\n- Pressão arterial elevada\n- Ginecomastia (paradoxal)\n- Supressão hormonal intensa`;
        } else if (message.includes('deca') || message.includes('decanoato') || message.includes('nandrolona')) {
          responseContent = `**Deca-Durabolin (Nandrolona) - Informações Técnicas:**\n\n**Características:**\n- Ação muito prolongada\n- Meia-vida: 12-15 dias\n- Excelente para massa\n- Beneficia articulações\n\n**Dosagem:**\n- Iniciante: 200-300mg/semana\n- Intermediário: 400-500mg/semana\n- Aplicação: 1x/semana\n- Ciclo: 10-12 semanas\n\n**Efeitos:**\n- Ganho sólido de massa\n- Melhora dores articulares\n- Aumento da força\n- Recuperação excelente\n\n**Características únicas:**\n- Lubrifica articulações\n- Boa retenção de nitrogênio\n- Poucos efeitos androgênicos\n- TPC mais complexa`;
        } else if (message.includes('sustanon') || message.includes('testosterona mistura')) {
          responseContent = `**Sustanon - Informações Técnicas:**\n\n**Composição (por ampola 250mg):**\n- Propionato: 30mg\n- Fenilpropionato: 60mg\n- Isocaproato: 60mg\n- Decanoato: 100mg\n\n**Características:**\n- Liberação em 4 fases\n- Ação rápida + prolongada\n- Pico em 24-48h\n- Duração: 2-3 semanas\n\n**Protocolo:**\n- Dose: 250-750mg/semana\n- Frequência: 1x/semana ou a cada 10 dias\n- Ciclo: 8-12 semanas\n\n**Vantagens:**\n- Menos aplicações\n- Efeito rápido\n- Conveniente para iniciantes\n\n**Desvantagens:**\n- Oscilações hormonais\n- Controle menos preciso`;
        } else if (message.includes('clembuterol') || message.includes('clenbuterol') || message.includes('clen')) {
          responseContent = `**Clembuterol - Informações Técnicas:**\n\n**Características:**\n- Broncodilatador com efeito termogênico\n- Não é esteroide anabolizante\n- Estimula receptores beta-2\n- Usado para cutting\n\n**Protocolo típico:**\n- Dose inicial: 20mcg/dia\n- Aumento gradual: +20mcg a cada 2-3 dias\n- Dose máxima: 120-140mcg/dia\n- Ciclo: 2 semanas on, 2 semanas off\n\n**Efeitos:**\n- Queima de gordura acelerada\n- Preservação de massa muscular\n- Aumento da temperatura corporal\n- Supressão do apetite\n\n**Efeitos colaterais:**\n- Tremores nas mãos\n- Insônia\n- Sudorese\n- Taquicardia\n- Câimbras`;
        } else {
          // Para qualquer outra pergunta sobre hormônios/suplementos não mapeada
          responseContent = `**Informações Educacionais sobre sua Pergunta:**\n\nComo fonte de conhecimento técnico para fins educacionais, posso fornecer informações baseadas em literatura científica disponível sobre praticamente qualquer composto, protocolo ou substância relacionada ao fitness e bodybuilding.\n\n**Sua pergunta específica requer uma resposta mais detalhada.** Por favor, reformule sua pergunta sendo mais específico sobre:\n\n- Qual substância exata você quer saber\n- Que tipo de informação busca (dosagem, efeitos, comparações, etc.)\n- Se quer saber sobre protocolos, ciclos, ou apenas características\n\n**Exemplos de perguntas que posso responder:**\n• "Qual a diferença entre X e Y?"\n• "Como funciona o composto Z?"\n• "Qual a dosagem típica de W?"\n• "Quais os efeitos colaterais de K?"\n\nTenho conhecimento sobre praticamente todos os compostos do universo fitness/bodybuilding.`;
        }
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

    // Verificar se precisa resetar contadores mensais
    let userToCheck = currentUser;
    if (shouldResetMonthlyUsage(currentUser)) {
      userToCheck = resetMonthlyUsage(currentUser);
      updateCurrentUser(userToCheck);
      updateUser(currentUser.id, userToCheck);
    }

    // Verificar se usuário tem assinatura ativa
    if (!hasActiveSubscription(userToCheck)) {
      setSubscriptionFeature('Análise corporal com IA');
      setShowSubscriptionPlans(true);
      return;
    }

    // Verificar se pode usar análise corporal
    if (!canUseBodyAnalysis(userToCheck)) {
      const limits = getSubscriptionLimits(userToCheck);
      const usage = getUsageStatus(userToCheck);
      alert(`📊 Limite atingido! Seu plano ${userToCheck.subscription?.plan.toUpperCase()} permite ${limits.bodyAnalysesPerMonth} análise${limits.bodyAnalysesPerMonth > 1 ? 's' : ''} corporal${limits.bodyAnalysesPerMonth > 1 ? 'is' : ''} por mês. Você já usou ${usage.bodyAnalysesUsed}/${limits.bodyAnalysesPerMonth}. Seu plano só fornece ${limits.bodyAnalysesPerMonth} atualização${limits.bodyAnalysesPerMonth > 1 ? 'ões' : ''} por mês. Para uma nova atualização, espere o pagamento da próxima mensalidade.`);
      setSubscriptionFeature('Nova análise corporal - limite mensal atingido');
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
      
      // Incrementar uso de análises corporais
      const updatedUser = incrementBodyAnalysisUsage(userToCheck);
      updateCurrentUser(updatedUser);
      updateUser(currentUser.id, updatedUser);
      
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

    // Verificar se precisa resetar contadores mensais
    let userToCheck = currentUser;
    if (shouldResetMonthlyUsage(currentUser)) {
      userToCheck = resetMonthlyUsage(currentUser);
      updateCurrentUser(userToCheck);
      updateUser(currentUser.id, userToCheck);
    }

    // Verificar se usuário tem assinatura ativa
    if (!hasActiveSubscription(userToCheck)) {
      setSubscriptionFeature('Gerar planos de dieta e treino com IA');
      setShowSubscriptionPlans(true);
      return;
    }

    // Verificar limites específicos
    const limits = getSubscriptionLimits(userToCheck);
    const usage = getUsageStatus(userToCheck);
    const canGenerateDiet = canUseDiet(userToCheck);
    const canGenerateWorkout = canUseWorkout(userToCheck);
    const hasPhotos = photos.front || photos.back || photos.left || photos.right;
    const canAnalyze = hasPhotos ? canUseBodyAnalysis(userToCheck) : true;

    // Verificar se pode executar as ações solicitadas
    if (!canGenerateDiet) {
      alert(`📝 Limite de dietas atingido! Seu plano ${userToCheck.subscription?.plan.toUpperCase()} permite ${limits.dietsPerMonth} dieta${limits.dietsPerMonth > 1 ? 's' : ''} por mês. Você já usou ${usage.dietsUsed}/${limits.dietsPerMonth}. Seu plano só fornece ${limits.dietsPerMonth} atualização${limits.dietsPerMonth > 1 ? 'ões' : ''} por mês. Para uma nova atualização, espere o pagamento da próxima mensalidade.`);
      setSubscriptionFeature('Gerar nova dieta - limite mensal atingido');
      setShowSubscriptionPlans(true);
      return;
    }

    if (!canGenerateWorkout) {
      alert(`🏋️‍♂️ Limite de treinos atingido! Seu plano ${userToCheck.subscription?.plan.toUpperCase()} permite ${limits.workoutsPerMonth} treino${limits.workoutsPerMonth > 1 ? 's' : ''} por mês. Você já usou ${usage.workoutsUsed}/${limits.workoutsPerMonth}. Seu plano só fornece ${limits.workoutsPerMonth} atualização${limits.workoutsPerMonth > 1 ? 'ões' : ''} por mês. Para uma nova atualização, espere o pagamento da próxima mensalidade.`);
      setSubscriptionFeature('Gerar novo treino - limite mensal atingido');
      setShowSubscriptionPlans(true);
      return;
    }

    if (hasPhotos && !canAnalyze) {
      alert(`📊 Limite de análises atingido! Seu plano ${userToCheck.subscription?.plan.toUpperCase()} permite ${limits.bodyAnalysesPerMonth} análise${limits.bodyAnalysesPerMonth > 1 ? 's' : ''} corporal${limits.bodyAnalysesPerMonth > 1 ? 'is' : ''} por mês. Você já usou ${usage.bodyAnalysesUsed}/${limits.bodyAnalysesPerMonth}. Seu plano só fornece ${limits.bodyAnalysesPerMonth} atualização${limits.bodyAnalysesPerMonth > 1 ? 'ões' : ''} por mês. Para uma nova atualização, espere o pagamento da próxima mensalidade.`);
      setSubscriptionFeature('Nova análise corporal - limite mensal atingido');
      setShowSubscriptionPlans(true);
      return;
    }

    setIsGenerating(true);
    
    try {
      let updatedUser = userToCheck;
      
      // Gerar plano de dieta
      const allFoods = currentMeals.flatMap(meal => meal.foods);
      const dietPlan = await generateDietPlan(currentUser.profile, allFoods);
      addDietPlan({
        ...dietPlan,
        userId: currentUser.id
      });
      
      // Incrementar uso de dietas
      updatedUser = incrementDietUsage(updatedUser);

      // Gerar plano de treino
      const workoutPlan = await generateWorkoutPlan(currentUser.profile, currentUser.profile.preferredMuscleGroups);
      addWorkoutPlan({
        ...workoutPlan,
        userId: currentUser.id
      });
      
      // Incrementar uso de treinos
      updatedUser = incrementWorkoutUsage(updatedUser);

      // Análise corporal com fotos
      if (hasPhotos) {
        try {
          console.log('Iniciando análise corporal...');
          const analysisResult = await analyzeBodyPhotos(photos);
          const bodyAnalysis = {
            userId: currentUser.id,
            photos,
            analysis: analysisResult
          };
          addBodyAnalysis(bodyAnalysis);
          
          // Incrementar uso de análises corporais
          updatedUser = incrementBodyAnalysisUsage(updatedUser);
          
          console.log('Análise corporal concluída:', analysisResult);
        } catch (error) {
          console.error('Erro na análise corporal:', error);
        }
      }
      
      // Atualizar usuário com novos contadores
      updateCurrentUser(updatedUser);
      updateUser(currentUser.id, updatedUser);

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

  // Função para visualizar logs de usuário específico
  const handleViewUserLogs = (userId: string, userName: string) => {
    setSelectedUserForLogs({ id: userId, name: userName });
    setAdminActiveTab('logs');
    
    // Log da ação administrativa
    if (currentUser?.isAdmin) {
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        action: 'ADMIN_VIEW_USER_LOGS',
        details: `Admin visualizou logs do usuário: ${userName} (${userId})`,
        status: 'success',
        metadata: { targetUserId: userId, targetUserName: userName },
        ip: ''
      });
    }
  };

  // Função para fazer upgrade de usuário
  const handleUpgradeUser = async (userId: string, currentPlan: string) => {
    try {
      // Validação de permissão administrativa
      if (!currentUser?.isAdmin) {
        alert('❌ Acesso negado. Apenas administradores podem fazer upgrade de usuários.');
        return;
      }
      
      // Determinar próximo plano
      let nextPlan: 'starter' | 'standard' | 'premium' = 'premium';
      let featureText = 'Upgrade de plano';
      
      if (currentPlan === 'starter') {
        nextPlan = 'standard';
        featureText = 'Upgrade para Standard - Mais dietas e treinos por mês + Chat IA';
      } else if (currentPlan === 'standard') {
        nextPlan = 'premium';
        featureText = 'Upgrade para Premium - Acesso ilimitado a todas funcionalidades';
      } else {
        alert('ℹ️ Usuário já possui o plano máximo disponível.');
        return;
      }
      
      // Confirmar ação com o administrador
      const confirmUpgrade = confirm(
        `🔄 Confirmar upgrade do usuário para plano ${nextPlan.toUpperCase()}?\n\n` +
        `Plano atual: ${currentPlan}\n` +
        `Novo plano: ${nextPlan}\n\n` +
        `Esta ação abrirá a tela de assinatura para processar o upgrade.`
      );
      
      if (!confirmUpgrade) {
        return;
      }
      
      // Abrir tela de assinatura com contexto de upgrade administrativo
      setSelectedPlan(nextPlan);
      setSubscriptionFeature(`[ADMIN UPGRADE] ${featureText}`);
      setShowSubscriptionPlans(true);
      
      // Log da ação de upgrade iniciada
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        action: 'ADMIN_UPGRADE_INITIATED',
        details: `Admin iniciou upgrade de usuário do plano ${currentPlan} para ${nextPlan}`,
        status: 'success',
        metadata: { targetUserId: userId, fromPlan: currentPlan, toPlan: nextPlan },
        ip: ''
      });
      
      // Notificar sucesso da iniciação
      alert(`✅ Processo de upgrade iniciado!\n\nUsuário será atualizado para o plano ${nextPlan} após confirmação.`);
      
    } catch (error) {
      console.error('❌ Erro ao processar upgrade:', error);
      alert('❌ Erro ao processar upgrade. Tente novamente.');
      
      // Log do erro
      if (currentUser?.isAdmin) {
        logActivity({
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          action: 'ADMIN_UPGRADE_FAILED',
          details: `Erro ao processar upgrade: ${error}`,
          status: 'error',
          metadata: { targetUserId: userId, currentPlan, error: String(error) },
          ip: ''
        });
      }
    }
  };

  // Função para limpar filtro de usuário nos logs
  const handleClearUserFilter = () => {
    setSelectedUserForLogs(null);
    
    // Log opcional da ação de limpar filtro
    if (currentUser?.isAdmin) {
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        action: 'ADMIN_CLEAR_USER_FILTER',
        details: 'Admin limpou filtro de usuário nos logs',
        status: 'success',
        metadata: {},
        ip: ''
      });
    }
  };

  // Função para salvar dados de perfil/billing - SEGURA
  const handleProfileSave = (updatedUser: any) => {
    if (!currentUser) return;
    
    try {
      // SECURITY: Atualizar apenas com dados seguros
      updateCurrentUser(updatedUser);
      updateUser(currentUser.id, updatedUser);
      
      console.log('✅ Perfil atualizado com segurança:', {
        userId: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        hasBilling: !!updatedUser.billing,
        billingComplete: !!updatedUser.billing?.street
      });
      
      // Fechar modal
      setShowProfileEditModal(false);
      
    } catch (error) {
      console.error('❌ Erro ao salvar perfil:', error);
      alert('Erro ao salvar dados. Tente novamente.');
    }
  };

  if (!currentUser) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-x-hidden" style={{ paddingTop: 'max(env(safe-area-inset-top), 3rem)', paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}>
      <div className="max-w-7xl mx-auto px-4 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProfileEditModal(true)}
              className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center touch-target hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="Clique para editar seus dados pessoais e billing"
            >
              {currentUser.profile?.profilePhoto ? (
                <img 
                  src={currentUser.profile.profilePhoto} 
                  alt="Foto de perfil - Clique para editar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                Olá, {currentUser.name}!
                <Edit 
                  className="w-4 h-4 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors" 
                  onClick={() => setShowProfileEditModal(true)}
                />
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Bem-vindo(a) à sua IA Fitness Pessoal</p>
            </div>
          </div>
          <Button 
            onClick={() => {
              console.log('🚪 Fazendo logout...');
              logout();
              // Forçar redirecionamento imediato
              setTimeout(() => {
                window.location.href = '/';
              }, 100);
            }}
            variant="outline"
            className="flex items-center gap-2 touch-target text-sm sm:text-base"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        {/* Subscription Status Card */}
        {hasActiveSubscription(currentUser) && (() => {
          // Verificar se precisa resetar antes de mostrar status
          let userToShow = currentUser;
          if (shouldResetMonthlyUsage(currentUser)) {
            userToShow = resetMonthlyUsage(currentUser);
            // Atualizar silenciosamente em background
            setTimeout(() => {
              updateCurrentUser(userToShow);
              updateUser(currentUser.id, userToShow);
            }, 100);
          }
          const limits = getSubscriptionLimits(userToShow);
          const usage = getUsageStatus(userToShow);
          return (
            <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={userToShow.subscription?.plan === 'premium' ? 'default' : 'secondary'}
                      className={`px-3 py-1 font-semibold ${
                        userToShow.subscription?.plan === 'premium' 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                          : userToShow.subscription?.plan === 'standard'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {userToShow.subscription?.plan?.toUpperCase()}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Seu Plano Atual</p>
                      <p className="text-xs text-gray-600">
                        {userToShow.subscription?.plan === 'premium' && 'Acesso completo + IA'}
                        {userToShow.subscription?.plan === 'standard' && 'Recursos avançados'}
                        {userToShow.subscription?.plan === 'starter' && 'Recursos básicos'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 sm:gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Utensils className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-medium text-gray-700">Dietas</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        {usage.dietsUsed}/{limits.dietsPerMonth === Infinity ? '∞' : limits.dietsPerMonth}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: limits.dietsPerMonth === Infinity 
                              ? '0%' 
                              : `${Math.min(100, (usage.dietsUsed / limits.dietsPerMonth) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Dumbbell className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-gray-700">Treinos</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        {usage.workoutsUsed}/{limits.workoutsPerMonth}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (usage.workoutsUsed / limits.workoutsPerMonth) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Camera className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-gray-700">Análises</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        {usage.bodyAnalysesUsed}/{limits.bodyAnalysesPerMonth}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (usage.bodyAnalysesUsed / limits.bodyAnalysesPerMonth) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {(usage.dietsUsed >= limits.dietsPerMonth || 
                  usage.workoutsUsed >= limits.workoutsPerMonth || 
                  usage.bodyAnalysesUsed >= limits.bodyAnalysesPerMonth) && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          Alguns limites foram atingidos
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Seu plano só fornece um número limitado de atualizações por mês. 
                          Para novas atualizações, espere o pagamento da próxima mensalidade ou faça upgrade.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowSubscriptionPlans(true)}
                          className="mt-2 text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
                        >
                          Fazer Upgrade
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="w-full">
            <TabsList className={`grid ${currentUser?.isAdmin ? 'grid-cols-6' : 'grid-cols-5'} gap-1 p-1 w-full overflow-x-hidden max-w-full`}>
            <TabsTrigger value="profile" className="flex items-center justify-center touch-target px-3 py-3">
              <User className="w-5 h-5" />
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center justify-center touch-target px-3 py-3">
              <Activity className="w-5 h-5" />
            </TabsTrigger>
            <TabsTrigger value="workout" className="flex items-center justify-center touch-target px-3 py-3">
              <Dumbbell className="w-5 h-5" />
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center justify-center touch-target px-3 py-3">
              <Target className="w-5 h-5" />
            </TabsTrigger>
              <TabsTrigger value="ai-chat" className="flex items-center justify-center touch-target px-3 py-3">
                <Heart className="w-5 h-5" />
              </TabsTrigger>
              {currentUser?.isAdmin && (
                <TabsTrigger value="admin" className="flex items-center justify-center touch-target px-3 py-3">
                  <Shield className="w-5 h-5" />
                </TabsTrigger>
              )}
          </TabsList>
          </div>

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

                  <Button type="submit" className="w-full touch-target">
                    Salvar Perfil
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                        <Button onClick={() => handleDietQuestion(true)} variant="outline" className="w-auto px-6 min-w-44">
                          Sim, sigo uma dieta
                        </Button>
                        <Button onClick={() => handleDietQuestion(false)} variant="outline" className="w-auto px-6 min-w-44">
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
                            <Label htmlFor="meal-time">Horário (24h)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={newMeal.time.split(':')[0] || ''}
                                onChange={(e) => {
                                  const hour = e.target.value;
                                  const minute = newMeal.time.split(':')[1] || '00';
                                  const timeValue = `${hour}:${minute}`;
                                  console.log('✅ Hora selecionada:', hour);
                                  setNewMeal(prev => ({ 
                                    ...prev, 
                                    time: timeValue 
                                  }));
                                }}
                                required
                              >
                                <option value="">Hora</option>
                                {Array.from({ length: 24 }, (_, i) => {
                                  const hour = i.toString().padStart(2, '0');
                                  return <option key={hour} value={hour}>{hour}</option>;
                                })}
                              </select>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={newMeal.time.split(':')[1] || ''}
                                onChange={(e) => {
                                  const minute = e.target.value;
                                  const hour = newMeal.time.split(':')[0] || '00';
                                  const timeValue = `${hour}:${minute}`;
                                  console.log('✅ Minuto selecionado:', minute);
                                  setNewMeal(prev => ({ 
                                    ...prev, 
                                    time: timeValue 
                                  }));
                                }}
                                required
                              >
                                <option value="">Min</option>
                                {Array.from({ length: 12 }, (_, i) => {
                                  const minute = (i * 5).toString().padStart(2, '0');
                                  return <option key={minute} value={minute}>{minute}</option>;
                                })}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Adicionar alimentos à refeição */}
                        <div className="space-y-3">
                          <Label>Alimentos</Label>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                placeholder="Alimento"
                                value={newFood.food}
                                onChange={(e) => setNewFood(prev => ({ ...prev, food: e.target.value }))}
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
                                  <SelectItem value="colher-sopa">col. sopa</SelectItem>
                                  <SelectItem value="colher-cha">col. chá</SelectItem>
                                  <SelectItem value="xicara">xícara</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Quantidade"
                                value={newFood.quantity}
                                onChange={(e) => setNewFood(prev => ({ ...prev, quantity: e.target.value }))}
                                className="flex-1"
                              />
                            </div>
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

                        <Button onClick={addMealToList} className="w-full touch-target">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

                        <Button onClick={saveCompleteWorkout} className="w-full touch-target">
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
                <div className="overflow-x-auto no-scrollbar ios-scroll">
                <TabsList className="overflow-x-auto whitespace-nowrap no-scrollbar flex w-max min-w-full lg:w-auto lg:grid lg:grid-cols-3 gap-1 p-1">
                  <TabsTrigger value="diet" className="touch-target whitespace-nowrap px-3 sm:px-4 text-sm">Dieta</TabsTrigger>
                  <TabsTrigger value="workout" className="touch-target whitespace-nowrap px-3 sm:px-4 text-sm">Treino</TabsTrigger>
                  <TabsTrigger value="analysis" className="touch-target whitespace-nowrap px-3 sm:px-4 text-sm">Análise</TabsTrigger>
                </TabsList>
                </div>

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
                            Selecione a refeição que deseja modificar e descreva suas preferências. A IA calculará as porções adequadas para suas metas nutricionais.
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

                          {/* Nova Interface de Edição com Dropdown */}
                          <div className="space-y-3">
                            {/* Dropdown de Seleção de Refeição */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Selecione a refeição que deseja editar:</label>
                              <Select value={selectedMealToEdit} onValueChange={setSelectedMealToEdit}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Escolha uma refeição..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {currentDietPlan?.meals?.map((meal: any) => (
                                    <SelectItem key={meal.meal} value={meal.meal}>
                                      {meal.meal}
                                    </SelectItem>
                                  )) || [
                                    <SelectItem key="cafe" value="Café da Manhã">Café da Manhã</SelectItem>,
                                    <SelectItem key="lanche1" value="Lanche da Manhã">Lanche da Manhã</SelectItem>,
                                    <SelectItem key="almoco" value="Almoço">Almoço</SelectItem>,
                                    <SelectItem key="lanche2" value="Lanche da Tarde">Lanche da Tarde</SelectItem>,
                                    <SelectItem key="jantar" value="Jantar">Jantar</SelectItem>,
                                    <SelectItem key="ceia" value="Ceia">Ceia</SelectItem>
                                  ]}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Campo para Descrever Mudanças */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Descreva o que você quer adicionar, trocar ou modificar:</label>
                              <Textarea
                                placeholder="Ex: quero trocar por whey e hipercalórico, ou adicionar uma banana, ou substituir por aveia e leite"
                                value={dietChatMessage}
                                onChange={(e) => setDietChatMessage(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    processDietChat();
                                  }
                                }}
                                className="min-h-20 resize-none"
                                disabled={isProcessingDietChat}
                              />
                            </div>

                            {/* Botão de Ação */}
                            <Button 
                              onClick={processDietChat}
                              disabled={!dietChatMessage.trim() || !selectedMealToEdit || isProcessingDietChat}
                              className="w-full"
                            >
                              {isProcessingDietChat ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  Processando...
                                </>
                              ) : (
                                <>
                                  <Target className="w-4 h-4 mr-2" />
                                  Atualizar Dieta
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Seção de Personalização do Número de Refeições */}
                          <Separator className="my-6" />
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-orange-600" />
                              <h4 className="text-lg font-semibold">Personalizar Número de Refeições</h4>
                            </div>
                            
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                              <div className="flex items-start gap-2">
                                <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                                <div>
                                  <p className="text-sm text-orange-800 font-medium mb-1">
                                    Não tem tempo ou não consegue fazer 6 refeições?
                                  </p>
                                  <p className="text-sm text-orange-700">
                                    Insira quantas refeições você consegue fazer e iremos refazer sua dieta. 
                                    <span className="font-medium">Lembre-se: quanto menos refeições, maiores elas ficam.</span>
                                  </p>
                                  <p className="text-xs text-orange-600 mt-2">
                                    (Você pode não ter tempo de fazer todas as refeições por conta de trabalho ou compromissos, então essa opção é pra te ajudar)
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center gap-3 justify-center">
                                <label className="text-sm font-medium text-gray-700">
                                  Número de refeições por dia:
                                </label>
                                <Select 
                                  value={selectedMealCount.toString()} 
                                  onValueChange={(value) => setSelectedMealCount(parseInt(value))}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1</SelectItem>
                                    <SelectItem value="2">2</SelectItem>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="4">4</SelectItem>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="6">6</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <Button 
                                onClick={() => updateMealCount(selectedMealCount)}
                                disabled={isUpdatingMealCount}
                                className="w-full touch-target"
                              >
                                {isUpdatingMealCount ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Atualizando...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Atualizar Dieta
                                  </>
                                )}
                              </Button>
                            </div>
                            
                            {/* Dica visual sobre as porções */}
                            {selectedMealCount < 4 && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-700">
                                  ℹ️ <span className="font-medium">{selectedMealCount} refeições:</span> Cada refeição terá porções maiores para atingir suas metas nutricionais diárias.
                                </p>
                              </div>
                            )}
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
                <div className="space-y-4">
                  <Label htmlFor="ai-chat-input">Faça sua pergunta para a IA Coach:</Label>
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
                    className="w-full min-h-24"
                    disabled={isProcessingAiChat}
                  />
                  <Button 
                    onClick={processAiChat}
                    disabled={!aiChatMessage.trim() || isProcessingAiChat}
                    className="w-full touch-target"
                  >
                    {isProcessingAiChat ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 mr-2" />
                        Perguntar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tab - Apenas para administradores */}
          {currentUser?.isAdmin && (
            <TabsContent value="admin">
              <Tabs value={adminActiveTab} onValueChange={setAdminActiveTab} className="space-y-6">
                <div className="w-full">
                  <TabsList className="grid grid-cols-2 gap-1 p-1 w-full max-w-md mx-auto">
                    <TabsTrigger value="users" className="flex items-center justify-center touch-target px-4 py-2">
                      <Users className="w-4 h-4 mr-2" />
                      Usuários
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="flex items-center justify-center touch-target px-4 py-2">
                      <FileText className="w-4 h-4 mr-2" />
                      Logs
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="users">
                  <AdminUserManagement 
                    onViewUserLogs={handleViewUserLogs}
                    onUpgradeUser={handleUpgradeUser}
                  />
                </TabsContent>

                <TabsContent value="logs">
                  <AdminActivityLogs 
                    selectedUserId={selectedUserForLogs?.id}
                    selectedUserName={selectedUserForLogs?.name}
                    onClearUserFilter={handleClearUserFilter}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
          )}
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

      {/* Modal de Edição de Perfil/Billing - SEGURO */}
      <ProfileEditModal
        isOpen={showProfileEditModal}
        onClose={() => setShowProfileEditModal(false)}
        user={currentUser}
        onSave={handleProfileSave}
      />
    </div>
  );
}