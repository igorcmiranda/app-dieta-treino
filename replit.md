# FitAI Coach - Fitness Application

## Overview
FitAI Coach is a Next.js fitness application that provides personalized diet and workout plans powered by AI. The app features user authentication, admin panels, workout tracking, and body analysis capabilities.

## Recent Changes
- September 16, 2025: **Tela de edição de dados pessoais e billing segura implementada**
  - Modal completo de edição acionado pelo clique no ícone de perfil
  - 3 seções: Dados Pessoais, Endereço/Billing, Cartão de Crédito Demo
  - Conformidade total PCI DSS e LGPD - dados sensíveis nunca armazenados
  - Validações robustas: CPF (checksum), CEP, cartão (Luhn), email
  - Máscaras em tempo real para todos os campos sensíveis
  - Banner de segurança claro sobre modo demo
  - Tipos seguros UserBilling sem PAN/CVV/CPF completo
- September 16, 2025: **Sistema de planos de assinatura implementado**
  - Sistema completo de 3 planos: Starter (1/1), Standard (2/2), Premium (4/4 + IA)
  - Controle de limites mensais para dietas e análises corporais
  - Usuários teste criados: starter@test.com, standard@test.com, admin@fitai.com (premium)
  - IA Chat restaurada com restrição apenas para usuários Premium
  - Layout do topo corrigido - perfil e botão sair sempre visíveis
  - Eliminado scroll horizontal completamente, mantido apenas vertical
- September 16, 2025: **Configurações iOS permanentes aplicadas**
  - Category: Healthcare & Fitness (automático)
  - Display Name: FitAI Coach (automático)
  - Orientação: Portrait Only para iPhone e iPad (automático)
  - Ícone personalizado instalado e configurado
- September 16, 2025: **Otimização completa da interface para iOS mobile**
  - Configurado safe areas para iPhone (notch, home indicator, Dynamic Island)
  - Implementado layout mobile-first responsivo com grid adaptativo
  - Corrigido sobreposição de ícones com TabsList horizontal scrolling
  - Aplicado tamanhos de toque mínimos (44px) em todos elementos interativos
  - Otimizado performance CSS para iOS WebView com classes específicas
  - Interface agora totalmente compatível e otimizada para iPhones
- September 16, 2025: **Configuração iOS completa com Capacitor**
  - Next.js configurado para static export (requerido para Capacitor)
  - Capacitor instalado e configurado para iOS nativo
  - Plataforma iOS adicionada com otimizações específicas
  - PWA manifest criado para compatibilidade adicional
  - Scripts de build específicos para iOS adicionados
- September 15, 2025: Initial project setup and import to Replit environment
- Configured for Replit deployment with proper host settings

## User Preferences
- Language: Portuguese (Brazilian)
- Framework: Next.js 15.4.6 with React 19
- Styling: Tailwind CSS with Radix UI components
- Data Storage: Local storage for demo purposes (with potential Supabase integration)

## Project Architecture
- **Frontend**: Next.js with TypeScript, Tailwind CSS, and Radix UI
- **Backend**: Client-side with local storage (localStorage) for data persistence
- **Authentication**: Simple email/password with demo users
- **AI Integration**: Prepared for OpenAI API integration for body analysis
- **Database**: Currently using localStorage, configured for potential Supabase integration

## Key Features
- User registration and login
- Admin panel for user management
- Personalized workout plans
- Diet planning and tracking
- Body analysis with photo upload capability
- Progress tracking

## Development Setup
- Port: 5000 (frontend)
- Dev command: `npm run dev`
- Build command: `npm run build`

## Demo Accounts
- Admin: admin@fitai.com / admin123
- User: user@fitai.com / user123
- User 2: maria@fitai.com / maria123