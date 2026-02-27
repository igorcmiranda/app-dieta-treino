# FitAI Coach

Aplicação Next.js para geração de dieta, treino e análise corporal com autenticação e persistência em banco externo MySQL (pronto para Hostinger).

## Stack

- Next.js 15 + React 19
- API Routes (Next.js) para autenticação e dados
- MySQL 8+ (Hostinger)
- Sessão via cookie HTTP-only + JWT

## 1) Configurar MySQL

1. Crie um banco MySQL na Hostinger.
2. Execute o script SQL:
   - `mysql/schema.sql`

## 2) Configurar variáveis de ambiente

Crie `.env.local` com base no `.env.local.example`.

Exemplo mínimo:

```bash
NEXT_PUBLIC_DB_PROVIDER=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=seu_usuario_mysql
MYSQL_PASSWORD=sua_senha_mysql
MYSQL_DATABASE=fitai_coach
AUTH_JWT_SECRET=troque_por_um_segredo_longo_e_aleatorio
```

## 3) Rodar local

```bash
npm install --no-package-lock
npm run dev
```

Abra: [http://localhost:3000](http://localhost:3000)

## 4) Deploy na Hostinger

1. Suba o projeto como app Node/Next.js.
2. Configure as variáveis de ambiente no painel da Hostinger.
3. Configure o banco MySQL remoto no mesmo painel.
4. Execute o SQL de `mysql/schema.sql` no banco.
5. Build/start:
   - Build: `npm run build`
   - Start: `npm run start`

## Persistência

Com `NEXT_PUBLIC_DB_PROVIDER=mysql`, o app salva e carrega automaticamente no banco:

- usuário e senha (hash bcrypt)
- perfil
- assinatura/plano
- dieta gerada
- treino gerado
- análise corporal
- progresso de treino

## Fallback local

Sem configuração MySQL, o app usa `localStorage` (modo local/demo).
