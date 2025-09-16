"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useActivityLogger, useUsers } from '@/lib/hooks';
import { ActivityLog } from '@/lib/types';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar,
  User,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Download,
  RefreshCw,
  TrendingUp,
  BarChart3,
  LogIn,
  LogOut,
  Utensils,
  Dumbbell,
  Camera,
  MessageCircle,
  Shield,
  Settings,
  Plus,
  Copy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminActivityLogsProps {
  // Props se necessário
}

export function AdminActivityLogs({}: AdminActivityLogsProps) {
  const { getActivityLogs, getLogStats } = useActivityLogger();
  const { users } = useUsers();
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(50);
  
  // Estados para dados
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para visualização
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Carregar logs e estatísticas
  const loadLogs = () => {
    setIsLoading(true);
    
    try {
      const filters = {
        search: searchTerm.trim() || undefined,
        userId: selectedUser !== 'all' ? selectedUser : undefined,
        action: selectedAction !== 'all' ? selectedAction : undefined,
        status: selectedStatus !== 'all' ? (selectedStatus as any) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit: logsPerPage,
        offset: (currentPage - 1) * logsPerPage
      };

      const result = getActivityLogs(filters);
      setLogs(result.logs);
      setTotalLogs(result.total);
      setHasMore(result.hasMore);

      // Carregar estatísticas
      const logStats = getLogStats();
      setStats(logStats);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Recarregar logs quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1); // Reset página quando filtros mudarem
  }, [searchTerm, selectedUser, selectedAction, selectedStatus, startDate, endDate]);

  useEffect(() => {
    loadLogs();
  }, [currentPage, searchTerm, selectedUser, selectedAction, selectedStatus, startDate, endDate]);

  // Função para obter ícone da ação
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN': return <LogIn className="w-4 h-4 text-green-600" />;
      case 'LOGOUT': return <LogOut className="w-4 h-4 text-gray-600" />;
      case 'LOGIN_FAILED': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'GENERATE_DIET': return <Utensils className="w-4 h-4 text-blue-600" />;
      case 'EDIT_DIET_CHAT': return <MessageCircle className="w-4 h-4 text-purple-600" />;
      case 'GENERATE_WORKOUT': return <Dumbbell className="w-4 h-4 text-orange-600" />;
      case 'BODY_ANALYSIS': return <Camera className="w-4 h-4 text-pink-600" />;
      case 'AI_CHAT': return <MessageCircle className="w-4 h-4 text-indigo-600" />;
      case 'PROFILE_UPDATE': return <User className="w-4 h-4 text-teal-600" />;
      case 'SUBSCRIPTION_CHANGE': return <Shield className="w-4 h-4 text-yellow-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para copiar logs para clipboard
  const copyLogsToClipboard = () => {
    const logText = logs.map(log => {
      return `${format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })} | ${log.userName} (${log.userEmail}) | ${log.action} | ${log.status.toUpperCase()} | ${log.details}`;
    }).join('\n');

    navigator.clipboard.writeText(logText).then(() => {
      alert('Logs copiados para a área de transferência!');
    }).catch((error) => {
      console.error('Erro ao copiar logs:', error);
      alert('Erro ao copiar logs. Tente novamente.');
    });
  };

  // Obter usuários únicos dos logs para filtro
  const getUsersFromLogs = () => {
    const uniqueUsers = new Set();
    logs.forEach(log => {
      uniqueUsers.add(`${log.userId}:${log.userName}:${log.userEmail}`);
    });
    return Array.from(uniqueUsers).map(item => {
      const [userId, userName, userEmail] = (item as string).split(':');
      return { userId, userName, userEmail };
    });
  };

  // Obter ações únicas dos logs para filtro
  const getActionsFromLogs = () => {
    const actions = [...new Set(logs.map(log => log.action))];
    return actions.sort();
  };

  const totalPages = Math.ceil(totalLogs / logsPerPage);

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <FileText className="w-6 h-6 mr-2" />
          Logs de Atividade
        </h2>
        
        {/* Estatísticas rápidas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Activity className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Calendar className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Hoje</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Sucesso</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.byStatus.success}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Erros</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.byStatus.error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex space-x-2 mb-4">
          <Button onClick={loadLogs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
          
          {logs.length > 0 && (
            <Button onClick={copyLogsToClipboard} variant="outline" size="sm">
              <Copy className="w-4 h-4 mr-1" />
              Copiar
            </Button>
          )}

          {stats && (
            <Button onClick={() => setShowStats(true)} variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-1" />
              Estatísticas
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Busca */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por usuário */}
            <div>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos usuários</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por ação */}
            <div>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas ações</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="GENERATE_DIET">Dieta</SelectItem>
                  <SelectItem value="GENERATE_WORKOUT">Treino</SelectItem>
                  <SelectItem value="BODY_ANALYSIS">Análise</SelectItem>
                  <SelectItem value="AI_CHAT">IA Chat</SelectItem>
                  <SelectItem value="PROFILE_UPDATE">Perfil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por status */}
            <div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtros de data */}
            <div className="md:col-span-2 lg:col-span-1 xl:col-span-1">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Filtros ativos */}
          {(searchTerm || selectedUser !== 'all' || selectedAction !== 'all' || selectedStatus !== 'all' || startDate) && (
            <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
              <span className="text-sm text-gray-600">Filtros ativos:</span>
              {searchTerm && (
                <Badge variant="outline">
                  Busca: {searchTerm}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0"
                    onClick={() => setSearchTerm('')}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {selectedUser !== 'all' && (
                <Badge variant="outline">
                  Usuário: {users.find(u => u.id === selectedUser)?.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0"
                    onClick={() => setSelectedUser('all')}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {selectedAction !== 'all' && (
                <Badge variant="outline">
                  Ação: {selectedAction}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0"
                    onClick={() => setSelectedAction('all')}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {selectedStatus !== 'all' && (
                <Badge variant="outline">
                  Status: {selectedStatus}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0"
                    onClick={() => setSelectedStatus('all')}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedUser('all');
                  setSelectedAction('all');
                  setSelectedStatus('all');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Limpar todos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Logs de Atividade ({totalLogs} registros)
            </span>
            {isLoading && (
              <RefreshCw className="w-4 h-4 animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          {logs.length > 0 ? (
            <div className="divide-y">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedLog(log);
                    setShowLogDetails(true);
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {log.userName}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({log.userEmail})
                        </span>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {log.details}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </span>
                        <span className="flex items-center">
                          <Activity className="w-3 h-3 mr-1" />
                          {log.action}
                        </span>
                        {log.ip && (
                          <span className="flex items-center">
                            IP: {log.ip}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isLoading ? 'Carregando logs...' : 'Nenhum log encontrado'}
              </h3>
              {!isLoading && (
                <p className="text-gray-500">
                  Tente ajustar os filtros ou aguarde por mais atividades.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Página {currentPage} de {totalPages} ({totalLogs} logs)
              </p>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog para detalhes do log */}
      <Dialog open={showLogDetails} onOpenChange={setShowLogDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedLog && getActionIcon(selectedLog.action)}
              <span className="ml-2">Detalhes do Log</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Usuário</Label>
                  <p className="font-medium">{selectedLog.userName}</p>
                  <p className="text-sm text-gray-600">{selectedLog.userEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data/Hora</Label>
                  <p className="font-medium">
                    {format(new Date(selectedLog.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Ação</Label>
                  <p className="font-medium">{selectedLog.action}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={getStatusColor(selectedLog.status)}>
                    {selectedLog.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Detalhes</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                  {selectedLog.details}
                </p>
              </div>
              
              {selectedLog.metadata && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Dados Extras</Label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.ip && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Endereço IP</Label>
                  <p className="font-mono text-sm">{selectedLog.ip}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para estatísticas detalhadas */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Estatísticas Detalhadas
            </DialogTitle>
          </DialogHeader>
          
          {stats && (
            <div className="space-y-6">
              {/* Estatísticas por período */}
              <div>
                <h3 className="font-medium mb-3">Atividade por Período</h3>
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                      <p className="text-sm text-gray-600">Total</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.today}</p>
                      <p className="text-sm text-gray-600">Hoje</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">{stats.yesterday}</p>
                      <p className="text-sm text-gray-600">Ontem</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-orange-600">{stats.thisWeek}</p>
                      <p className="text-sm text-gray-600">7 dias</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Estatísticas por status */}
              <div>
                <h3 className="font-medium mb-3">Distribuição por Status</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{stats.byStatus.success}</p>
                      <p className="text-sm text-gray-600">Sucesso</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-600">{stats.byStatus.error}</p>
                      <p className="text-sm text-gray-600">Erro</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-yellow-600">{stats.byStatus.warning}</p>
                      <p className="text-sm text-gray-600">Aviso</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Top ações */}
              <div>
                <h3 className="font-medium mb-3">Ações Mais Frequentes</h3>
                <div className="space-y-2">
                  {Object.entries(stats.byAction)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 10)
                    .map(([action, count]) => (
                      <div key={action} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center">
                          {getActionIcon(action)}
                          <span className="ml-2 font-medium">{action}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}