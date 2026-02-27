"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { usePasswordReset } from '@/lib/hooks';

interface ResetPasswordProps {
  token: string;
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function ResetPassword({ token, email, onBack, onSuccess }: ResetPasswordProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenValidation, setTokenValidation] = useState<{
    valid: boolean;
    error?: string;
    loading: boolean;
  }>({ valid: false, loading: true });

  const { validateToken, resetPassword } = usePasswordReset();

  // Validar token ao carregar o componente
  useEffect(() => {
    const validation = validateToken(token);
    setTokenValidation({
      valid: validation.valid,
      error: validation.error,
      loading: false
    });
  }, [token, validateToken]);

  // Validação de força da senha
  const validatePasswordStrength = (password: string) => {
    const minLength = password.length >= 6;
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    
    return {
      isValid: minLength && hasNumber && hasLetter,
      requirements: {
        minLength,
        hasNumber,
        hasLetter
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validações básicas
      if (newPassword !== confirmPassword) {
        setError('As senhas não coincidem');
        setLoading(false);
        return;
      }

      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        setError('A senha deve ter pelo menos 6 caracteres, incluindo números e letras');
        setLoading(false);
        return;
      }

      // Resetar senha
      const result = resetPassword(token, newPassword);
      
      if (!result.success) {
        setError(result.error || 'Erro ao redefinir senha');
        setLoading(false);
        return;
      }

      // Sucesso - redirecionar para login após breve delay
      setTimeout(() => {
        onSuccess();
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      setError('Erro interno. Tente novamente.');
      setLoading(false);
    }
  };

  // Se token inválido, mostrar erro
  if (tokenValidation.loading) {
    return (
      <div className="ios-main-scroll bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center safe-area">
        <div className="w-full max-w-md px-3 md:px-0">
          <Card className="shadow-xl border-blue-100 dark:border-blue-800">
            <CardContent className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-blue-700 dark:text-blue-300">Validando link de recuperação...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!tokenValidation.valid) {
    return (
      <div className="ios-main-scroll bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-950 dark:to-orange-950 flex items-center justify-center safe-area">
        <div className="w-full max-w-md px-3 md:px-0">
          <Card className="shadow-xl border-red-200 dark:border-red-800">
            <CardHeader className="text-center p-4 sm:p-6">
              <CardTitle className="flex items-center justify-center gap-2 text-red-700 dark:text-red-300 text-lg sm:text-xl">
                <AlertTriangle className="w-6 h-6" />
                Link inválido
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="text-center">
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg mb-4">
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    {tokenValidation.error}
                  </p>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Possíveis motivos:
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1 text-left">
                  <li>• Link expirado (válido por apenas 1 hora)</li>
                  <li>• Link já foi utilizado anteriormente</li>
                  <li>• Link foi digitado incorretamente</li>
                  <li>• Solicitação de recuperação mais recente</li>
                </ul>
              </div>

              <Button 
                onClick={onBack}
                className="w-full bg-blue-600 hover:bg-blue-700 touch-target"
              >
                Solicitar novo link de recuperação
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const passwordValidation = validatePasswordStrength(newPassword);

  return (
    <div className="ios-main-scroll bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center safe-area">
      <div className="w-full max-w-md px-3 md:px-0 ios-content-scroll">
        <Card className="shadow-xl border-blue-100 dark:border-blue-800">
          <CardHeader className="text-center p-4 sm:p-6">
            <CardTitle className="flex items-center justify-center gap-2 text-blue-900 dark:text-blue-100 text-lg sm:text-xl">
              <Shield className="w-5 h-5" />
              Nova senha
            </CardTitle>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              Defina uma nova senha para <strong>{email}</strong>
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nova senha */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-blue-800 dark:text-blue-200">
                  Nova senha
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    required
                    disabled={loading}
                    className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 touch-target text-base pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Indicadores de força da senha */}
                {newPassword && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${passwordValidation.requirements.minLength ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={passwordValidation.requirements.minLength ? 'text-green-600' : 'text-gray-500'}>
                        Mínimo 6 caracteres
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${passwordValidation.requirements.hasNumber ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={passwordValidation.requirements.hasNumber ? 'text-green-600' : 'text-gray-500'}>
                        Pelo menos um número
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${passwordValidation.requirements.hasLetter ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={passwordValidation.requirements.hasLetter ? 'text-green-600' : 'text-gray-500'}>
                        Pelo menos uma letra
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmar senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-blue-800 dark:text-blue-200">
                  Confirmar nova senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite novamente sua nova senha"
                    required
                    disabled={loading}
                    className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 touch-target text-base pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Indicador de senhas iguais */}
                {confirmPassword && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${newPassword === confirmPassword ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}>
                      {newPassword === confirmPassword ? 'Senhas coincidem' : 'Senhas diferentes'}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 dark:bg-red-950 p-3 rounded border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading || !passwordValidation.isValid || newPassword !== confirmPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 touch-target"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Redefinindo senha...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Redefinir senha
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <Button
                variant="outline"
                onClick={onBack}
                disabled={loading}
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 touch-target"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao login
              </Button>
            </div>

            {/* Informações de segurança */}
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-xs text-blue-700 dark:text-blue-300">
              <h4 className="font-semibold mb-2 flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                Dicas de segurança
              </h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Use uma senha forte e única</li>
                <li>Não compartilhe sua senha com ninguém</li>
                <li>Considere usar um gerenciador de senhas</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
