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
    preferredMuscleGroups: []
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
        const bodyAnalysis = {
          userId: currentUser.id,
          photos,
          analysis: {
            proportions: 'Análise corporal baseada nas fotos fornecidas...',
            strengths: ['Força 1', 'Força 2'],
            improvementAreas: ['Área 1', 'Área 2'],
            recommendations: ['Recomendação 1', 'Recomendação 2']
          }
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
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Olá, {currentUser.name}!
              </h1>
              <p className="text-gray-600">Bem-vindo ao seu dashboard</p>
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
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
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
                        <SelectItem value="sedentario">Sedentário</SelectItem>
                        <SelectItem value="leve">Leve</SelectItem>
                        <SelectItem value="moderado">Moderado</SelectItem>
                        <SelectItem value="intenso">Intenso</SelectItem>
                        <SelectItem value="muito-intenso">Muito Intenso</SelectItem>
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
                              onChange={(e) => setNewMeal(prev => ({ ...prev, time: e.target.value }))}
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
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">{meal.name}</span>
                                  <Badge variant="outline">{meal.time}</Badge>
                                </div>
                                <Button
                                  onClick={() => removeMealFromList(index)}
                                  size="sm"
                                  variant="ghost"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="text-sm text-gray-600">
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