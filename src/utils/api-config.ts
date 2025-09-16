/**
 * Configuração de API para suportar builds híbridos
 * Resolve conflito entre iOS static export e APIs dinâmicas
 */

export interface ApiConfig {
  isStaticBuild: boolean;
  isDemo: boolean;
  baseUrl: string;
  hasApiSupport: boolean;
}

/**
 * Detecta se estamos em um build estático (iOS/Capacitor)
 * Build estático = sem suporte a APIs server-side
 */
export const isStaticBuild = (): boolean => {
  // No servidor, verificar variáveis de ambiente
  if (typeof window === 'undefined') {
    return process.env.BUILD_TARGET === 'ios';
  }
  
  // No cliente, verificar se há suporte a API routes
  // Em builds estáticos, não há API routes disponíveis
  return !window.location.pathname.startsWith('/api/') && 
         process.env.NODE_ENV === 'production' &&
         !process.env.NEXT_PUBLIC_API_URL;
};

/**
 * Detecta se estamos em modo demonstração
 * Modo demo = funcionalidade simulada para iOS
 */
export const isDemoMode = (): boolean => {
  return isStaticBuild() || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
};

/**
 * Obtém a URL base para chamadas de API
 */
export const getApiBaseUrl = (): string => {
  // Server-side
  if (typeof window === 'undefined') {
    if (process.env.BUILD_TARGET === 'ios') {
      return 'DEMO_MODE';
    }
    return process.env.NEXT_PUBLIC_API_URL || '';
  }
  
  // Client-side
  if (isStaticBuild()) {
    // Em build estático (iOS), usar API externa ou modo demo
    return process.env.NEXT_PUBLIC_EXTERNAL_API_URL || 'DEMO_MODE';
  }
  
  // Em desenvolvimento ou produção web, usar APIs locais
  return process.env.NEXT_PUBLIC_API_URL || '';
};

/**
 * Verifica se as APIs estão disponíveis
 */
export const hasApiSupport = (): boolean => {
  const baseUrl = getApiBaseUrl();
  return baseUrl !== 'DEMO_MODE' && baseUrl !== '';
};

/**
 * Configuração completa da API
 */
export const getApiConfig = (): ApiConfig => {
  const staticBuild = isStaticBuild();
  const demo = isDemoMode();
  const baseUrl = getApiBaseUrl();
  const apiSupport = hasApiSupport();
  
  return {
    isStaticBuild: staticBuild,
    isDemo: demo,
    baseUrl,
    hasApiSupport: apiSupport
  };
};

/**
 * Função helper para fazer chamadas de API com fallback
 */
export const apiCall = async (
  endpoint: string, 
  options: RequestInit = {},
  demoResponse?: any
): Promise<Response | { json: () => Promise<any>, ok: boolean }> => {
  const config = getApiConfig();
  
  // Se estiver em modo demo, retornar resposta simulada
  if (config.isDemo && demoResponse) {
    return {
      json: async () => demoResponse,
      ok: true
    };
  }
  
  // Se não houver suporte a APIs, lançar erro informativo
  if (!config.hasApiSupport) {
    throw new Error('APIs não disponíveis no modo atual. Use a versão web para funcionalidades completas.');
  }
  
  // Fazer chamada normal de API
  const url = config.baseUrl ? `${config.baseUrl}${endpoint}` : endpoint;
  return fetch(url, options);
};

/**
 * Logger para debug de configuração
 */
export const logApiConfig = (): void => {
  if (process.env.NODE_ENV === 'development') {
    const config = getApiConfig();
    console.log('[API CONFIG]', {
      isStaticBuild: config.isStaticBuild,
      isDemo: config.isDemo,
      baseUrl: config.baseUrl,
      hasApiSupport: config.hasApiSupport,
      buildTarget: process.env.BUILD_TARGET,
      nodeEnv: process.env.NODE_ENV
    });
  }
};