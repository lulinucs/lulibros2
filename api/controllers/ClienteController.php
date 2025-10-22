<?php

require_once __DIR__ . '/../models/Cliente.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ClienteController {
    private $cliente;

    public function __construct() {
        $this->cliente = new Cliente();
    }

    // Criar novo cliente
    public function criar() {
        AuthMiddleware::authenticate();
        
        $data = json_decode(file_get_contents("php://input"), true);

        $required_fields = ['nome', 'cpf'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                http_response_code(400);
                echo json_encode(['message' => "Campo {$field} é obrigatório"]);
                return;
            }
        }

        $nome = trim($data['nome']);
        $cpf = preg_replace('/[^0-9]/', '', $data['cpf']); // Remove formatação
        $email = isset($data['email']) ? trim($data['email']) : null;

        // Validar CPF
        if (!Cliente::validarCpf($cpf)) {
            http_response_code(400);
            echo json_encode(['message' => 'CPF inválido']);
            return;
        }

        // Verificar se CPF já existe
        if ($this->cliente->cpfExiste($cpf)) {
            http_response_code(400);
            echo json_encode(['message' => 'CPF já cadastrado']);
            return;
        }

        // Validar email se fornecido
        if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['message' => 'Email inválido']);
            return;
        }

        $cliente_id = $this->cliente->criar($nome, $cpf, $email);

        if ($cliente_id) {
            http_response_code(201);
            echo json_encode([
                'message' => 'Cliente cadastrado com sucesso',
                'cliente_id' => $cliente_id,
                'cliente' => [
                    'id' => $cliente_id,
                    'nome' => $nome,
                    'cpf' => Cliente::formatarCpf($cpf),
                    'email' => $email
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Erro ao cadastrar cliente']);
        }
    }

    // Listar clientes
    public function listar() {
        AuthMiddleware::authenticate();
        
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $search = isset($_GET['search']) ? $_GET['search'] : '';

        $clientes = $this->cliente->listar($page, $limit, $search);
        $total = $this->cliente->countAll($search);

        // Formatar CPF para exibição
        foreach ($clientes as &$cliente) {
            $cliente['cpf_formatado'] = Cliente::formatarCpf($cliente['cpf']);
        }

        http_response_code(200);
        echo json_encode([
            'clientes' => $clientes,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    // Obter cliente por ID
    public function obter($id) {
        AuthMiddleware::authenticate();
        
        $cliente = $this->cliente->getById($id);
        
        if (!$cliente) {
            http_response_code(404);
            echo json_encode(['message' => 'Cliente não encontrado']);
            return;
        }

        // Formatar CPF para exibição
        $cliente['cpf_formatado'] = Cliente::formatarCpf($cliente['cpf']);

        http_response_code(200);
        echo json_encode($cliente);
    }

    // Atualizar cliente
    public function atualizar($id) {
        AuthMiddleware::authenticate();
        
        $data = json_decode(file_get_contents("php://input"), true);

        $required_fields = ['nome', 'cpf'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                http_response_code(400);
                echo json_encode(['message' => "Campo {$field} é obrigatório"]);
                return;
            }
        }

        $nome = trim($data['nome']);
        $cpf = preg_replace('/[^0-9]/', '', $data['cpf']); // Remove formatação
        $email = isset($data['email']) ? trim($data['email']) : null;

        // Verificar se cliente existe
        $clienteExistente = $this->cliente->getById($id);
        if (!$clienteExistente) {
            http_response_code(404);
            echo json_encode(['message' => 'Cliente não encontrado']);
            return;
        }

        // Validar CPF
        if (!Cliente::validarCpf($cpf)) {
            http_response_code(400);
            echo json_encode(['message' => 'CPF inválido']);
            return;
        }

        // Verificar se CPF já existe (exceto o próprio cliente)
        if ($this->cliente->cpfExiste($cpf, $id)) {
            http_response_code(400);
            echo json_encode(['message' => 'CPF já cadastrado para outro cliente']);
            return;
        }

        // Validar email se fornecido
        if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['message' => 'Email inválido']);
            return;
        }

        $success = $this->cliente->atualizar($id, $nome, $cpf, $email);

        if ($success) {
            http_response_code(200);
            echo json_encode([
                'message' => 'Cliente atualizado com sucesso',
                'cliente' => [
                    'id' => $id,
                    'nome' => $nome,
                    'cpf' => Cliente::formatarCpf($cpf),
                    'email' => $email
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Erro ao atualizar cliente']);
        }
    }

    // Deletar cliente
    public function deletar($id) {
        AuthMiddleware::authenticate();
        
        // Verificar se cliente existe
        $cliente = $this->cliente->getById($id);
        if (!$cliente) {
            http_response_code(404);
            echo json_encode(['message' => 'Cliente não encontrado']);
            return;
        }

        $success = $this->cliente->deletar($id);

        if ($success) {
            http_response_code(200);
            echo json_encode(['message' => 'Cliente deletado com sucesso']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Erro ao deletar cliente']);
        }
    }

    // Buscar cliente por CPF
    public function buscarPorCpf($cpf) {
        AuthMiddleware::authenticate();
        
        $cpf = preg_replace('/[^0-9]/', '', $cpf); // Remove formatação
        
        if (!Cliente::validarCpf($cpf)) {
            http_response_code(400);
            echo json_encode(['message' => 'CPF inválido']);
            return;
        }

        $cliente = $this->cliente->getByCpf($cpf);
        
        if (!$cliente) {
            http_response_code(404);
            echo json_encode(['message' => 'Cliente não encontrado']);
            return;
        }

        // Formatar CPF para exibição
        $cliente['cpf_formatado'] = Cliente::formatarCpf($cliente['cpf']);

        http_response_code(200);
        echo json_encode($cliente);
    }

    // Obter estatísticas de clientes
    public function getEstatisticas() {
        AuthMiddleware::authenticate();
        
        $query = "SELECT 
                    COUNT(*) as total_clientes,
                    COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as clientes_com_email,
                    COUNT(CASE WHEN DATE(criado_em) = CURDATE() THEN 1 END) as clientes_hoje,
                    COUNT(CASE WHEN DATE(criado_em) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as clientes_semana,
                    COUNT(CASE WHEN DATE(criado_em) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as clientes_mes
                  FROM clientes";
        
        $stmt = $this->cliente->getConnection()->prepare($query);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode($result);
    }
}
