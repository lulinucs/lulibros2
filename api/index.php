<?php

// Configurar tratamento de erros
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configurar timezone
date_default_timezone_set('America/Sao_Paulo');

// Incluir arquivo de rotas da API
require_once __DIR__ . '/routes/api.php';
