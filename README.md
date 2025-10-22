# Lulibros 2.0 - Sistema de Gestão de Banca

Sistema completo de gestão de banca de livros com API em PHP e frontend em React/TypeScript.

## 🚀 Tecnologias

### Backend (API)
- **PHP 8.0+**
- **MySQL**
- **PDO** para conexão com banco
- **JWT** para autenticação
- **CORS** habilitado

### Frontend
- **React 18**
- **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS**
- **Axios** para requisições

## 📁 Estrutura do Projeto

```
lulibros2/
├── api/                    # Backend PHP
│   ├── config/            # Configurações
│   ├── controllers/       # Controladores
│   ├── models/           # Modelos de dados
│   ├── middleware/       # Middlewares
│   ├── routes/          # Rotas da API
│   └── utils/           # Utilitários
├── frontend/             # Frontend React
│   ├── components/       # Componentes React
│   ├── config/          # Configurações
│   ├── utils/           # Utilitários
│   └── dist/            # Build de produção
└── upload/              # Arquivos de upload
```

## 🛠️ Instalação e Configuração

### 1. Clone o repositório
```bash
git clone <seu-repositorio-privado>
cd lulibros2
```

### 2. Configurar Backend (API)

#### Instalar dependências PHP
```bash
cd api
composer install
```

#### Configurar banco de dados
1. Copie `config/development.env` e ajuste as configurações:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lulibros_dev
DB_USER=root
DB_PASS=
```

2. Crie o banco de dados:
```sql
CREATE DATABASE lulibros_dev;
```

#### Iniciar servidor PHP
```bash
cd api
php -S localhost:8000 -t .
```

### 3. Configurar Frontend

#### Instalar dependências
```bash
cd frontend
npm install
```

#### Configurar variáveis de ambiente
Crie um arquivo `.env` na pasta `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_ENV=development
```

#### Iniciar servidor de desenvolvimento
```bash
cd frontend
npm run dev
```

## 🌐 Acesso

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000/api

## 📋 Funcionalidades

### ✅ Implementadas
- [x] Autenticação JWT
- [x] Gestão de produtos (livros)
- [x] Upload de CSV (livros, preços, estoque)
- [x] Consulta de produtos com filtros
- [x] Gestão de clientes
- [x] Sistema de vendas
- [x] Gestão financeira (caixa)
- [x] Relatórios
- [x] Interface responsiva

### 🔄 Em desenvolvimento
- [ ] Dashboard com estatísticas
- [ ] Notificações
- [ ] Backup automático
- [ ] Integração com APIs externas

## 🗄️ Banco de Dados

### Tabelas principais:
- `admins` - Usuários do sistema
- `livros` - Catálogo de livros
- `precos` - Preços por tipo de estoque
- `estoque` - Controle de estoque
- `clientes` - Cadastro de clientes
- `vendas` - Registro de vendas
- `caixa` - Controle de caixa
- `movimentacoes_caixa` - Movimentações financeiras

## 🔧 Configuração de Ambientes

### Desenvolvimento
```bash
# API
php switch-env.php dev

# Frontend
VITE_APP_ENV=development
```

### Produção
```bash
# API
php switch-env.php prod

# Frontend
VITE_APP_ENV=production
```

## 📝 Scripts Úteis

### Backend
```bash
# Testar conexão
php test-connection.php

# Verificar ambiente
php switch-env.php status
```

### Frontend
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🚀 Deploy

### Backend
1. Configure o servidor web (Apache/Nginx)
2. Configure o banco de dados de produção
3. Ajuste as variáveis de ambiente
4. Execute `composer install --no-dev`

### Frontend
1. Execute `npm run build`
2. Configure o servidor web para servir a pasta `dist/`

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação ou entre em contato com a equipe de desenvolvimento.

---

**Lulibros 2.0** - Sistema de Gestão de Banca de Livros
