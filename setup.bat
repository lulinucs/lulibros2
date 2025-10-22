@echo off
echo 🚀 Configurando Lulibros 2.0...

REM Verificar se está na pasta correta
if not exist "README.md" (
    echo ❌ Execute este script na pasta raiz do projeto
    pause
    exit /b 1
)

echo 📦 Instalando dependências do frontend...
cd frontend
call npm install
cd ..

echo 📦 Instalando dependências do backend...
cd api
composer install
cd ..

echo 🔧 Configurando arquivos de ambiente...

REM Criar .env para frontend se não existir
if not exist "frontend\.env" (
    echo VITE_API_BASE_URL=http://localhost:8000/api > frontend\.env
    echo VITE_APP_ENV=development >> frontend\.env
    echo VITE_DEBUG=true >> frontend\.env
    echo ✅ Arquivo frontend\.env criado
)

echo.
echo 📋 Próximos passos:
echo 1. Configure o banco de dados MySQL
echo 2. Ajuste as configurações em api\config\development.env
echo 3. Execute: cd api ^&^& php -S localhost:8000 -t .
echo 4. Execute: cd frontend ^&^& npm run dev
echo.
echo 🌐 Acesse: http://localhost:3000
echo 🔗 API: http://localhost:8000/api

echo ✅ Setup concluído!
pause
