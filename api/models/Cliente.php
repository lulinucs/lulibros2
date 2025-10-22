<?php

require_once __DIR__ . '/../config/database.php';

class Cliente {
    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    // Criar novo cliente
    public function criar($nome, $cpf, $email = null) {
        $query = "INSERT INTO clientes (nome, cpf, email) VALUES (:nome, :cpf, :email)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nome', $nome);
        $stmt->bindParam(':cpf', $cpf);
        $stmt->bindParam(':email', $email);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Buscar cliente por ID
    public function getById($id) {
        $query = "SELECT * FROM clientes WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Buscar cliente por CPF
    public function getByCpf($cpf) {
        $query = "SELECT * FROM clientes WHERE cpf = :cpf";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':cpf', $cpf);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Listar todos os clientes com paginação
    public function listar($page = 1, $limit = 20, $search = '') {
        $offset = ($page - 1) * $limit;
        
        $query = "SELECT * FROM clientes";
        $params = [];
        
        if ($search) {
            $query .= " WHERE nome LIKE :search OR cpf LIKE :search OR email LIKE :search";
            $params[':search'] = "%{$search}%";
        }
        
        $query .= " ORDER BY criado_em DESC LIMIT :offset, :limit";
        
        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Contar total de clientes
    public function countAll($search = '') {
        $query = "SELECT COUNT(*) as total FROM clientes";
        $params = [];
        
        if ($search) {
            $query .= " WHERE nome LIKE :search OR cpf LIKE :search OR email LIKE :search";
            $params[':search'] = "%{$search}%";
        }
        
        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)$result['total'];
    }

    // Atualizar cliente
    public function atualizar($id, $nome, $cpf, $email = null) {
        $query = "UPDATE clientes SET nome = :nome, cpf = :cpf, email = :email WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':nome', $nome);
        $stmt->bindParam(':cpf', $cpf);
        $stmt->bindParam(':email', $email);
        
        return $stmt->execute();
    }

    // Deletar cliente
    public function deletar($id) {
        $query = "DELETE FROM clientes WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    // Verificar se CPF já existe (exceto o próprio cliente)
    public function cpfExiste($cpf, $excluirId = null) {
        $query = "SELECT COUNT(*) as total FROM clientes WHERE cpf = :cpf";
        
        if ($excluirId) {
            $query .= " AND id != :excluir_id";
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':cpf', $cpf);
        
        if ($excluirId) {
            $stmt->bindParam(':excluir_id', $excluirId);
        }
        
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)$result['total'] > 0;
    }

    // Formatar CPF para exibição
    public static function formatarCpf($cpf) {
        return preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $cpf);
    }

    // Validar CPF
    public static function validarCpf($cpf) {
        // Remove caracteres não numéricos
        $cpf = preg_replace('/[^0-9]/', '', $cpf);
        
        // Verifica se tem 11 dígitos
        if (strlen($cpf) !== 11) {
            return false;
        }
        
        // Verifica se não são todos os dígitos iguais
        if (preg_match('/(\d)\1{10}/', $cpf)) {
            return false;
        }
        
        // Validação do algoritmo do CPF
        for ($t = 9; $t < 11; $t++) {
            for ($d = 0, $c = 0; $c < $t; $c++) {
                $d += $cpf[$c] * (($t + 1) - $c);
            }
            $d = ((10 * $d) % 11) % 10;
            if ($cpf[$c] != $d) {
                return false;
            }
        }
        
        return true;
    }

    // Método público para obter a conexão
    public function getConnection() {
        return $this->conn;
    }

    // Verificar se cliente existe por ID
    public function existe($id) {
        $query = "SELECT id FROM clientes WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
}
