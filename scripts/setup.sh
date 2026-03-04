#!/bin/bash
# ============================================
# Rise Up - Setup Script
# ============================================

echo "🎮 Rise Up - Esports Platform Setup"
echo "======================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale em: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node --version)"
echo "✅ npm $(npm --version)"

# Install frontend dependencies
echo ""
echo "📦 Instalando dependências do frontend..."
cd "$(dirname "$0")/../frontend"
npm install

# Install backend dependencies
echo ""
echo "📦 Instalando dependências do backend..."
cd "$(dirname "$0")/../backend"
npm install

# Check .env files
echo ""
echo "======================================"
echo "⚙️  Configuração de ambiente:"
echo ""

if [ ! -f "../frontend/.env" ]; then
    echo "⚠️  Crie o arquivo frontend/.env baseado em frontend/.env.example"
    echo "   cp frontend/.env.example frontend/.env"
fi

if [ ! -f "../backend/.env" ]; then
    echo "⚠️  Crie o arquivo backend/.env baseado em backend/.env.example"
    echo "   cp backend/.env.example backend/.env"
fi

echo ""
echo "======================================"
echo "📋 Próximos passos:"
echo ""
echo "1. Crie um projeto no Supabase: https://supabase.com"
echo "2. Execute o schema SQL em docs/schema.sql no Supabase SQL Editor"
echo "3. Configure as variáveis de ambiente nos arquivos .env"
echo "4. Configure Google OAuth no Supabase Dashboard:"
echo "   - Authentication > Providers > Google"
echo "   - Adicione Client ID e Client Secret do Google Cloud Console"
echo "5. Configure Google reCAPTCHA v3:"
echo "   - https://www.google.com/recaptcha/admin"
echo "   - Crie um site reCAPTCHA v3"
echo "   - Adicione a Site Key no frontend/.env"
echo "   - Adicione a Secret Key no backend/.env"
echo "6. Inicie os servidores:"
echo "   - Frontend: cd frontend && npm run dev"
echo "   - Backend: cd backend && npm run dev"
echo ""
echo "🎮 Rise Up está pronto para configuração!"
