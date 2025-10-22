# Backend Lulibros

API REST em PHP para o sistema Lulibros.

## Configuração

### 1. Instalar dependências (se necessário)
```bash
composer install
```

### 2. Configurar variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
- `DB_HOST`: Host do MySQL (padrão: localhost)
- `DB_PORT`: Porta do MySQL (padrão: 3306)
- `DB_NAME`: Nome do banco de dados (lulibros)
- `DB_USER`: Usuário do MySQL
- `DB_PASS`: Senha do MySQL
- `JWT_SECRET`: Chave secreta para JWT (mude em produção!)
- `CORS_ORIGIN`: URL do frontend (padrão: http://localhost:3000)

### 3. Executar o servidor
```bash
# Desenvolvimento
php -S localhost:8000 -t . index.php

# Ou usando composer
composer run dev
```

## Estrutura do Projeto

```
backend/
├── config/           # Configurações
│   ├── database.php  # Conexão com banco
│   └── env.php       # Carregamento de variáveis
├── controllers/      # Controladores
│   └── AuthController.php
├── middleware/       # Middlewares
│   └── AuthMiddleware.php
├── models/          # Modelos
│   └── Admin.php
├── routes/          # Rotas
│   └── api.php
├── utils/           # Utilitários
│   ├── Cors.php     # Configuração CORS
│   └── JWT.php      # Geração e validação de JWT
├── index.php        # Ponto de entrada
└── composer.json    # Dependências
```

## Endpoints da API

### Autenticação

#### POST /api/auth/login
Login de administrador
```json
{
    "usuario": "admin",
    "senha": "senha123"
}
```

#### POST /api/auth/register
Registrar novo administrador
```json
{
    "usuario": "novo_admin",
    "senha": "senha123"
}
```

#### GET /api/auth/verify
Verificar token (requer autenticação)
Headers: `Authorization: Bearer <token>`

## Banco de Dados

O sistema espera uma tabela `admins` com a seguinte estrutura:

```sql
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Deploy

Para facilitar o deploy:

1. Configure as variáveis de ambiente no servidor
2. Aponte o servidor web para a pasta `backend/`
3. Configure o DocumentRoot para `backend/index.php`
4. Certifique-se de que o PHP tem acesso ao MySQL

### Exemplo de configuração Apache (.htaccess)
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ index.php [QSA,L]
```

### Exemplo de configuração Nginx
```nginx
location /api/ {
    try_files $uri $uri/ /index.php?$query_string;
}
```
