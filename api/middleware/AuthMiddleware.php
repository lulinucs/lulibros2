<?php

require_once __DIR__ . '/../utils/JWT.php';

class AuthMiddleware {
    public static function authenticate() {
        $token = null;

        // Buscar token no header Authorization
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
            if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                $token = $matches[1];
            }
        }

        // Fallback para getallheaders() se disponível
        if (!$token && function_exists('getallheaders')) {
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                $authHeader = $headers['Authorization'];
                if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                    $token = $matches[1];
                }
            }
            if (!$token && isset($headers['authorization'])) {
                $authHeader = $headers['authorization'];
                if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                    $token = $matches[1];
                }
            }
        }

        if (!$token) {
            http_response_code(401);
            echo json_encode(['message' => 'Token de acesso requerido']);
            exit;
        }

        try {
            $payload = JWT::decode($token);
            return $payload;
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['message' => 'Token inválido: ' . $e->getMessage()]);
            exit;
        }
    }

    public static function optionalAuth() {
        $token = null;

        // Buscar token no header Authorization
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
            if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                $token = $matches[1];
            }
        }

        // Fallback para getallheaders() se disponível
        if (!$token && function_exists('getallheaders')) {
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                $authHeader = $headers['Authorization'];
                if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                    $token = $matches[1];
                }
            }
            if (!$token && isset($headers['authorization'])) {
                $authHeader = $headers['authorization'];
                if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                    $token = $matches[1];
                }
            }
        }

        if (!$token) {
            return null;
        }

        try {
            $payload = JWT::decode($token);
            return $payload;
        } catch (Exception $e) {
            return null;
        }
    }
}
