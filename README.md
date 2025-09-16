# FitAI Coach - Sistema de Pagamento Recorrente com Iugu

Este é um aplicativo FitAI Coach com sistema completo de pagamento recorrente integrado à Iugu.

## 🚀 Funcionalidades

- ✅ **Sistema de Assinatura Recorrente** - Pagamentos mensais automáticos via Iugu
- ✅ **Checkout Estilizado** - Interface moderna e responsiva para pagamentos
- ✅ **Múltiplos Planos** - Starter, Standard e Premium
- ✅ **Webhooks** - Atualizações automáticas de status de pagamento
- ✅ **Validação PCI** - Tokenização segura de cartões de crédito
- ✅ **Sistema Demo** - Funciona com localStorage para demonstração
- ✅ **Integração Completa** - API Routes, componentes React e tipagem TypeScript

## 📦 Planos Disponíveis

| Plano | Preço/Mês | Dietas | Treinos | Extras |
|-------|-----------|--------|---------|--------|
| **Starter** | R$ 19,97 | 1 | 1 | Análise básica |
| **Standard** | R$ 29,97 | 2 | 2 | Pode alterar dieta |
| **Premium** | R$ 49,97 | Ilimitadas | 4 | Consultoria + Suporte 24/7 |

## ⚙️ Configuração

### 1. Clone e Instale Dependências

```bash
git clone <repository-url>
cd fitai-coach
npm install
```

### 2. Configuração da Iugu

#### 2.1. Criar Conta na Iugu
1. Acesse [https://app.iugu.com](https://app.iugu.com)
2. Crie sua conta gratuita
3. Acesse o painel administrativo

#### 2.2. Obter Credenciais
1. **API Token**: Vá em `Administração > Configurações de Conta > API Tokens`
   - Para testes: Use token que começa com `TEST_`
   - Para produção: Use token que começa com `LIVE_`

2. **Account ID**: Vá em `Administração > Configurações de Conta > Informações Gerais`
   - Copie o "ID da Conta"

3. **Webhook Secret**: Vá em `Administração > Webhooks`
   - Crie um novo webhook
   - URL: `https://seudominio.com/api/webhooks/iugu`
   - Eventos: `invoice.created`, `invoice.status_changed`, `subscription.created`, `subscription.suspended`, `subscription.activated`, `payment_method.created`
   - Copie o "Webhook Secret" gerado

### 3. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.local.example .env.local
```

Edite o arquivo `.env.local`:

```env
# IUGU PAYMENT INTEGRATION
IUGU_API_TOKEN=TEST_sua_api_token_aqui
IUGU_WEBHOOK_SECRET=seu_webhook_secret_aqui
NEXT_PUBLIC_IUGU_ACCOUNT_ID=sua_account_id_aqui

# DEVELOPMENT CONFIG
NODE_ENV=development
```

### 4. Configurar Planos na Iugu

Execute a aplicação e faça uma requisição POST para criar os planos:

```bash
npm run dev
```

Em outro terminal:

```bash
curl -X POST http://localhost:5000/api/iugu/plans \
  -H "Content-Type: application/json"
```

Isso criará automaticamente os planos:
- `fitai_starter_monthly` (R$ 19,97)
- `fitai_standard_monthly` (R$ 29,97)
- `fitai_premium_monthly` (R$ 49,97)

## 🛠️ Desenvolvimento

### Executar o Projeto

```bash
npm run dev
```

Acesse [http://localhost:5000](http://localhost:5000) no seu navegador.

### Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── iugu/
│   │   │   ├── customers/route.ts      # Gerenciar customers
│   │   │   ├── plans/route.ts          # Gerenciar planos
│   │   │   ├── subscriptions/route.ts  # Gerenciar assinaturas
│   │   │   └── payment-methods/route.ts # Métodos de pagamento
│   │   └── webhooks/
│   │       └── iugu/route.ts           # Webhook da Iugu
├── components/
│   ├── IuguCheckout.tsx                # Componente de checkout
│   ├── SubscriptionPlans.tsx           # Seleção de planos (modificado)
│   └── ui/                             # Componentes de UI
├── lib/
│   ├── types.ts                        # Tipos TypeScript (com Iugu)
│   └── hooks.ts                        # Hooks customizados
└── ...
```

### Testando Pagamentos

Use os cartões de teste da Iugu:

| Cartão | Resultado |
|--------|-----------|
| `4111 1111 1111 1111` | ✅ Aprovado |
| `4000 0000 0000 0002` | ❌ Recusado |

- **CVV**: Qualquer 3 dígitos
- **Validade**: Qualquer data futura (MM/AA)

## 🔄 Fluxo de Pagamento

1. **Usuário seleciona plano** → `SubscriptionPlans.tsx`
2. **Redirectiona para checkout** → `IuguCheckout.tsx`
3. **Validação de dados** → Formulário com validação em tempo real
4. **Criar customer** → `POST /api/iugu/customers`
5. **Tokenizar cartão** → SDK Iugu no frontend
6. **Adicionar método de pagamento** → `POST /api/iugu/payment-methods`
7. **Criar assinatura** → `POST /api/iugu/subscriptions`
8. **Webhook confirmação** → `POST /api/webhooks/iugu`
9. **Atualizar usuário** → localStorage/Database

## 📡 API Routes

### Customers
- `POST /api/iugu/customers` - Criar customer
- `GET /api/iugu/customers?customer_id=ID` - Buscar customer

### Plans  
- `POST /api/iugu/plans` - Criar todos os planos
- `GET /api/iugu/plans` - Listar planos

### Subscriptions
- `POST /api/iugu/subscriptions` - Criar assinatura
- `GET /api/iugu/subscriptions?customer_id=ID` - Buscar assinaturas
- `DELETE /api/iugu/subscriptions?subscription_id=ID` - Cancelar assinatura

### Payment Methods
- `POST /api/iugu/payment-methods` - Adicionar método
- `GET /api/iugu/payment-methods?customer_id=ID` - Listar métodos  
- `DELETE /api/iugu/payment-methods?customer_id=ID&payment_method_id=ID` - Remover método

### Webhooks
- `POST /api/webhooks/iugu` - Receber eventos da Iugu

## 🔐 Segurança

### Dados Sensíveis
- ❌ **Nunca** armazene dados completos de cartão
- ✅ Use apenas tokens da Iugu
- ✅ Validação de webhook com assinatura
- ✅ Variáveis de ambiente para credenciais

### PCI Compliance
- ✅ Tokenização via SDK Iugu
- ✅ HTTPS obrigatório em produção
- ✅ Dados de cartão nunca passam pelo servidor

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente no painel da Vercel
3. Deploy automático

### Outras Plataformas

Certifique-se de configurar:
- Variáveis de ambiente
- HTTPS habilitado
- URL do webhook atualizada na Iugu

## 🐛 Troubleshooting

### Erros Comuns

**"IUGU_API_TOKEN não configurado"**
- Verifique se o arquivo `.env.local` existe
- Confirme se a variável `IUGU_API_TOKEN` está definida
- Reinicie o servidor de desenvolvimento

**"Erro ao carregar SDK"**
- Verifique conexão com internet
- Confirme se `NEXT_PUBLIC_IUGU_ACCOUNT_ID` está correto
- Abra o console do navegador para mais detalhes

**"Webhook signature inválida"**
- Confirme se `IUGU_WEBHOOK_SECRET` está correto
- Verifique se a URL do webhook está configurada corretamente na Iugu

### Debug

Habilite logs detalhados:

```bash
# Console do navegador
localStorage.setItem('debug', 'iugu:*')

# Server logs
DEBUG=iugu:* npm run dev
```

## 📞 Suporte

- **Documentação Iugu**: [https://docs.iugu.com](https://docs.iugu.com)
- **Suporte Iugu**: [https://app.iugu.com/support](https://app.iugu.com/support)
- **Issues do projeto**: [GitHub Issues]

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Desenvolvido com ❤️ usando Next.js, TypeScript, Tailwind CSS e Iugu**
