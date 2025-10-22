<?php

class Cors {
    public static function handle() {
        $origin = $_ENV['CORS_ORIGIN'] ?? 'http://localhost:3000';
        
        // Permitir múltiplas origens se necessário
        $allowedOrigins = explode(',', $origin);
        $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        // Se não há origem específica, permitir localhost:3000
        if (empty($requestOrigin)) {
            $requestOrigin = 'http://localhost:3000';
        }
        
        if (in_array($requestOrigin, $allowedOrigins) || in_array('*', $allowedOrigins) || strpos($requestOrigin, 'localhost:3000') !== false) {
            header("Access-Control-Allow-Origin: " . $requestOrigin);
        }
        
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Max-Age: 86400"); // 24 horas
        
        // Responder a requisições OPTIONS (preflight)
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
}
