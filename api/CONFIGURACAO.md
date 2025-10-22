# Sistema de Configuração - Lulibros

## Como alternar entre Desenvolvimento e Produção

### 1. Arquivos de Configuração

O sistema agora usa arquivos `.env` específicos para cada ambiente:

- **Desenvolvimento**: `config/development.env`
- **Produção**: `config/production.env`

### 2. Como definir o ambiente

#### Opção 1: Variável de ambiente do sistema
```bash
# Para desenvolvimento (padrão)
export ENVIRONMENT=development

# Para produção
export ENVIRONMENT=production
```

#### Opção 2: No servidor web (Apache/Nginx)
```apache
# No .htaccess ou configuração do Apache
SetEnv ENVIRONMENT production
```

#### Opção 3: No PHP (temporário)
```php
// No início do seu script PHP
$_SERVER['ENVIRONMENT'] = 'production';
```

### 3. Configurações por Ambiente

#### Desenvolvimento (`development.env`)
- Banco: localhost/lulibros
- Debug: habilitado
- CORS: http://localhost:3000
- JWT: chave de desenvolvimento

#### Produção (`production.env`)
- Banco: configurações de produção
- Debug: desabilitado
- CORS: https://pdv.surlivro.com.br
- JWT: chave de produção

### 4. Verificar qual ambiente está ativo

Adicione este código temporário para verificar:

```php
echo "Ambiente atual: " . ($_ENV['APP_ENV'] ?? 'não definido');
echo "Debug: " . ($_ENV['APP_DEBUG'] ?? 'não definido');
echo "Banco: " . ($_ENV['DB_NAME'] ?? 'não definido');
```

### 5. Migração do sistema antigo

O sistema antigo (`production.php`) ainda existe mas não é mais usado.
Você pode removê-lo quando confirmar que o novo sistema está funcionando.

### 6. Exemplo de uso

```php
// O sistema carrega automaticamente as configurações
// baseado na variável ENVIRONMENT

require_once 'config/env.php'; // Carrega as configurações
require_once 'config/database.php'; // Usa as configurações carregadas

$db = new Database();
$conn = $db->getConnection();
```

## Troubleshooting

### Problema: "Arquivo .env não encontrado"
**Solução**: Verifique se o arquivo `config/{environment}.env` existe

### Problema: Configurações não carregam
**Solução**: Verifique se a variável `ENVIRONMENT` está definida corretamente

### Problema: Banco de dados não conecta
**Solução**: Verifique as configurações de banco no arquivo `.env` do ambiente correto
