<?php

// Configurações de Produção
return [
    'database' => [
        'host' => 'localhost',
        'port' => '3306',
        'name' => 'lulibros',
        'user' => 'root',
        'pass' => '',
        'charset' => 'utf8mb4'
    ],
    'app' => [
        'env' => 'production',
        'debug' => false,
        'jwt_secret' => 'lulibros_secret_key_production_2024',
        'server_port' => '8000',
        'cors_origin' => 'https://pdv.surlivro.com.br'
    ],
    'upload' => [
        'max_size' => 10485760, // 10MB
        'allowed_types' => ['csv', 'txt']
    ],
    'log' => [
        'level' => 'error',
        'file' => 'logs/app.log'
    ]
];
