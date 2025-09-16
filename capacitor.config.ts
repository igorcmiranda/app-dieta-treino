import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitai.coach',
  appName: 'FitAI Coach',
  webDir: 'out',
  
  // Configurações otimizadas para iOS
  ios: {
    // Configuração de esquema de cor para Status Bar
    backgroundColor: '#ffffff',
    
    // Permitir navegação inline para melhor UX
    webContentsDebuggingEnabled: false
  },
  
  // Configurações gerais do servidor
  server: {
    // Para desenvolvimento, usar localhost. Para produção, deixar vazio
    hostname: 'localhost',
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  
  // Plugins necessários para funcionalidade completa
  plugins: {
    // Configuração da câmera para funcionalidades de foto
    Camera: {
      permissions: ['camera', 'photos']
    },
    
    // Configuração de notificações locais (se necessário)
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF"
    },
    
    // Configuração de status bar
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff'
    }
  }
};

export default config;
