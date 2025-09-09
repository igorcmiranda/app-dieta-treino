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
    if (!newFood.food || !newFood.quantity) {
      alert('Por favor, preencha o alimento e a quantidade');
      return;
    }

    setNewMeal(prev => ({
      ...prev,
      foods: [...prev.foods, { ...newFood }]
    }));

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
    if (!newMeal.name || !newMeal.time || newMeal.foods.length === 0) {
      alert('Por favor, preencha o nome da refeição, horário e adicione pelo menos um alimento');
      return;
    }

    setCurrentMeals(prev => [...prev, { ...newMeal }]);
    setNewMeal({
      name: '',
      time: '',
      foods: []
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
    if (!currentUser?.profile || currentMeals.length === 0) return;
    
    setIsGenerating(true);
    try {
      // Converter MealEntry para FoodEntry para compatibilidade
      const foodEntries: FoodEntry[] = currentMeals.flatMap(meal =>
        meal.foods.map(food => ({
          ...food,
          time: meal.time,
          meal: meal.name.toLowerCase().replace(/\s+/g, '-') as any
        }))
      );

      // Gerar plano de dieta
      const dietPlan = await generateDietPlan(currentUser.profile, foodEntries);
      dietPlan.userId = currentUser.id;
      addDietPlan(dietPlan);

      // Gerar plano de treino
      const workoutPlan = await generateWorkoutPlan(
        currentUser.profile, 
        currentUser.profile.preferredMuscleGroups
      );
      workoutPlan.userId = currentUser.id;
      addWorkoutPlan(workoutPlan);

      // Análise corporal (simulada)
      if (Object.values(photos).every(photo => photo)) {
        const bodyAnalysis = {
          userId: currentUser.id,
          photos,
          analysis: {
            proportions: "Proporções corporais equilibradas com potencial para desenvolvimento muscular.",
            strengths: ["Ombros bem desenvolvidos", "Core estável", "Postura adequada"],
            improvementAreas: ["Desenvolvimento do peitoral", "Fortalecimento das pernas", "Definição abdominal"],
            recommendations: [
              "Focar em exercícios compostos para peitoral",
              "Aumentar volume de treino para pernas",
              "Incluir exercícios específicos para core",
              "Manter consistência na dieta proposta"
            ]
          }
        };
        addBodyAnalysis(bodyAnalysis);
      }

      setActiveTab('results');
    } catch (error) {
      console.error('Erro ao gerar planos:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentDietPlan = getDietPlanByUserId(currentUser?.id || '');
  const currentWorkoutPlan = getWorkoutPlanByUserId(currentUser?.id || '');
  const currentBodyAnalysis = getBodyAnalysisByUserId(currentUser?.id || '');

  const isProfileComplete = currentUser?.profile && 
    currentUser.profile.age > 0 && 
    currentUser.profile.height > 0 && 
    currentUser.profile.weight > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950">
      {/* Header */}
      <div className="bg-white dark:bg-blue-900 shadow-sm border-b border-blue-100 dark:border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-full">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  Olá, {currentUser?.name}!
                </h1>
                <p className="text-blue-600 dark:text-blue-300">
                  Seu coach pessoal com IA
                </p>
              </div>
            </div>
            <Button 
              onClick={logout}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white dark:bg-blue-900 border border-blue-200 dark:border-blue-700">
            <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard" 
              disabled={!isProfileComplete}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white disabled:opacity-50"
            >
              <Activity className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="results" 
              disabled={!currentDietPlan}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white disabled:opacity-50"
            >
              <Target className="w-4 h-4 mr-2" />
              Resultados
            </TabsTrigger>
          </TabsList>

          {/* Aba do Perfil */}
          <TabsContent value="profile">
            <Card className="border-blue-100 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100">
                  Complete seu Perfil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-blue-800 dark:text-blue-200">Idade</Label>
                      <Input
                        type="number"
                        value={profile.age || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                        placeholder="Ex: 25"
                        required
                        className="border-blue-200 dark:border-blue-700"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-blue-800 dark:text-blue-200">Sexo</Label>
                      <Select 
                        value={profile.gender} 
                        onValueChange={(value: 'masculino' | 'feminino') => 
                          setProfile(prev => ({ ...prev, gender: value }))
                        }
                      >
                        <SelectTrigger className="border-blue-200 dark:border-blue-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-blue-800 dark:text-blue-200">Altura (cm)</Label>
                      <Input
                        type="number"
                        value={profile.height || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                        placeholder="Ex: 175"
                        required
                        className="border-blue-200 dark:border-blue-700"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-blue-800 dark:text-blue-200">Peso (kg)</Label>
                      <Input
                        type="number"
                        value={profile.weight || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, weight: parseInt(e.target.value) }))}
                        placeholder="Ex: 70"
                        required
                        className="border-blue-200 dark:border-blue-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-blue-800 dark:text-blue-200">Nível de Atividade Física</Label>
                    <Select 
                      value={profile.activityLevel} 
                      onValueChange={(value) => setProfile(prev => ({ ...prev, activityLevel: value as any }))}
                    >
                      <SelectTrigger className="border-blue-200 dark:border-blue-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentario">Sedentário (pouco ou nenhum exercício)</SelectItem>
                        <SelectItem value="leve">Leve (1-3 dias por semana)</SelectItem>
                        <SelectItem value="moderado">Moderado (3-5 dias por semana)</SelectItem>
                        <SelectItem value="intenso">Intenso (6-7 dias por semana)</SelectItem>
                        <SelectItem value="muito-intenso">Muito Intenso (2x por dia)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-blue-800 dark:text-blue-200">Objetivo</Label>
                    <Select 
                      value={profile.goal} 
                      onValueChange={(value) => setProfile(prev => ({ ...prev, goal: value as any }))}
                    >
                      <SelectTrigger className="border-blue-200 dark:border-blue-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emagrecer">Emagrecer</SelectItem>
                        <SelectItem value="engordar">Ganhar Peso</SelectItem>
                        <SelectItem value="manter-peso-perder-gordura">Manter Peso e Perder Gordura</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Salvar Perfil
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard Principal */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Informações do Perfil */}
            <Card className="border-blue-100 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100">
                  Seus Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <Scale className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {profile.weight}kg
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Peso</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {profile.height}cm
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Altura</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <User className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {profile.age}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Anos</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-blue-900 dark:text-blue-100">
                      {profile.goal === 'emagrecer' ? 'Emagrecer' : 
                       profile.goal === 'engordar' ? 'Ganhar Peso' : 'Recomposição'}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Objetivo</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NOVO SISTEMA DE DIETA */}
            <Card className="border-blue-100 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Utensils className="w-5 h-5" />
                  Sua Alimentação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dietStep === 'question' && (
                  <div className="text-center space-y-4">
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg">
                      <AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Você já segue alguma dieta?
                      </h3>
                      <p className="text-blue-700 dark:text-blue-300 mb-6">
                        Isso nos ajudará a personalizar melhor suas recomendações
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                          onClick={() => handleDietQuestion(true)}
                          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Sim, já sigo uma dieta
                        </Button>
                        <Button
                          onClick={() => handleDietQuestion(false)}
                          variant="outline"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-3"
                        >
                          <AlertCircle className="w-5 h-5 mr-2" />
                          Não, como sem controle
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {dietStep === 'input' && (
                  <div className="space-y-6">
                    {/* Instrução baseada na resposta */}
                    <div className={`p-4 rounded-lg ${followsDiet 
                      ? 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700' 
                      : 'bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700'
                    }`}>
                      <h4 className={`font-semibold mb-2 ${followsDiet 
                        ? 'text-green-900 dark:text-green-100' 
                        : 'text-orange-900 dark:text-orange-100'
                      }`}>
                        {followsDiet 
                          ? '✅ Ótimo! Digite sua dieta atual' 
                          : '📝 Vamos organizar sua alimentação'
                        }
                      </h4>
                      <p className={`text-sm ${followsDiet 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-orange-700 dark:text-orange-300'
                      }`}>
                        {followsDiet 
                          ? 'Digite exatamente o que você já come, com as quantidades corretas que você já segue.'
                          : 'Digite o que você costuma comer no dia e os horários. Vamos ajustar as quantidades e horários para você.'
                        }
                      </p>
                    </div>

                    {/* Upload automático */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 rounded-lg border border-purple-200 dark:border-purple-700">
                      <div className="flex items-center gap-3 mb-3">
                        <Upload className="w-5 h-5 text-purple-600" />
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                          Importar Dieta Automaticamente
                        </h4>
                      </div>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                        Envie uma foto da sua dieta ou um PDF e nossa IA extrairá automaticamente os alimentos e horários.
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleDietFileUpload}
                          disabled={isAnalyzingDiet}
                          className="border-purple-200 dark:border-purple-700"
                        />
                        <Button
                          disabled={isAnalyzingDiet}
                          className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap"
                        >
                          {isAnalyzingDiet ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Analisando...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4 mr-2" />
                              Analisar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Adicionar refeição manual */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        Ou adicione manualmente:
                      </h4>
                      
                      {/* Dados da refeição */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                        <div className="space-y-2">
                          <Label className="text-blue-800 dark:text-blue-200">Nome da Refeição</Label>
                          <Input
                            placeholder="Ex: Café da manhã"
                            value={newMeal.name}
                            onChange={(e) => setNewMeal(prev => ({ ...prev, name: e.target.value }))}
                            className="border-blue-200 dark:border-blue-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-blue-800 dark:text-blue-200">Horário</Label>
                          <Input
                            type="time"
                            value={newMeal.time}
                            onChange={(e) => setNewMeal(prev => ({ ...prev, time: e.target.value }))}
                            className="border-blue-200 dark:border-blue-700"
                          />
                        </div>
                      </div>

                      {/* Adicionar alimentos à refeição */}
                      <div className="space-y-3">
                        <Label className="text-blue-800 dark:text-blue-200">Alimentos desta refeição:</Label>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          <Input
                            placeholder="Alimento"
                            value={newFood.food}
                            onChange={(e) => setNewFood(prev => ({ ...prev, food: e.target.value }))}
                            className="border-blue-200 dark:border-blue-700"
                          />
                          <Input
                            placeholder="Quantidade"
                            value={newFood.quantity}
                            onChange={(e) => setNewFood(prev => ({ ...prev, quantity: e.target.value }))}
                            className="border-blue-200 dark:border-blue-700"
                          />
                          <Select 
                            value={newFood.measurement} 
                            onValueChange={(value) => setNewFood(prev => ({ ...prev, measurement: value as any }))}
                          >
                            <SelectTrigger className="border-blue-200 dark:border-blue-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gramas">gramas</SelectItem>
                              <SelectItem value="ml">ml</SelectItem>
                              <SelectItem value="unidade">uni</SelectItem>
                              <SelectItem value="colher-sopa">colher sopa</SelectItem>
                              <SelectItem value="colher-cha">colher chá</SelectItem>
                              <SelectItem value="xicara">xícara</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={addFoodToMeal}
                            className="bg-blue-600 hover:bg-blue-700"
                            type="button"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Lista de alimentos da refeição atual */}
                        {newMeal.foods.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-blue-800 dark:text-blue-200">Alimentos adicionados:</Label>
                            {newMeal.foods.map((food, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-blue-800 rounded">
                                <span className="text-blue-900 dark:text-blue-100">
                                  {food.food} - {food.quantity} {food.measurement}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFoodFromMeal(index)}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Botão para adicionar refeição completa */}
                        <Button
                          onClick={addMealToList}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          disabled={!newMeal.name || !newMeal.time || newMeal.foods.length === 0}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Refeição
                        </Button>
                      </div>
                    </div>

                    {/* Lista de refeições adicionadas */}
                    {currentMeals.length > 0 && (
                      <div className="space-y-4">
                        <Separator />
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">
                          Suas refeições:
                        </h4>
                        {currentMeals.map((meal, mealIndex) => (
                          <div key={mealIndex} className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-semibold text-blue-900 dark:text-blue-100">
                                {meal.name} - {meal.time}
                              </h5>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeMealFromList(mealIndex)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="space-y-1">
                              {meal.foods.map((food, foodIndex) => (
                                <div key={foodIndex} className="text-blue-700 dark:text-blue-300">
                                  {food.food} - {food.quantity}{food.measurement}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload de Fotos */}
            <Card className="border-blue-100 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Camera className="w-5 h-5" />
                  Fotos do Corpo Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(['front', 'back', 'left', 'right'] as const).map((position) => (
                    <div key={position} className="space-y-2">
                      <Label className="text-blue-800 dark:text-blue-200 capitalize">
                        {position === 'front' ? 'Frente' : 
                         position === 'back' ? 'Costas' : 
                         position === 'left' ? 'Lado Esquerdo' : 'Lado Direito'}
                      </Label>
                      <div className="border-2 border-dashed border-blue-200 dark:border-blue-700 rounded-lg p-4 text-center">
                        {photos[position] ? (
                          <img 
                            src={photos[position]} 
                            alt={position} 
                            className="w-full h-32 object-cover rounded"
                          />
                        ) : (
                          <div className="h-32 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-blue-400" />
                          </div>
                        )}
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(position, file);
                          }}
                          className="mt-2 border-blue-200 dark:border-blue-700"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Botão Gerar Planos */}
            <div className="text-center">
              <Button
                onClick={generatePlans}
                disabled={isGenerating || currentMeals.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Gerando seus planos...
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5 mr-2" />
                    Gerar Meus Planos com IA
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Resultados */}
          <TabsContent value="results" className="space-y-6">
            <Tabs value={resultsTab} onValueChange={setResultsTab} className="space-y-4">
              <TabsList className="bg-white dark:bg-blue-900 border border-blue-200 dark:border-blue-700">
                <TabsTrigger value="diet" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Utensils className="w-4 h-4 mr-2" />
                  Dieta
                </TabsTrigger>
                <TabsTrigger value="workout" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Dumbbell className="w-4 h-4 mr-2" />
                  Treino
                </TabsTrigger>
                {currentBodyAnalysis && (
                  <TabsTrigger value="analysis" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Camera className="w-4 h-4 mr-2" />
                    Análise
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Aba da Dieta */}
              <TabsContent value="diet">
                {currentDietPlan && (
                  <Card className="border-blue-100 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                        <Utensils className="w-5 h-5" />
                        Sua Dieta Personalizada
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {currentDietPlan.dailyCalories}
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">Calorias/dia</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                          <Droplets className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {currentDietPlan.waterIntake}L
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">Água/dia</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {currentDietPlan.macros.protein}g
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">Proteína</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {currentDietPlan.macros.carbs}g
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">Carboidratos</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {currentDietPlan.meals.map((meal, index) => (
                          <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                              {meal.meal} - {meal.time}
                            </h4>
                            <div className="space-y-2">
                              {meal.foods.map((food, foodIndex) => (
                                <div key={foodIndex} className="flex justify-between items-center">
                                  <span className="text-blue-700 dark:text-blue-300">
                                    {food.food} - {food.quantity}
                                  </span>
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    {food.calories} cal
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Aba do Treino */}
              <TabsContent value="workout">
                {currentWorkoutPlan && (
                  <div className="space-y-6">
                    {/* Seletor de Data e Treino */}
                    <Card className="border-blue-100 dark:border-blue-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                          <Calendar className="w-5 h-5" />
                          Registrar Treino
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-blue-800 dark:text-blue-200">Data do Treino</Label>
                            <Input
                              type="date"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              className="border-blue-200 dark:border-blue-700"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-blue-800 dark:text-blue-200">Dia do Treino</Label>
                            <Select 
                              value={selectedWorkoutDay} 
                              onValueChange={setSelectedWorkoutDay}
                            >
                              <SelectTrigger className="border-blue-200 dark:border-blue-700">
                                <SelectValue placeholder="Selecione o treino" />
                              </SelectTrigger>
                              <SelectContent>
                                {currentWorkoutPlan.workouts.map((workout, index) => (
                                  <SelectItem key={index} value={workout.day}>
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
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Iniciar Treino
                          </Button>
                        )}
                      </CardContent>
                    </Card>

                    {/* Progresso do Treino */}
                    {workoutProgressData && (
                      <Card className="border-blue-100 dark:border-blue-800">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                              <Dumbbell className="w-5 h-5" />
                              {workoutProgressData.workoutDay} - {selectedDate}
                            </CardTitle>
                            {/* NOVO BOTÃO: Salvar Treino Completo */}
                            <Button
                              onClick={saveCompleteWorkout}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Salvar Treino
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {workoutProgressData.exercises.map((exercise, exerciseIndex) => {
                            const workoutExercise = currentWorkoutPlan.workouts
                              .find(w => w.day === selectedWorkoutDay)
                              ?.exercises.find(e => e.name === exercise.exerciseName);
                            
                            return (
                              <div key={exerciseIndex} className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                                    {exercise.exerciseName}
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    {workoutExercise?.videoUrl && (
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                          >
                                            <Info className="w-4 h-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Como fazer: {exercise.exerciseName}</DialogTitle>
                                          </DialogHeader>
                                          <div className="space-y-4">
                                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                              <Play className="w-12 h-12 text-gray-400" />
                                              <p className="ml-2 text-gray-600">Vídeo demonstrativo</p>
                                            </div>
                                            {workoutExercise.instructions && (
                                              <div>
                                                <h5 className="font-medium mb-2">Instruções:</h5>
                                                <p className="text-sm text-gray-600">{workoutExercise.instructions}</p>
                                              </div>
                                            )}
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    )}
                                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                                      {workoutExercise?.reps} reps
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  {exercise.sets.map((set, setIndex) => (
                                    <div key={setIndex} className="flex items-center gap-2 p-2 bg-white dark:bg-blue-800 rounded">
                                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100 w-12">
                                        Série {setIndex + 1}:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <Weight className="w-4 h-4 text-blue-600" />
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
                                          className="w-20 h-8 text-sm border-blue-200 dark:border-blue-700"
                                        />
                                        <span className="text-sm text-blue-600 dark:text-blue-400">kg</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-blue-600" />
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
                                          className="w-16 h-8 text-sm border-blue-200 dark:border-blue-700"
                                        />
                                        <span className="text-sm text-blue-600 dark:text-blue-400">reps</span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant={set.completed ? "default" : "outline"}
                                        onClick={() => toggleSetCompletion(exerciseIndex, setIndex)}
                                        className={set.completed 
                                          ? "bg-green-600 hover:bg-green-700 text-white" 
                                          : "border-green-200 text-green-700 hover:bg-green-50"
                                        }
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    )}

                    {/* Plano de Treino Completo */}
                    <Card className="border-blue-100 dark:border-blue-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                          <Dumbbell className="w-5 h-5" />
                          Seu Plano de Treino Completo
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {currentWorkoutPlan.workouts.map((workout, index) => (
                          <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                              {workout.day} - {workout.muscleGroup}
                            </h4>
                            <div className="space-y-3">
                              {workout.exercises.map((exercise, exerciseIndex) => (
                                <div key={exerciseIndex} className="flex justify-between items-center p-3 bg-white dark:bg-blue-800 rounded">
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <p className="font-medium text-blue-900 dark:text-blue-100">
                                        {exercise.name}
                                      </p>
                                      <p className="text-sm text-blue-600 dark:text-blue-400">
                                        {exercise.sets} séries × {exercise.reps} repetições
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                                      {exercise.rest}
                                    </Badge>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                        >
                                          <Info className="w-4 h-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Como fazer: {exercise.name}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                            <Play className="w-12 h-12 text-gray-400" />
                                            <p className="ml-2 text-gray-600">Vídeo demonstrativo</p>
                                          </div>
                                          <div>
                                            <h5 className="font-medium mb-2">Instruções:</h5>
                                            <p className="text-sm text-gray-600">
                                              Instruções detalhadas sobre como executar o exercício {exercise.name} corretamente, 
                                              incluindo posicionamento, movimento e respiração adequada.
                                            </p>
                                          </div>
                                          {exercise.alternatives && exercise.alternatives.length > 0 && (
                                            <div>
                                              <h5 className="font-medium mb-2">Exercícios alternativos:</h5>
                                              <ul className="text-sm text-gray-600 space-y-1">
                                                {exercise.alternatives.map((alt, altIndex) => (
                                                  <li key={altIndex}>• {alt}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Aba da Análise Corporal */}
              <TabsContent value="analysis">
                {currentBodyAnalysis && (
                  <Card className="border-blue-100 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                        <Camera className="w-5 h-5" />
                        Análise Corporal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          Análise Geral:
                        </h4>
                        <p className="text-blue-700 dark:text-blue-300">
                          {currentBodyAnalysis.analysis.proportions}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Pontos Fortes:
                          </h4>
                          <ul className="text-green-700 dark:text-green-300 space-y-1">
                            {currentBodyAnalysis.analysis.strengths.map((strength, index) => (
                              <li key={index}>• {strength}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="p-4 bg-orange-50 dark:bg-orange-900 rounded-lg">
                          <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Áreas para Melhorar:
                          </h4>
                          <ul className="text-orange-700 dark:text-orange-300 space-y-1">
                            {currentBodyAnalysis.analysis.improvementAreas.map((area, index) => (
                              <li key={index}>• {area}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}