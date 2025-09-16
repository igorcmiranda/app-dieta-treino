"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useUsers } from '@/lib/hooks';
import { User } from '@/lib/types';
import { 
  Users, 
  Search, 
  Filter, 
  Calendar,
  Mail,
  Phone,
  User as UserIcon,
  Crown,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Activity,
  Zap,
  TrendingUp,
  Heart,
  Eye,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminUserManagementProps {
  onViewUserLogs?: (userId: string, userName: string) => void;
  onUpgradeUser?: (userId: string, currentPlan: string) => void;
}

export function AdminUserManagement({ onViewUserLogs, onUpgradeUser }: AdminUserManagementProps) {
  const { users } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'plan'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Filtrar e ordenar usuários
  const filteredUsers = users
    .filter(user => {
      // Filtro por busca (nome ou email)
      const matchesSearch = searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por plano
      const matchesPlan = selectedPlan === 'all' || 
        user.subscription?.plan === selectedPlan;

      // Filtro por status
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'active' && user.subscription?.status === 'active') ||
        (selectedStatus === 'inactive' && user.subscription?.status !== 'active') ||
        (selectedStatus === 'admin' && user.isAdmin) ||
        (selectedStatus === 'verified' && user.emailVerified) ||
        (selectedStatus === 'unverified' && !user.emailVerified);

      return matchesSearch && matchesPlan && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'plan':
          aValue = a.subscription?.plan || 'zzz'; // Colocar no final se não tiver plano
          bValue = b.subscription?.plan || 'zzz';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Função para obter cor do plano
  const getPlanColor = (plan?: string) => {
    switch (plan) {
      case 'starter': return 'bg-blue-100 text-blue-800';
      case 'standard': return 'bg-green-100 text-green-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para calcular uso percentual
  const getUsagePercentage = (used: number, limit: number | string) => {
    if (limit === 'unlimited') return 0;
    return Math.round((used / (limit as number)) * 100);
  };

  // Estatísticas gerais
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.subscription?.status === 'active').length;
  const adminUsers = users.filter(u => u.isAdmin).length;
  const verifiedUsers = users.filter(u => u.emailVerified).length;

  const toggleUserExpanded = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  // Função para lidar com visualização de logs do usuário
  const handleViewUserLogs = (userId: string, userName: string) => {
    if (onViewUserLogs) {
      onViewUserLogs(userId, userName);
    }
  };

  // Função para lidar com upgrade de usuário
  const handleUpgradeUser = (userId: string, currentPlan: string) => {
    if (onUpgradeUser) {
      onUpgradeUser(userId, currentPlan);
    }
  };

  // Verificar se usuário pode fazer upgrade
  const canUpgrade = (plan?: string) => {
    return plan === 'starter' || plan === 'standard';
  };

  // Obter próximo plano
  const getNextPlan = (currentPlan: string) => {
    switch (currentPlan) {
      case 'starter': return 'standard';
      case 'standard': return 'premium';
      default: return null;
    }
  };

  const renderUserCard = (user: User) => (
    <Card key={user.id} className="relative hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback className={user.isAdmin ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}>
              {user.isAdmin ? <Shield className="w-4 h-4" /> : user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{user.name}</h3>
            <p className="text-sm text-gray-500 truncate flex items-center">
              <Mail className="w-3 h-3 mr-1" />
              {user.email}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-1">
            {user.isAdmin && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Crown className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            )}
            {user.subscription && (
              <div className="flex items-center space-x-1">
                <Badge className={getPlanColor(user.subscription.plan)}>
                  {user.subscription.plan}
                </Badge>
                {canUpgrade(user.subscription.plan) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleUpgradeUser(user.id, user.subscription?.plan || '')}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Upgrade
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Status da conta */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Status:</span>
            <div className="flex items-center space-x-2">
              {user.emailVerified ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verificado
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="w-3 h-3 mr-1" />
                  Não verificado
                </Badge>
              )}
              {user.subscription && (
                <Badge className={getStatusColor(user.subscription.status)}>
                  {user.subscription.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              )}
            </div>
          </div>

          {/* Data de criação */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Criado em:</span>
            <span className="text-gray-900 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>

          {/* Informações da assinatura */}
          {user.subscription && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Assinatura:</span>
                <span className="text-gray-900">
                  {format(new Date(user.subscription.startDate), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(user.subscription.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>

              {/* Uso mensal */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Dietas:</span>
                  <span>{user.subscription.dietsUsedThisMonth} usadas</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Treinos:</span>
                  <span>{user.subscription.workoutsUsedThisMonth} usados</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Análises:</span>
                  <span>{user.subscription.bodyAnalysesUsedThisMonth} usadas</span>
                </div>
              </div>
            </>
          )}

          {/* Botões de ação */}
          <div className="flex items-center justify-between pt-2">
            {/* Botão para expandir detalhes */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleUserExpanded(user.id)}
            >
              {expandedUser === user.id ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Menos detalhes
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Ver detalhes
                </>
              )}
            </Button>

            {/* Botão para ver logs */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewUserLogs(user.id, user.name)}
            >
              <FileText className="w-4 h-4 mr-1" />
              Ver Logs
            </Button>
          </div>

          {/* Detalhes expandidos */}
          {expandedUser === user.id && user.profile && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900 mb-2">Perfil do Usuário</h4>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Idade:</span>
                  <p className="font-medium">{user.profile.age} anos</p>
                </div>
                <div>
                  <span className="text-gray-600">Gênero:</span>
                  <p className="font-medium">{user.profile.gender}</p>
                </div>
                <div>
                  <span className="text-gray-600">Altura:</span>
                  <p className="font-medium">{user.profile.height} cm</p>
                </div>
                <div>
                  <span className="text-gray-600">Peso:</span>
                  <p className="font-medium">{user.profile.weight} kg</p>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-gray-600">Objetivo:</span>
                <p className="font-medium">{user.profile.goal.replace('-', ' ')}</p>
              </div>

              <div className="text-sm">
                <span className="text-gray-600">Nível de atividade:</span>
                <p className="font-medium">{user.profile.activityLevel}</p>
              </div>

              {user.profile.preferredMuscleGroups.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-600">Grupos musculares preferidos:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.profile.preferredMuscleGroups.map((group, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {group}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {user.profile.foodRestrictions.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-600">Restrições alimentares:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.profile.foodRestrictions.map((restriction, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-700">
                        {restriction}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {user.profile.foodPreferences.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-600">Preferências alimentares:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.profile.foodPreferences.map((preference, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700">
                        {preference}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Users className="w-6 h-6 mr-2" />
          Gerenciamento de Usuários
        </h2>
        
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Admins</p>
                  <p className="text-2xl font-bold text-gray-900">{adminUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Verificados</p>
                  <p className="text-2xl font-bold text-gray-900">{verifiedUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtros e busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex space-x-2">
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="verified">Verificado</SelectItem>
                  <SelectItem value="unverified">Não verificado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Data</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="plan">Plano</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de usuários */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            Mostrando {filteredUsers.length} de {totalUsers} usuários
          </p>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(renderUserCard)}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
              <p className="text-gray-500">
                Tente ajustar os filtros ou termo de busca.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}