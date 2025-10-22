#!/bin/bash

echo "🚀 Configurando Lulibros 2.0..."

# Verificar se está na pasta correta
if [ ! -f "README.md" ]; then
    echo "❌ Execute este script na pasta raiz do projeto"
    exit 1
fi

echo "📦 Instalando dependências do frontend..."
cd frontend
npm install
cd ..

echo "📦 Instalando dependências do backend..."
cd api
if command -v composer &> /dev/null; then
    composer install
else
    echo "⚠️  Composer não encontrado. Instale o Composer primeiro."
fi
cd ..

echo "🔧 Configurando arquivos de ambiente..."

# Criar .env para frontend se não existir
if [ ! -f "frontend/.env" ]; then
    cat > frontend/.env << EOF
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_ENV=development
VITE_DEBUG=true
EOF
    echo "✅ Arquivo frontend/.env criado"
fi

echo "📋 Próximos passos:"
echo "1. Configure o banco de dados MySQL"
echo "2. Ajuste as configurações em api/config/development.env"
echo "3. Execute: cd api && php -S localhost:8000 -t ."
echo "4. Execute: cd frontend && npm run dev"
echo ""
echo "🌐 Acesse: http://localhost:3000"
echo "🔗 API: http://localhost:8000/api"

echo "✅ Setup concluído!"
