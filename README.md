# Lulibros 2.0 - Sistema de Gestão de Banca

**Segunda versão** do sistema de gestão de vendas de livros em feiras. Esta versão representa uma **evolução significativa** da [versão anterior](https://github.com/lulinucs/lulibros), com **arquitetura completamente reformulada** e **funcionalidades aprimoradas**.

## 🚀 **Principais Melhorias da V2**

### **Arquitetura Moderna**
- **Backend PHP** com API REST robusta (substituindo Node.js)
- **Frontend React** com TypeScript e Vite
- **Banco MySQL** com suporte completo a acentos
- **Autenticação JWT** para segurança aprimorada

### **Controle de Usuários**
- **Sistema de login** com múltiplos usuários
- **Controle de acesso** por perfil
- **Logs de auditoria** para rastreabilidade
- **Sessões seguras** com JWT

### **Otimizações de Caixa**
- **Fechamento automático** de caixa
- **Controle financeiro** em tempo real
- **Relatórios detalhados** de movimentações
- **Backup automático** dos dados

## 🎯 **Funcionalidades**

- **Gestão de produtos** com upload por CSV
- **Controle de estoque** em tempo real
- **Sistema de vendas** com carrinho de compras
- **Gestão de clientes** com histórico
- **Controle financeiro** com fechamento de caixa
- **Relatórios** em Excel para análise

## 🚀 **Tecnologias**

### Backend
- **PHP 8.0+** com PDO
- **MySQL** com suporte a acentos
- **JWT** para autenticação
- **API REST** para comunicação

### Frontend
- **React 18** com TypeScript
- **Vite** para build otimizado
- **Tailwind CSS** para interface responsiva
- **Axios** para requisições HTTP

## 📁 **Estrutura do Projeto**

```
lulibros2/
├── api/                    # Backend PHP
│   ├── config/            # Configurações
│   ├── controllers/       # Controladores
│   ├── models/           # Modelos de dados
│   └── routes/           # Rotas da API
├── frontend/             # Frontend React
│   ├── components/       # Componentes React
│   └── dist/            # Build de produção
└── upload/              # Arquivos de upload
```

## 🛠️ **Instalação**

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd lulibros2
```

### 2. Configurar Backend
```bash
cd api
composer install
# Configure o banco em config/development.env
php -S localhost:8000 -t .
```

### 3. Configurar Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🌐 **Acesso**

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000/api

## 🗄️ **Banco de Dados**

### Tabelas principais:
- `admins` - Usuários do sistema
- `livros` - Catálogo de livros
- `precos` - Preços por tipo de estoque
- `estoque` - Controle de estoque
- `clientes` - Cadastro de clientes
- `vendas` - Registro de vendas
- `caixa` - Controle de caixa
- `movimentacoes_caixa` - Movimentações financeiras

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

## 📞 **Contato**

Desenvolvido por um programador independente para facilitar a gestão de feiras de livros.

---

**Lulibros 2.0** - Sistema de Gestão de Banca de Livros  
*Solução prática para substituir planilhas em feiras de livros*