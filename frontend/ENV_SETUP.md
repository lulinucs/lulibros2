# Configuração de Variáveis de Ambiente - Frontend

## 📋 Como Configurar

### 1. Criar arquivo `.env` na pasta `frontend/`

```bash
# Configurações da API Backend
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=10000

# Configurações do Ambiente
VITE_APP_ENV=development
VITE_APP_NAME=Lulibros
VITE_APP_VERSION=1.0.0

# Configurações de Debug
VITE_DEBUG=true
```

### 2. Para Produção

```bash
# Produção
VITE_API_BASE_URL=https://api.lulibros.com/api
VITE_API_TIMEOUT=15000
VITE_APP_ENV=production
VITE_APP_NAME=Lulibros
VITE_APP_VERSION=1.0.0
VITE_DEBUG=false
```

### 3. Para Staging

```bash
# Staging
VITE_API_BASE_URL=https://staging-api.lulibros.com/api
VITE_API_TIMEOUT=12000
VITE_APP_ENV=staging
VITE_APP_NAME=Lulibros (Staging)
VITE_APP_VERSION=1.0.0
VITE_DEBUG=true
```

## 🔧 Variáveis Disponíveis

| Variável | Descrição | Padrão | Exemplo |
|----------|-----------|--------|---------|
| `VITE_API_BASE_URL` | URL base da API | `http://localhost:8000/api` | `https://api.lulibros.com/api` |
| `VITE_API_TIMEOUT` | Timeout das requisições (ms) | `10000` | `15000` |
| `VITE_APP_ENV` | Ambiente da aplicação | `development` | `production` |
| `VITE_APP_NAME` | Nome da aplicação | `Lulibros` | `Lulibros` |
| `VITE_APP_VERSION` | Versão da aplicação | `1.0.0` | `1.2.3` |
| `VITE_DEBUG` | Ativar logs de debug | `true` | `false` |

## 🚀 Deploy em Diferentes Ambientes

### Vercel
```bash
# No painel da Vercel, adicione as variáveis:
VITE_API_BASE_URL=https://api.lulibros.com/api
VITE_APP_ENV=production
VITE_DEBUG=false
```

### Netlify
```bash
# No painel da Netlify, adicione as variáveis:
VITE_API_BASE_URL=https://api.lulibros.com/api
VITE_APP_ENV=production
VITE_DEBUG=false
```

### Docker
```dockerfile
# No Dockerfile ou docker-compose.yml
ENV VITE_API_BASE_URL=https://api.lulibros.com/api
ENV VITE_APP_ENV=production
ENV VITE_DEBUG=false
```

## 🔍 Como Usar no Código

```typescript
import { config } from './config/env';

// Usar a URL da API
const response = await fetch(config.apiUrls.auth.login);

// Verificar se está em debug
if (config.debug) {
  console.log('Modo debug ativo');
}

// Obter informações da app
console.log(`${config.appName} v${config.appVersion}`);
```

## ⚠️ Importante

- **Todas as variáveis devem começar com `VITE_`** para serem acessíveis no frontend
- **Nunca commite o arquivo `.env`** (já está no .gitignore)
- **Sempre use `.env.example`** como template
- **Reinicie o servidor** após alterar as variáveis
