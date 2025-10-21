"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCurrentUser, useUsers } from '@/lib/hooks';
import { User, Plus, Users, Settings, LogOut, Eye, Trash2 } from 'lucide-react';

export function AdminPanel() {
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  
  const { logout } = useCurrentUser();
  const { users, addUser, deleteUser } = useUsers();

  // Inicializar usuários demo se não existirem
  useEffect(() => {
    if (users.length === 0) {
      addUser({
        name: 'Administrador',
        email: 'admin@fitai.com',
        password: 'admin123',
        isAdmin: true
      });
      addUser({
        name: 'João Silva',
        email: 'user@fitai.com',
        password: 'user123',
        isAdmin: false
      });
    }
  }, [users.length, addUser]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.name && newUser.email && newUser.password) {
      addUser({
        ...newUser,
        isAdmin: false
      });
      setNewUser({ name: '', email: '', password: '' });
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const regularUsers = users.filter(user => !user.isAdmin);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950">
      {/* Header */}
      <div className="bg-white dark:bg-blue-900 shadow-sm border-b border-blue-100 dark:border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  Painel Administrativo
                </h1>
                <p className="text-blue-600 dark:text-blue-300">
                  Gerencie usuários do FitAI Coach
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
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white dark:bg-blue-900 border border-blue-200 dark:border-blue-700">
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Usuários ({regularUsers.length})
            </TabsTrigger>
            <TabsTrigger value="add-user" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </TabsTrigger>
          </TabsList>

          {/* Lista de Usuários */}
          <TabsContent value="users" className="space-y-4">
            <Card className="border-blue-100 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100">
                  Usuários Cadastrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {regularUsers.length === 0 ? (
                  <div className="text-center py-8 text-blue-600 dark:text-blue-400">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum usuário cadastrado ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {regularUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-600 rounded-full">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                              {user.name}
                            </h3>
                            <p className="text-blue-600 dark:text-blue-300">
                              {user.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-blue-700 dark:text-blue-300">
                                Senha: {showPasswords[user.id] ? user.password : '••••••••'}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => togglePasswordVisibility(user.id)}
                                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={user.profile ? "default" : "secondary"}
                            className={user.profile ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                          >
                            {user.profile ? 'Perfil Completo' : 'Perfil Pendente'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Adicionar Usuário */}
          <TabsContent value="add-user">
            <Card className="border-blue-100 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100">
                  Cadastrar Novo Usuário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddUser} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-blue-800 dark:text-blue-200">
                      Nome Completo
                    </Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do usuário"
                      required
                      className="border-blue-200 dark:border-blue-700 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-blue-800 dark:text-blue-200">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                      required
                      className="border-blue-200 dark:border-blue-700 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-blue-800 dark:text-blue-200">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Senha temporária"
                      required
                      className="border-blue-200 dark:border-blue-700 focus:ring-blue-500"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar Usuário
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Instruções:
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• O usuário receberá as credenciais de acesso</li>
                    <li>• No primeiro login, ele completará o perfil</li>
                    <li>• Após completar o perfil, terá acesso às funcionalidades</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}