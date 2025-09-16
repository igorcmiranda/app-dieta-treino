"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Shield, CheckCircle } from 'lucide-react';
import { usePasswordReset } from '@/lib/hooks';
import { sendEmail } from '@/utils/replitmail';

interface ForgotPasswordProps {
  onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const { checkRateLimit, incrementAttempt, createResetToken, emailExists } = usePasswordReset();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validar formato do email
      if (!validateEmail(email)) {
        setError('Por favor, digite um email válido');
        setLoading(false);
        return;
      }

      // Verificar rate limiting
      if (!checkRateLimit(email)) {
        setError('Muitas tentativas. Tente novamente em 1 hora.');
        setLoading(false);
        return;
      }

      // Incrementar tentativa (independente de sucesso)
      incrementAttempt(email);

      // SEMPRE mostrar mensagem de sucesso para não revelar se email existe
      // Mas só enviar email se realmente existir
      if (emailExists(email)) {
        // Gerar token seguro
        const token = createResetToken(email);
        
        // URL completa para reset (usar window.location.origin)
        const resetUrl = `${window.location.origin}/?resetToken=${token}&email=${encodeURIComponent(email)}`;
        
        // HTML formatado para o email
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 20px; text-align: center; }
              .content { padding: 30px 20px; background: #f8fafc; }
              .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
              .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🏋️ FitAI Coach</h1>
              <p>Redefinir sua senha</p>
            </div>
            
            <div class="content">
              <h2>Olá!</h2>
              <p>Você solicitou a redefinição da sua senha do FitAI Coach. Para continuar, clique no botão abaixo:</p>
              
              <center>
                <a href="${resetUrl}" class="button">🔒 Redefinir Senha</a>
              </center>
              
              <p>Ou copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; background: #e2e8f0; padding: 10px; border-radius: 4px;">${resetUrl}</p>
              
              <div class="warning">
                <h3>⚠️ Importante:</h3>
                <ul>
                  <li>Este link expira em <strong>1 hora</strong></li>
                  <li>Use apenas se você solicitou esta redefinição</li>
                  <li>Nunca compartilhe este link com outras pessoas</li>
                  <li>Se você não solicitou, ignore este email</li>
                </ul>
              </div>
              
              <p>Se você não conseguir clicar no botão, copie o link completo e cole no navegador.</p>
            </div>
            
            <div class="footer">
              <p>© 2025 FitAI Coach - Seu personal trainer com IA</p>
              <p>Este é um email automático, não responda.</p>
            </div>
          </body>
          </html>
        `;

        const textContent = `
FitAI Coach - Redefinir senha

Olá!

Você solicitou a redefinição da sua senha do FitAI Coach.

Para redefinir sua senha, acesse o link abaixo:
${resetUrl}

IMPORTANTE:
- Este link expira em 1 hora
- Use apenas se você solicitou esta redefinição
- Nunca compartilhe este link com outras pessoas
- Se você não solicitou, ignore este email

Se você não conseguir clicar no link, copie e cole no seu navegador.

© 2025 FitAI Coach - Seu personal trainer com IA
        `;

        // Enviar email usando Replit Mail
        await sendEmail({
          to: email,
          subject: 'FitAI Coach - Redefinir sua senha',
          html: htmlContent,
          text: textContent
        });
      }

      // SEMPRE mostrar mensagem de sucesso (segurança)
      setSuccess(true);
      
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      setError('Erro interno. Tente novamente em alguns minutos.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="ios-main-scroll bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center safe-area">
        <div className="w-full max-w-md px-3 md:px-0 ios-content-scroll">
          <Card className="shadow-xl border-green-200 dark:border-green-800">
            <CardHeader className="text-center p-4 sm:p-6">
              <CardTitle className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300 text-lg sm:text-xl">
                <CheckCircle className="w-6 h-6" />
                Email enviado!
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="text-center">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg mb-4">
                  <Mail className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Verifique seu email
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
                  </p>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                  <Shield className="w-4 h-4 inline mr-2" />
                  <strong>Segurança:</strong> O link expira em 1 hora
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={onBack}
                  variant="outline"
                  className="w-full touch-target"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao login
                </Button>
                
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                    setError('');
                  }}
                  variant="ghost"
                  className="w-full text-sm text-blue-600 hover:text-blue-700 touch-target"
                >
                  Tentar outro email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="ios-main-scroll bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center safe-area">
      <div className="w-full max-w-md px-3 md:px-0 ios-content-scroll">
        <Card className="shadow-xl border-blue-100 dark:border-blue-800">
          <CardHeader className="text-center p-4 sm:p-6">
            <CardTitle className="flex items-center justify-center gap-2 text-blue-900 dark:text-blue-100 text-lg sm:text-xl">
              <Shield className="w-5 h-5" />
              Recuperar senha
            </CardTitle>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              Digite seu email para receber o link de recuperação
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-800 dark:text-blue-200">
                  Email cadastrado
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                  className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 touch-target text-base"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 dark:bg-red-950 p-3 rounded border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading || !email}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 touch-target"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar link de recuperação
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <Button
                variant="outline"
                onClick={onBack}
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
                Segurança
              </h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Link válido por apenas 1 hora</li>
                <li>Máximo de 3 tentativas por hora</li>
                <li>Não revelamos se o email existe</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}