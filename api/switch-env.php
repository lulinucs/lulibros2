<?php

/**
 * Script para alternar entre ambientes
 * 
 * Uso:
 * php switch-env.php dev    - Define ambiente de desenvolvimento
 * php switch-env.php prod    - Define ambiente de produção
 * php switch-env.php status  - Mostra ambiente atual
 */

$environment = $argv[1] ?? 'status';

switch ($environment) {
    case 'dev':
    case 'development':
        putenv('ENVIRONMENT=development');
        $_ENV['ENVIRONMENT'] = 'development';
        $_SERVER['ENVIRONMENT'] = 'development';
        echo "✅ Ambiente definido como: DESENVOLVIMENTO\n";
        echo "📊 Banco: lulibros_dev (local)\n";
        break;
        
    case 'prod':
    case 'production':
        putenv('ENVIRONMENT=production');
        $_ENV['ENVIRONMENT'] = 'production';
        $_SERVER['ENVIRONMENT'] = 'production';
        echo "✅ Ambiente definido como: PRODUÇÃO\n";
        echo "📊 Banco: lulibros_prod (remoto)\n";
        break;
        
    case 'status':
    default:
        $currentEnv = $_ENV['ENVIRONMENT'] ?? $_SERVER['ENVIRONMENT'] ?? 'development';
        echo "🔍 Ambiente atual: " . strtoupper($currentEnv) . "\n";
        
        if ($currentEnv === 'development') {
            echo "📊 Banco: lulibros_dev (local)\n";
            echo "🌐 Host: localhost\n";
        } else {
            echo "📊 Banco: lulibros_prod (remoto)\n";
            echo "🌐 Host: seu-servidor-remoto.com\n";
        }
        break;
}

echo "\n💡 Para alterar o ambiente, use:\n";
echo "   php switch-env.php dev   (desenvolvimento)\n";
echo "   php switch-env.php prod  (produção)\n";

