#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Configurando variáveis de ambiente para o Lulibros...\n');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

// Conteúdo padrão do .env
const defaultEnvContent = `# Configurações da API Backend
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=10000

# Configurações do Ambiente
VITE_APP_ENV=development
VITE_APP_NAME=Lulibros
VITE_APP_VERSION=1.0.0

# Configurações de Debug
VITE_DEBUG=true
`;

// Verificar se .env já existe
if (fs.existsSync(envPath)) {
  console.log('⚠️  Arquivo .env já existe!');
  console.log('📝 Conteúdo atual:');
  console.log(fs.readFileSync(envPath, 'utf8'));
  console.log('\n💡 Para recriar, delete o arquivo .env e execute novamente.');
  process.exit(0);
}

// Criar .env.example se não existir
if (!fs.existsSync(envExamplePath)) {
  fs.writeFileSync(envExamplePath, defaultEnvContent);
  console.log('✅ Arquivo .env.example criado');
}

// Criar .env
fs.writeFileSync(envPath, defaultEnvContent);
console.log('✅ Arquivo .env criado com configurações padrão');
console.log('\n📋 Configurações:');
console.log('- API URL: http://localhost:8000/api');
console.log('- Ambiente: development');
console.log('- Debug: ativado');
console.log('\n🔧 Para alterar, edite o arquivo .env');
console.log('📖 Veja ENV_SETUP.md para mais detalhes');
console.log('\n🚀 Execute "npm run dev" para iniciar o servidor');
