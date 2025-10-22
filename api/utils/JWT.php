<?php

class JWT {
    private static $secret;

    public static function init() {
        self::$secret = $_ENV['JWT_SECRET'] ?? 'lulibros_secret_key';
    }

    public static function encode($payload) {
        self::init();
        
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($payload);
        
        $headerEncoded = self::base64UrlEncode($header);
        $payloadEncoded = self::base64UrlEncode($payload);
        
        $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, self::$secret, true);
        $signatureEncoded = self::base64UrlEncode($signature);
        
        return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
    }

    public static function decode($token) {
        self::init();
        
        $tokenParts = explode('.', $token);
        if (count($tokenParts) !== 3) {
            throw new Exception('Token inválido');
        }

        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $tokenParts;
        
        $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, self::$secret, true);
        $signatureFromToken = self::base64UrlDecode($signatureEncoded);
        
        if (!hash_equals($signature, $signatureFromToken)) {
            throw new Exception('Assinatura inválida');
        }
        
        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
        
        // Verificar se o token não expirou
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception('Token expirado');
        }
        
        return $payload;
    }

    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }

    public static function generateToken($adminId, $usuario) {
        $payload = [
            'admin_id' => $adminId,
            'usuario' => $usuario,
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60) // 24 horas
        ];
        
        return self::encode($payload);
    }
}
