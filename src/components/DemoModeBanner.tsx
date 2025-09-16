"use client";

import { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, X, Smartphone, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getApiConfig } from '@/utils/api-config';

interface DemoModeBannerProps {
  onDismiss?: () => void;
  className?: string;
}

export function DemoModeBanner({ onDismiss, className = "" }: DemoModeBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [config, setConfig] = useState<ReturnType<typeof getApiConfig> | null>(null);

  useEffect(() => {
    const apiConfig = getApiConfig();
    setConfig(apiConfig);
    
    // Só mostrar se estiver em modo demo/static build
    if (apiConfig.isDemo || apiConfig.isStaticBuild) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  // Não renderizar se não estiver visível ou se não tiver configuração
  if (!isVisible || !config?.isDemo) {
    return null;
  }

  return (
    <Card className={`bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800 shadow-lg ${className}`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Modo Demonstração - App iOS
                </h3>
              </div>
              
              <div className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
                <p className="leading-relaxed">
                  Você está usando a <strong>versão demonstrativa</strong> da FitAI para iOS. 
                  Todas as funcionalidades estão disponíveis, mas os pagamentos são simulados.
                </p>
                
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 mt-3">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Para pagamentos reais e sincronização completa:
                  </p>
                  <a 
                    href="https://fitai.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors font-medium"
                  >
                    Acesse a versão web
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                
                <div className="flex flex-wrap gap-4 text-xs text-amber-600 dark:text-amber-400 mt-3 pt-2 border-t border-amber-200 dark:border-amber-700">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>IA Personalizada</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Análise Corporal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Pagamentos (Demo)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Sync (Limitada)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="ml-2 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * Banner compacto para uso em modais ou espaços pequenos
 */
export function CompactDemoModeBanner({ className = "" }: { className?: string }) {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const config = getApiConfig();
    setIsDemo(config.isDemo);
  }, []);

  if (!isDemo) return null;

  return (
    <div className={`flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 ${className}`}>
      <Smartphone className="w-3 h-3 flex-shrink-0" />
      <span>Modo demonstração iOS - Pagamentos simulados</span>
      <a 
        href="https://fitai.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 ml-auto"
      >
        Versão web
        <ExternalLink className="w-2 h-2" />
      </a>
    </div>
  );
}