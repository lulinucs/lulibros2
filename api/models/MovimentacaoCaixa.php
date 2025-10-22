<?php

require_once __DIR__ . '/../config/database.php';

class MovimentacaoCaixa {
    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    // Criar nova movimentação
    public function criar($caixa_id, $tipo, $valor, $motivo, $admin_id) {
        $query = "INSERT INTO movimentacoes_caixa (caixa_id, tipo, valor, motivo, admin_id) 
                  VALUES (:caixa_id, :tipo, :valor, :motivo, :admin_id)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':caixa_id', $caixa_id);
        $stmt->bindParam(':tipo', $tipo);
        $stmt->bindParam(':valor', $valor);
        $stmt->bindParam(':motivo', $motivo);
        $stmt->bindParam(':admin_id', $admin_id);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Listar movimentações de um caixa
    public function listarPorCaixa($caixa_id) {
        $query = "SELECT m.*, a.usuario as admin_nome
                  FROM movimentacoes_caixa m
                  LEFT JOIN admins a ON m.admin_id = a.id
                  WHERE m.caixa_id = :caixa_id
                  ORDER BY m.data_movimentacao DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':caixa_id', $caixa_id);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Listar todas as movimentações com paginação
    public function listar($page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;
        
        $query = "SELECT m.*, a.usuario as admin_nome, c.data_abertura
                  FROM movimentacoes_caixa m
                  LEFT JOIN admins a ON m.admin_id = a.id
                  LEFT JOIN caixa c ON m.caixa_id = c.id
                  ORDER BY m.data_movimentacao DESC
                  LIMIT :offset, :limit";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Contar total de movimentações
    public function countAll() {
        $query = "SELECT COUNT(*) as total FROM movimentacoes_caixa";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)$result['total'];
    }

    // Obter resumo de movimentações de um caixa
    public function getResumoPorCaixa($caixa_id) {
        $query = "SELECT 
                    COUNT(*) as total_movimentacoes,
                    SUM(CASE WHEN tipo = 'insercao' THEN valor ELSE 0 END) as total_inserido,
                    SUM(CASE WHEN tipo = 'retirada' THEN valor ELSE 0 END) as total_retirado,
                    SUM(CASE WHEN tipo = 'insercao' THEN valor ELSE -valor END) as saldo_liquido
                  FROM movimentacoes_caixa 
                  WHERE caixa_id = :caixa_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':caixa_id', $caixa_id);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Obter movimentações por período
    public function listarPorPeriodo($data_inicio, $data_fim, $page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;
        
        $query = "SELECT m.*, a.usuario as admin_nome, c.data_abertura
                  FROM movimentacoes_caixa m
                  LEFT JOIN admins a ON m.admin_id = a.id
                  LEFT JOIN caixa c ON m.caixa_id = c.id
                  WHERE DATE(m.data_movimentacao) BETWEEN :data_inicio AND :data_fim
                  ORDER BY m.data_movimentacao DESC
                  LIMIT :offset, :limit";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':data_inicio', $data_inicio);
        $stmt->bindParam(':data_fim', $data_fim);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Contar movimentações por período
    public function countPorPeriodo($data_inicio, $data_fim) {
        $query = "SELECT COUNT(*) as total 
                  FROM movimentacoes_caixa 
                  WHERE DATE(data_movimentacao) BETWEEN :data_inicio AND :data_fim";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':data_inicio', $data_inicio);
        $stmt->bindParam(':data_fim', $data_fim);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)$result['total'];
    }

    // Obter estatísticas gerais
    public function getEstatisticas() {
        $query = "SELECT 
                    COUNT(*) as total_movimentacoes,
                    SUM(CASE WHEN tipo = 'insercao' THEN valor ELSE 0 END) as total_inserido_geral,
                    SUM(CASE WHEN tipo = 'retirada' THEN valor ELSE 0 END) as total_retirado_geral,
                    SUM(CASE WHEN tipo = 'insercao' THEN valor ELSE -valor END) as saldo_liquido_geral,
                    AVG(CASE WHEN tipo = 'insercao' THEN valor ELSE 0 END) as media_inserido,
                    AVG(CASE WHEN tipo = 'retirada' THEN valor ELSE 0 END) as media_retirado
                  FROM movimentacoes_caixa";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Método público para obter a conexão
    public function getConnection() {
        return $this->conn;
    }
}
