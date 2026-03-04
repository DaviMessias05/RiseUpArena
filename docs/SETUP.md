# Rise Up - Guia de Setup

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- Conta no [Google Cloud Console](https://console.cloud.google.com) (para OAuth)
- Conta no [Google reCAPTCHA](https://www.google.com/recaptcha/admin) (v3)

## 1. Configurar Supabase

### Criar projeto
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a **Project URL** e a **anon public key**
3. Em Settings > API, copie também a **service_role key** (para o backend)

### Executar schema
1. Vá em SQL Editor no dashboard do Supabase
2. Cole e execute o conteúdo de `docs/schema.sql`
3. Isso cria todas as tabelas, índices, RLS policies e triggers

### Configurar Authentication

#### Google OAuth
1. No Google Cloud Console, crie um projeto (ou use existente)
2. Vá em APIs & Services > Credentials
3. Crie um OAuth 2.0 Client ID (tipo Web Application)
4. Authorized redirect URIs: `https://<seu-projeto>.supabase.co/auth/v1/callback`
5. No Supabase Dashboard > Authentication > Providers > Google
6. Ative e cole o Client ID e Client Secret

#### Email
1. Em Authentication > Settings
2. Confirme que "Enable email confirmations" está ativado
3. Personalize o template de email se desejar
4. Adicione o Site URL: `http://localhost:5173` (dev) ou seu domínio

### Configurar Realtime
1. Em Database > Replication
2. Confirme que as tabelas `lobbies`, `lobby_players`, `chat_messages`, `matches`, `tournament_matches` estão habilitadas

## 2. Configurar reCAPTCHA v3

1. Acesse [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Crie um novo site com reCAPTCHA v3
3. Adicione os domínios: `localhost`, seu domínio de produção
4. Copie a **Site Key** (frontend) e **Secret Key** (backend)

## 3. Variáveis de Ambiente

### Frontend (`frontend/.env`)
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
VITE_RECAPTCHA_SITE_KEY=sua-recaptcha-site-key
VITE_API_URL=http://localhost:3001/api
```

### Backend (`backend/.env`)
```
PORT=3001
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-role-key
RECAPTCHA_SECRET_KEY=sua-recaptcha-secret-key
```

## 4. Instalar e Rodar

```bash
# Script automático
bash scripts/setup.sh

# Ou manualmente:

# Frontend
cd frontend
npm install
npm run dev

# Backend (em outro terminal)
cd backend
npm install
npm run dev
```

## 5. Criar Admin

Após o primeiro cadastro, promova o usuário a admin via SQL:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'seu-email@exemplo.com';
```

## Arquitetura

```
rise_up_site/
├── frontend/          # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── contexts/     # AuthContext, RealtimeContext
│   │   ├── lib/          # supabase.js, api.js
│   │   └── pages/        # Páginas da aplicação
│   └── ...
├── backend/           # Express API
│   ├── src/
│   │   ├── routes/       # Rotas da API
│   │   ├── middleware/   # Auth, Captcha
│   │   └── lib/          # Supabase, ELO
│   └── ...
├── docs/              # Documentação e SQL
└── scripts/           # Scripts de setup
```

## Fluxos Principais

### Cadastro
1. Usuário preenche formulário (username, email, senha)
2. reCAPTCHA v3 valida no frontend
3. Token enviado ao backend para verificação
4. Supabase Auth cria o usuário
5. Trigger `handle_new_user` cria o perfil automaticamente
6. Email de verificação enviado
7. Usuário deve verificar email antes de acessar funcionalidades

### Login com Google
1. Clique em "Login com Google"
2. Redirecionamento OAuth via Supabase
3. Google autentica o usuário
4. Callback retorna para `/auth/callback`
5. Perfil criado automaticamente (trigger)
6. Email já verificado (Google)

### Lobby → Partida
1. Jogador cria lobby (com reCAPTCHA)
2. Outros jogadores entram e escolhem time
3. Todos marcam "Pronto"
4. Criador inicia a partida
5. Match registrada no banco
6. Resultado inserido
7. ELO atualizado automaticamente
8. Stats do jogador atualizados
