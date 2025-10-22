<?php

require_once __DIR__ . '/../models/Admin.php';
require_once __DIR__ . '/../utils/JWT.php';

class AuthController {
    private $admin;

    public function __construct() {
        $this->admin = new Admin();
    }

    public function login() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['usuario']) || !isset($data['senha'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Usuário e senha são obrigatórios']);
            return;
        }

        $usuario = $data['usuario'];
        $senha = $data['senha'];

        // Buscar admin pelo usuário
        if (!$this->admin->findByUsuario($usuario)) {
            http_response_code(401);
            echo json_encode(['message' => 'Credenciais inválidas']);
            return;
        }

        // Verificar senha
        if (!$this->admin->verifyPassword($senha)) {
            http_response_code(401);
            echo json_encode(['message' => 'Credenciais inválidas']);
            return;
        }

        // Gerar token JWT
        $token = JWT::generateToken($this->admin->id, $this->admin->usuario);

        http_response_code(200);
        echo json_encode([
            'message' => 'Login realizado com sucesso',
            'token' => $token,
            'admin' => [
                'id' => $this->admin->id,
                'usuario' => $this->admin->usuario,
                'criado_em' => $this->admin->criado_em
            ]
        ]);
    }

    public function register() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['usuario']) || !isset($data['senha'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Usuário e senha são obrigatórios']);
            return;
        }

        $usuario = $data['usuario'];
        $senha = $data['senha'];

        // Validar dados
        if (strlen($usuario) < 3) {
            http_response_code(400);
            echo json_encode(['message' => 'Usuário deve ter pelo menos 3 caracteres']);
            return;
        }

        if (strlen($senha) < 6) {
            http_response_code(400);
            echo json_encode(['message' => 'Senha deve ter pelo menos 6 caracteres']);
            return;
        }

        // Verificar se usuário já existe
        if ($this->admin->usuarioExists($usuario)) {
            http_response_code(409);
            echo json_encode(['message' => 'Usuário já existe']);
            return;
        }

        // Criar novo admin
        $this->admin->usuario = $usuario;
        $this->admin->senha_hash = Admin::hashPassword($senha);

        if ($this->admin->create()) {
            http_response_code(201);
            echo json_encode(['message' => 'Admin criado com sucesso']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Erro ao criar admin']);
        }
    }

    public function verify() {
        require_once __DIR__ . '/../middleware/AuthMiddleware.php';
        
        $payload = AuthMiddleware::authenticate();
        
        http_response_code(200);
        echo json_encode([
            'message' => 'Token válido',
            'admin' => [
                'id' => $payload['admin_id'],
                'usuario' => $payload['usuario']
            ]
        ]);
    }

    public function validatePassword() {
        AuthMiddleware::authenticate();
        
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['senha'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Senha é obrigatória']);
            return;
        }

        $senha = $data['senha'];

        // Buscar admin atual pelo token
        $payload = AuthMiddleware::authenticate();
        if (!$this->admin->findByUsuario($payload['usuario'])) {
            http_response_code(404);
            echo json_encode(['message' => 'Admin não encontrado']);
            return;
        }

        // Verificar senha
        if (!$this->admin->verifyPassword($senha)) {
            http_response_code(401);
            echo json_encode(['message' => 'Senha incorreta']);
            return;
        }

        http_response_code(200);
        echo json_encode(['message' => 'Senha válida']);
    }
}
