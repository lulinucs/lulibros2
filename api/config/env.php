<?php

/**
 * Sistema de Configuração Simplificado
 * 
 * Para alternar entre ambientes:
 * 1. Desenvolvimento: Use development.env
 * 2. Produção: Use production.env
 * 
 * Para definir o ambiente, defina a variável ENVIRONMENT:
 * - development (padrão)
 * - production
 */

// Carrega variáveis de ambiente do arquivo .env
function loadEnv($path) {
    if (!file_exists($path)) {
        throw new Exception("Arquivo .env não encontrado em: " . $path);
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);

        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Determina qual ambiente usar
$environment = $_SERVER['ENVIRONMENT'] ?? $_ENV['ENVIRONMENT'] ?? 'development';

// Define o caminho do arquivo de configuração baseado no ambiente
$envFile = __DIR__ . "/{$environment}.env";

// Carrega as configurações do ambiente selecionado
if (file_exists($envFile)) {
    loadEnv($envFile);
} else {
    // Fallback para desenvolvimento se o arquivo não existir
    $devFile = __DIR__ . '/development.env';
    if (file_exists($devFile)) {
        loadEnv($devFile);
    } else {
        // Valores padrão de emergência
        $_ENV['DB_HOST'] = 'localhost';
        $_ENV['DB_PORT'] = '3306';
        $_ENV['DB_NAME'] = 'lulibros';
        $_ENV['DB_USER'] = 'root';
        $_ENV['DB_PASS'] = '';
        $_ENV['APP_ENV'] = 'development';
        $_ENV['APP_DEBUG'] = 'true';
        $_ENV['JWT_SECRET'] = 'lulibros_secret_key_dev';
        $_ENV['SERVER_PORT'] = '8000';
        $_ENV['CORS_ORIGIN'] = 'http://localhost:3000';
    }
}
