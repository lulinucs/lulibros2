# Lulibros 2.0 - Sistema de Gestão de Banca

Sistema desenvolvido para facilitar a gestão de vendas de livros em feiras, substituindo o uso cansativo de planilhas por uma solução prática e eficiente. Criado para controlar estoque, registrar vendas e gerenciar clientes de forma remota durante feiras de livros.

## 🎯 **Solução para Feiras de Livros**

### **Problema Resolvido**
- **Substitui planilhas** cansativas por interface web intuitiva
- **Gestão remota** da feira sem precisar estar fisicamente presente
- **Controle de estoque** em tempo real durante as vendas
- **Relatórios automáticos** para análise de performance

### **Funcionalidades Principais**
- **Leitura de código de barras** via câmera do celular
- **Carrinho de compras** responsivo para vendas rápidas
- **Upload de estoque** por planilha CSV
- **Controle de caixa** com fechamento automatizado
- **Gestão de clientes** com histórico de compras
- **Relatórios detalhados** em Excel para análise

## 🚀 Tecnologias

### Backend (API)
- **PHP 8.0+** com PDO para conexões seguras
- **MySQL** com suporte completo a Unicode
- **JWT** para autenticação stateless
- **Middleware** de segurança e logs
- **CORS** configurado para produção

### Frontend
- **React 18** com hooks modernos
- **TypeScript** para tipagem segura
- **Vite** para build otimizado
- **Tailwind CSS** para interface responsiva
- **Axios** para requisições HTTP

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

### ✅ **Sistema de Vendas Otimizado**
- [x] **Leitura de código de barras** via câmera do celular
- [x] **Carrinho de compras** intuitivo e responsivo
- [x] **Registro rápido de vendas** otimizado para mobile
- [x] **Histórico detalhado** de todas as transações
- [x] **Controle de estoque** em tempo real

### ✅ **Gestão Completa**
- [x] **Autenticação JWT** com controle de usuários
- [x] **Logs de auditoria** para todas as operações
- [x] **Gestão de produtos** com upload em lote via CSV
- [x] **Consulta avançada** com filtros por tipo de estoque
- [x] **Gestão de clientes** com histórico de compras
- [x] **Sistema financeiro** com controle de caixa
- [x] **Relatórios detalhados** em planilha Excel

### ✅ **Segurança e Performance**
- [x] **Middleware de segurança** com validação de dados
- [x] **Sanitização automática** de inputs
- [x] **Logs de segurança** para monitoramento
- [x] **Ambientes separados** (dev/prod) com configurações específicas
- [x] **Interface responsiva** otimizada para celular
- [x] **HTTPS configurado** para uso da câmera

### 🔄 **Próximas Versões**
- [ ] Dashboard com estatísticas em tempo real
- [ ] Notificações push para alertas
- [ ] Backup automático com sincronização
- [ ] Integração com sistemas de pagamento
- [ ] App mobile nativo

## 💡 **Gestão Remota de Feiras**

### **Controle Total à Distância**
- **Acesso via web** de qualquer lugar com internet
- **Monitoramento em tempo real** das vendas e estoque
- **Controle de caixa** com fechamento automatizado
- **Relatórios instantâneos** para acompanhar performance
- **Backup automático** dos dados para segurança

### **Operação Simplificada**
- **Interface intuitiva** que qualquer pessoa consegue usar
- **Vendas rápidas** com código de barras via celular
- **Upload de estoque** por planilha para facilitar setup
- **Gestão de clientes** com histórico completo
- **Relatórios em Excel** para análise posterior

## 🗄️ Banco de Dados

### **Tabelas principais:**
- `admins` - Usuários do sistema
- `livros` - Catálogo de livros
- `precos` - Preços por tipo de estoque (Novo/Saldo)
- `estoque` - Controle de estoque
- `clientes` - Cadastro de clientes
- `vendas` - Registro de vendas
- `caixa` - Controle de caixa
- `movimentacoes_caixa` - Movimentações financeiras

## 🛠️ **Tecnologias Utilizadas**

### **Backend**
- **PHP 8.0+** com PDO para conexões seguras
- **MySQL** com suporte completo a acentos
- **JWT** para autenticação
- **API REST** para comunicação com frontend

### **Frontend**
- **React 18** com TypeScript
- **Vite** para build otimizado
- **Tailwind CSS** para interface responsiva
- **Axios** para requisições HTTP

### **Recursos Especiais**
- **HTTPS configurado** para uso da câmera (código de barras)
- **Certificados SSL** prontos para produção
- **Interface responsiva** otimizada para celular
- **Upload de CSV** para importação de estoque

## 🔧 Configuração de Ambientes

### **Desenvolvimento**
```bash
# API - Ambiente local
php switch-env.php dev

# Frontend - Desenvolvimento
VITE_APP_ENV=development
VITE_DEBUG=true
```

### **Produção**
```bash
# API - Servidor de produção
php switch-env.php prod

# Frontend - Build otimizado
VITE_APP_ENV=production
VITE_DEBUG=false
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

## 🎯 **Por que Criar Este Sistema?**

### **Problema Real**
- **Planilhas são cansativas** e propensas a erros
- **Gestão manual** é ineficiente durante feiras
- **Falta de controle** sobre vendas e estoque em tempo real
- **Dificuldade** para gerenciar feiras remotamente

### **Solução Prática**
- **Interface web** acessível de qualquer lugar
- **Operação simplificada** para qualquer pessoa usar
- **Controle total** do estoque e vendas
- **Relatórios automáticos** para análise
- **Backup seguro** dos dados

## 📞 Contato

Desenvolvido por um programador independente para facilitar a gestão de feiras de livros.

---

**Lulibros 2.0** - Sistema de Gestão de Banca de Livros  
*Solução prática para substituir planilhas em feiras de livros*
