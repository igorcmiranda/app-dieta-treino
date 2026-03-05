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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useCurrentUser, useUsers, useDietPlans, useWorkoutPlans, useBodyAnalyses, useWorkoutProgress } from '@/lib/hooks';
import { UserProfile, FoodEntry, WorkoutProgress, MealEntry, UserSubscription } from '@/lib/types';
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [accountError, setAccountError] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  
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
    foodPreferences: []
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

  useEffect(() => {
    if (!currentUser) return;
    setAccountData(prev => ({
      ...prev,
      name: currentUser.name || '',
      email: currentUser.email || '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    }));
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

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setAccountError('');
    setIsSavingAccount(true);

    try {
      const trimmedName = accountData.name.trim();
      const trimmedEmail = accountData.email.trim().toLowerCase();

      if (!trimmedName || !trimmedEmail) {
        throw new Error('Nome e email são obrigatórios.');
      }

      const updateResponse = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
        }),
      });

      const updatePayload = await updateResponse.json();
      if (!updateResponse.ok) {
        throw new Error(updatePayload?.error || 'Não foi possível atualizar nome e email.');
      }

      if (accountData.newPassword || accountData.currentPassword || accountData.confirmNewPassword) {
        if (!accountData.currentPassword) {
          throw new Error('Informe a senha atual para alterar a senha.');
        }
        if (!accountData.newPassword) {
          throw new Error('Informe a nova senha.');
        }
        if (accountData.newPassword.length < 6) {
          throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
        }
        if (accountData.newPassword !== accountData.confirmNewPassword) {
          throw new Error('A confirmação da nova senha não confere.');
        }

        const changePasswordResponse = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            currentPassword: accountData.currentPassword,
            newPassword: accountData.newPassword,
          }),
        });

        const changePasswordPayload = await changePasswordResponse.json();
        if (!changePasswordResponse.ok) {
          throw new Error(changePasswordPayload?.error || 'Não foi possível alterar a senha.');
        }
      }

      const updatedUser = {
        ...currentUser,
        name: trimmedName,
        email: trimmedEmail,
      };
      updateCurrentUser(updatedUser);
      updateUser(currentUser.id, updatedUser);

      setAccountData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }));
      setShowAccountDialog(false);
      alert('✅ Dados da conta atualizados com sucesso.');
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Erro ao atualizar conta.');
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentUser?.subscription) return;

    const confirmed = window.confirm('Tem certeza que deseja cancelar sua assinatura mensal?');
    if (!confirmed) return;

    setAccountError('');
    setIsCancellingSubscription(true);

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Não foi possível cancelar a assinatura.');
      }

      const updatedSubscription = payload.subscription
        ? {
            ...payload.subscription,
            startDate: new Date(payload.subscription.startDate),
            endDate: new Date(payload.subscription.endDate),
            downgradableDate: payload.subscription.downgradableDate
              ? new Date(payload.subscription.downgradableDate)
              : undefined,
          }
        : {
            ...currentUser.subscription,
            status: 'cancelled' as const,
            endDate: new Date(),
          };

      const updatedUser = {
        ...currentUser,
        subscription: updatedSubscription,
      };
      updateCurrentUser(updatedUser);
      updateUser(currentUser.id, updatedUser);

      alert('✅ Assinatura cancelada com sucesso.');
      setShowAccountDialog(false);
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Erro ao cancelar assinatura.');
    } finally {
      setIsCancellingSubscription(false);
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
    if (!newMeal.name.trim() || !newMeal.time || newMeal.foods.length === 0) {
      alert('Por favor, preencha o nome da refeição, horário e adicione pelo menos um alimento');
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

  // Nova função para analisar PDF/imagem da dieta
  const analyzeDietFromFile = async (file: File) => {
    setIsAnalyzingDiet(true);
    
    try {
      // Simular análise de IA (em produção, seria uma chamada para API de OCR/Vision)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Dados simulados extraídos do arquivo (6 refeições)
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
        },
        {
          name: 'Lanche da tarde',
          time: '16:00',
          foods: [
            { food: 'Iogurte natural', quantity: '170', measurement: 'gramas' },
            { food: 'Aveia', quantity: '20', measurement: 'gramas' }
          ]
        },
        {
          name: 'Jantar',
          time: '19:30',
          foods: [
            { food: 'Tilápia grelhada', quantity: '160', measurement: 'gramas' },
            { food: 'Batata-doce', quantity: '120', measurement: 'gramas' },
            { food: 'Salada verde', quantity: '1', measurement: 'unidade' }
          ]
        },
        {
          name: 'Ceia',
          time: '22:00',
          foods: [
            { food: 'Queijo cottage', quantity: '80', measurement: 'gramas' },
            { food: 'Morangos', quantity: '6', measurement: 'unidade' }
          ]
        }
      ];
      
      // Adicionar as refeições extraídas
      setCurrentMeals(prev => [...prev, ...extractedMeals]);
      
      alert(`✅ Análise concluída! ${extractedMeals.length} refeições foram extraídas e adicionadas. Você pode editar ou remover qualquer item se necessário.`);
      
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

  const extractFocusAreasFromAnalysis = (improvementAreas: string[]): string[] => {
    const normalized = improvementAreas.join(' ').toLowerCase();
    const focusMap = [
      { key: 'peito', aliases: ['peito', 'peitoral'] },
      { key: 'costas', aliases: ['costas', 'dorsal'] },
      { key: 'pernas', aliases: ['pernas', 'coxa', 'gluteo', 'glúteo'] },
      { key: 'bracos', aliases: ['braco', 'braço', 'biceps', 'bíceps', 'triceps', 'tríceps'] },
      { key: 'ombros', aliases: ['ombro', 'deltoide'] }
    ];

    return focusMap
      .filter(item => item.aliases.some(alias => normalized.includes(alias)))
      .map(item => item.key);
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
      const flattenedFoods: FoodEntry[] = currentMeals.flatMap(meal =>
        meal.foods.map(food => ({
          food: food.food,
          quantity: food.quantity,
          measurement: food.measurement,
          time: meal.time
        }))
      );

      let analysisResult: Awaited<ReturnType<typeof analyzeBodyPhotos>> | null = null;
      const hasAnyPhoto = Boolean(photos.front || photos.back || photos.left || photos.right);

      if (hasAnyPhoto) {
        analysisResult = await analyzeBodyPhotos(photos);
      }

      // Gerar plano de dieta
      const dietPlan = await generateDietPlan(currentUser.profile, flattenedFoods);
      addDietPlan({
        ...dietPlan,
        userId: currentUser.id
      });

      // Gerar plano de treino
      const focusAreasFromAnalysis = analysisResult
        ? extractFocusAreasFromAnalysis(analysisResult.improvementAreas)
        : [];
      const workoutPlan = await generateWorkoutPlan(currentUser.profile, focusAreasFromAnalysis);
      addWorkoutPlan({
        ...workoutPlan,
        userId: currentUser.id
      });

      // Análise corporal com fotos
      if (analysisResult && hasAnyPhoto) {
        const bodyAnalysis = {
          userId: currentUser.id,
          photos,
          analysis: analysisResult
        };
        addBodyAnalysis(bodyAnalysis);
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
  const subscriptionPlan = currentUser?.subscription?.plan;
  const planDisplayName = subscriptionPlan === 'starter'
    ? 'Básico'
    : subscriptionPlan === 'standard'
      ? 'Standard'
      : subscriptionPlan === 'premium'
        ? 'Premium'
        : 'Sem plano';
  const headerTheme = subscriptionPlan === 'starter'
    ? {
        container: 'bg-green-100 border-green-200',
        icon: 'from-green-500 to-emerald-600',
        text: 'text-green-800'
      }
    : subscriptionPlan === 'standard'
      ? {
          container: 'bg-blue-100 border-blue-200',
          icon: 'from-blue-500 to-indigo-600',
          text: 'text-blue-800'
        }
      : subscriptionPlan === 'premium'
        ? {
            container: 'bg-purple-100 border-purple-200',
            icon: 'from-purple-500 to-fuchsia-600',
            text: 'text-purple-800'
          }
        : {
            container: 'bg-gray-100 border-gray-200',
            icon: 'from-gray-500 to-gray-600',
            text: 'text-gray-700'
          };

  // Função para lidar com seleção de plano
  const handlePlanSelection = (plan: 'starter' | 'standard' | 'premium') => {
    setSelectedPlan(plan);
    setShowSubscriptionPlans(false);
    setShowPayment(true);
  };

  // Função para lidar com pagamento bem-sucedido
  const handlePaymentSuccess = (subscription: UserSubscription) => {
    if (currentUser && selectedPlan) {
      const normalizedSubscription = {
        ...subscription,
        startDate: new Date(subscription.startDate),
        endDate: new Date(subscription.endDate),
        downgradableDate: subscription.downgradableDate ? new Date(subscription.downgradableDate) : undefined,
      };

      const updatedUser = {
        ...currentUser,
        subscription: normalizedSubscription
      };

      updateCurrentUser(updatedUser);
      updateUser(currentUser.id, updatedUser);
    }

    setShowPayment(false);
    setSelectedPlan(null);
    setSubscriptionFeature('');
    alert('✅ Pagamento realizado com sucesso! Agora você pode usar todas as funcionalidades.');
  };

  if (!currentUser) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-x-hidden">
      {/* Viewport meta tag para mobile nativo */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      
      <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Header - Responsivo */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl border ${headerTheme.container}`}>
          <div className="flex items-center gap-3">
            <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
              <button
                type="button"
                onClick={() => setShowAccountDialog(true)}
                className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${headerTheme.icon} rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400`}
                title="Editar conta"
              >
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Minha conta</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSaveAccount} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-name">Nome</Label>
                    <Input
                      id="account-name"
                      value={accountData.name}
                      onChange={(e) => setAccountData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={isSavingAccount || isCancellingSubscription}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account-email">Email</Label>
                    <Input
                      id="account-email"
                      type="email"
                      value={accountData.email}
                      onChange={(e) => setAccountData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isSavingAccount || isCancellingSubscription}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="current-password">Senha atual</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={accountData.currentPassword}
                      onChange={(e) => setAccountData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Preencha para trocar a senha"
                      disabled={isSavingAccount || isCancellingSubscription}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova senha</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={accountData.newPassword}
                      onChange={(e) => setAccountData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      disabled={isSavingAccount || isCancellingSubscription}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirmar nova senha</Label>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      value={accountData.confirmNewPassword}
                      onChange={(e) => setAccountData(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                      disabled={isSavingAccount || isCancellingSubscription}
                    />
                  </div>

                  {accountError && (
                    <div className="text-sm text-red-600 bg-red-50 rounded-md p-2">
                      {accountError}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAccountDialog(false)}
                      disabled={isSavingAccount || isCancellingSubscription}
                    >
                      Fechar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSavingAccount || isCancellingSubscription}
                    >
                      {isSavingAccount ? 'Salvando...' : 'Salvar dados'}
                    </Button>
                  </div>
                </form>

                {currentUser.subscription?.status === 'active' && (
                  <div className="mt-2 border-t pt-4">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleCancelSubscription}
                      disabled={isSavingAccount || isCancellingSubscription}
                    >
                      {isCancellingSubscription ? 'Cancelando assinatura...' : 'Cancelar assinatura mensal'}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Olá, {currentUser.name}!
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Bem-vindo ao seu dashboard</p>
              <button
                type="button"
                onClick={() => setShowAccountDialog(true)}
                className="text-xs sm:text-sm text-blue-700 hover:text-blue-900 underline mt-1"
              >
                Minha conta
              </button>
              <p className={`text-xs sm:text-sm font-semibold mt-1 ${headerTheme.text}`}>
                Plano: {planDisplayName}
              </p>
            </div>
          </div>
          <Button 
            onClick={logout}
            variant="outline"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        {/* Tabs Navigation - Mobile First */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1">
            <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
              <User className="w-4 h-4" />
              <span>Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
              <Activity className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="workout" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
              <Dumbbell className="w-4 h-4" />
              <span>Treino</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
              <Target className="w-4 h-4" />
              <span>Resultados</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab - Mobile Optimized */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <User className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="age" className="text-sm font-medium">Idade</Label>
                      <Input
                        id="age"
                        type="number"
                        value={profile.age || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender" className="text-sm font-medium">Gênero</Label>
                      <Select 
                        value={profile.gender} 
                        onValueChange={(value) => setProfile(prev => ({ ...prev, gender: value as 'masculino' | 'feminino' }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="height" className="text-sm font-medium">Altura (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={profile.height || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight" className="text-sm font-medium">Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={profile.weight || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="activityLevel" className="text-sm font-medium">Nível de Atividade</Label>
                    <Select 
                      value={profile.activityLevel} 
                      onValueChange={(value) => setProfile(prev => ({ ...prev, activityLevel: value as any }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentario">Sedentário</SelectItem>
                        <SelectItem value="leve">Leve</SelectItem>
                        <SelectItem value="moderado">Moderado</SelectItem>
                        <SelectItem value="intenso">Intenso</SelectItem>
                        <SelectItem value="muito-intenso">Muito Intenso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="goal" className="text-sm font-medium">Objetivo</Label>
                    <Select 
                      value={profile.goal} 
                      onValueChange={(value) => setProfile(prev => ({ ...prev, goal: value as any }))}
                    >
                      <SelectTrigger className="mt-1">
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

                  <Button type="submit" className="w-full">
                    Salvar Perfil
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard Tab - Mobile Optimized */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Alimentação - Mobile First */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Utensils className="w-5 h-5" />
                    Alimentação Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dietStep === 'question' && (
                    <div className="text-center space-y-4">
                      <p className="text-gray-600 text-sm sm:text-base">Você segue alguma dieta específica atualmente?</p>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                        <Button onClick={() => handleDietQuestion(true)} variant="outline" className="w-full sm:w-auto">
                          Sim, sigo uma dieta
                        </Button>
                        <Button onClick={() => handleDietQuestion(false)} variant="outline" className="w-full sm:w-auto">
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
                                <label htmlFor="diet-file" className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm">
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

                          <div className="text-center">
                            <span className="text-sm text-gray-500">ou</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Vamos registrar o que você costuma comer no dia a dia:
                        </p>
                      )}

                      {/* Formulário para adicionar refeições - Mobile Optimized */}
                      <div className="space-y-4 border rounded-lg p-3 sm:p-4 bg-gray-50">
                        <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                          <Plus className="w-4 h-4" />
                          Adicionar Refeição
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="meal-name" className="text-sm">Nome da refeição</Label>
                            <Input
                              id="meal-name"
                              placeholder="Ex: Café da manhã"
                              value={newMeal.name}
                              onChange={(e) => setNewMeal(prev => ({ ...prev, name: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="meal-time" className="text-sm">Horário</Label>
                            <Input
                              id="meal-time"
                              type="time"
                              value={newMeal.time}
                              onChange={(e) => setNewMeal(prev => ({ ...prev, time: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        {/* Adicionar alimentos à refeição - Mobile First */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Alimentos</Label>
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Select 
                                value={newFood.measurement} 
                                onValueChange={(value) => setNewFood(prev => ({ ...prev, measurement: value as FoodEntry['measurement'] }))}
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
                              <Button onClick={addFoodToMeal} size="sm" className="w-full">
                                <Plus className="w-4 h-4 mr-1" />
                                Adicionar
                              </Button>
                            </div>
                          </div>

                          {/* Lista de alimentos da refeição atual */}
                          {newMeal.foods.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Alimentos nesta refeição:</p>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {newMeal.foods.map((food, index) => (
                                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                                    <span className="flex-1 pr-2">
                                      {food.food} - {food.quantity} {food.measurement}
                                    </span>
                                    <Button
                                      onClick={() => removeFoodFromMeal(index)}
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <Button onClick={addMealToList} className="w-full">
                          Adicionar Refeição
                        </Button>
                      </div>

                      {/* Lista de refeições adicionadas - Mobile Optimized */}
                      {currentMeals.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm sm:text-base">Refeições Registradas ({currentMeals.length})</h4>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {currentMeals.map((meal, index) => (
                              <div key={index} className="border rounded-lg p-3 bg-white">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                    <span className="font-medium text-sm truncate">{meal.name}</span>
                                    <Badge variant="outline" className="text-xs">{meal.time}</Badge>
                                  </div>
                                  <Button
                                    onClick={() => removeMealFromList(index)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 flex-shrink-0"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600">
                                  {meal.foods.map((food, foodIndex) => (
                                    <span key={foodIndex}>
                                      {food.food} ({food.quantity} {food.measurement})
                                      {foodIndex < meal.foods.length - 1 ? ', ' : ''}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
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
                        className="w-full sm:w-auto"
                      >
                        Editar refeições
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fotos - Mobile Optimized */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Camera className="w-5 h-5" />
                    Fotos Corporais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {(['front', 'back', 'left', 'right'] as const).map((position) => (
                      <div key={position} className="space-y-2">
                        <Label className="capitalize text-sm">
                          {position === 'front' ? 'Frente' : 
                           position === 'back' ? 'Costas' : 
                           position === 'left' ? 'Lado Esquerdo' : 'Lado Direito'}
                        </Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                          {photos[position] ? (
                            <div className="space-y-2">
                              <img 
                                src={photos[position]} 
                                alt={position}
                                className="w-full h-24 sm:h-32 object-cover rounded"
                              />
                              <Button
                                onClick={() => setPhotos(prev => ({ ...prev, [position]: '' }))}
                                size="sm"
                                variant="outline"
                                className="w-full text-xs"
                              >
                                Remover
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                              <label htmlFor={`photo-${position}`} className="cursor-pointer text-blue-600 hover:text-blue-700 text-xs sm:text-sm">
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
                </CardContent>
              </Card>
            </div>

            {/* Botão para gerar planos - Mobile Optimized */}
            <div className="mt-4 sm:mt-6">
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      <h3 className="text-base sm:text-lg font-semibold">Gerar Planos Personalizados</h3>
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Com base no seu perfil, alimentação atual e fotos, nossa IA criará planos personalizados de dieta e treino.
                    </p>
                    <Button 
                      onClick={generatePlans}
                      disabled={isGenerating || !currentUser?.profile || currentMeals.length === 0}
                      className="w-full"
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
                      <p className="text-xs sm:text-sm text-amber-600">
                        Complete seu perfil e adicione suas refeições para continuar
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Workout Tab - Mobile Optimized */}
          <TabsContent value="workout">
            <div className="space-y-4 sm:space-y-6">
              {currentWorkoutPlan ? (
                <>
                  {/* Seletor de data e treino - Mobile First */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Calendar className="w-5 h-5" />
                        Registrar Treino
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="workout-date" className="text-sm">Data do Treino</Label>
                          <Input
                            id="workout-date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="workout-day" className="text-sm">Treino</Label>
                          <Select value={selectedWorkoutDay} onValueChange={setSelectedWorkoutDay}>
                            <SelectTrigger className="mt-1">
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

                  {/* Progresso do treino - Mobile Optimized */}
                  {workoutProgressData && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Dumbbell className="w-5 h-5" />
                            <span className="text-base sm:text-lg">Treino de {workoutProgressData.workoutDay}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {selectedDate}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 sm:space-y-6">
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {workoutProgressData.exercises.map((exercise, exerciseIndex) => (
                            <div key={exerciseIndex} className="space-y-3 border rounded-lg p-3 sm:p-4">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                <h4 className="font-medium text-sm sm:text-base">{exercise.exerciseName}</h4>
                                <Button
                                  onClick={() => getExerciseVideo(exercise.exerciseName)}
                                  size="sm"
                                  variant="outline"
                                  className="w-full sm:w-auto"
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  Vídeo
                                </Button>
                              </div>
                              
                              <div className="space-y-2">
                                {exercise.sets.map((set, setIndex) => (
                                  <div key={setIndex} className="grid grid-cols-4 gap-2 items-center">
                                    <div className="text-xs sm:text-sm font-medium">
                                      Série {setIndex + 1}
                                    </div>
                                    <div>
                                      <Input
                                        type="number"
                                        placeholder="Peso"
                                        value={set.weight || ''}
                                        onChange={(e) => updateExerciseProgress(
                                          exerciseIndex, 
                                          setIndex, 
                                          'weight', 
                                          parseFloat(e.target.value) || 0
                                        )}
                                        className="text-xs sm:text-sm"
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
                                        className="text-xs sm:text-sm"
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
                        </div>

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
                        <p className="text-gray-600 text-sm sm:text-base">
                          Gere seu plano personalizado na aba Dashboard
                        </p>
                      </div>
                      <Button onClick={() => setActiveTab('dashboard')} className="w-full sm:w-auto">
                        Ir para Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Results Tab - Mobile Optimized */}
          <TabsContent value="results">
            <div className="space-y-4 sm:space-y-6">
              <Tabs value={resultsTab} onValueChange={setResultsTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="diet" className="text-xs sm:text-sm">Dieta</TabsTrigger>
                  <TabsTrigger value="workout" className="text-xs sm:text-sm">Treino</TabsTrigger>
                  <TabsTrigger value="analysis" className="text-xs sm:text-sm">Análise</TabsTrigger>
                </TabsList>

                <TabsContent value="diet">
                  {currentDietPlan ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                          <Utensils className="w-5 h-5" />
                          Seu Plano de Dieta
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                            <div className="text-xl sm:text-2xl font-bold text-blue-600">
                              {currentDietPlan.dailyCalories}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">Calorias/dia</div>
                          </div>
                          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                            <div className="text-xl sm:text-2xl font-bold text-green-600">
                              {currentDietPlan.macros.protein}g
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">Proteína</div>
                          </div>
                          <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                            <div className="text-xl sm:text-2xl font-bold text-orange-600">
                              {currentDietPlan.macros.carbs}g
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">Carboidratos</div>
                          </div>
                        </div>

                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {currentDietPlan.meals.map((meal, index) => (
                            <div key={index} className="border rounded-lg p-3 sm:p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <h4 className="font-medium text-sm sm:text-base">{meal.meal}</h4>
                                <Badge variant="outline" className="text-xs">{meal.time}</Badge>
                              </div>
                              <div className="space-y-2">
                                {meal.foods.map((food, foodIndex) => (
                                  <div key={foodIndex} className="flex justify-between items-center text-xs sm:text-sm">
                                    <span className="flex-1 pr-2">{food.food}</span>
                                    <span className="text-gray-500 flex-shrink-0">
                                      {food.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
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
                            <p className="text-gray-600 text-sm sm:text-base">
                              Gere seu plano personalizado na aba Dashboard
                            </p>
                          </div>
                          <Button onClick={() => setActiveTab('dashboard')} className="w-full sm:w-auto">
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
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                          <Dumbbell className="w-5 h-5" />
                          Seu Plano de Treino
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {currentWorkoutPlan.workouts.map((workout, index) => (
                            <div key={index} className="border rounded-lg p-3 sm:p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Target className="w-4 h-4 text-gray-500" />
                                <h4 className="font-medium text-sm sm:text-base">{workout.day}</h4>
                                <Badge variant="outline" className="text-xs">{workout.muscleGroup}</Badge>
                              </div>
                              <div className="space-y-2">
                                {workout.exercises.map((exercise, exerciseIndex) => (
                                  <div key={exerciseIndex} className="flex justify-between items-center text-xs sm:text-sm">
                                    <span className="flex-1 pr-2">{exercise.name}</span>
                                    <span className="text-gray-500 flex-shrink-0">
                                      {exercise.sets} séries × {exercise.reps} reps
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <Dumbbell className="w-12 h-12 text-gray-400 mx-auto" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Nenhum plano de treino</h3>
                            <p className="text-gray-600 text-sm sm:text-base">
                              Gere seu plano personalizado na aba Dashboard
                            </p>
                          </div>
                          <Button onClick={() => setActiveTab('dashboard')} className="w-full sm:w-auto">
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
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                          <Activity className="w-5 h-5" />
                          Análise Corporal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                          {Object.entries(currentBodyAnalysis.photos).map(([position, photo]) => (
                            photo && (
                              <div key={position} className="space-y-2">
                                <img 
                                  src={photo} 
                                  alt={position}
                                  className="w-full h-24 sm:h-32 object-cover rounded"
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
                            <h4 className="font-medium mb-2 text-sm sm:text-base">Análise</h4>
                            <p className="text-gray-600 text-sm sm:text-base">{currentBodyAnalysis.analysis.proportions}</p>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2 text-sm sm:text-base">Recomendações</h4>
                            <ul className="space-y-1">
                              {currentBodyAnalysis.analysis.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2 text-gray-600 text-sm sm:text-base">
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{rec}</span>
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
                            <p className="text-gray-600 text-sm sm:text-base">
                              Adicione suas fotos e gere sua análise na aba Dashboard
                            </p>
                          </div>
                          <Button onClick={() => setActiveTab('dashboard')} className="w-full sm:w-auto">
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
          onBack={() => {
            setShowPayment(false);
            setShowSubscriptionPlans(true);
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
