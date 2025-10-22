<?php

require_once __DIR__ . '/../config/database.php';

class Estoque {
    private $conn;
    private $table_name = "estoque";

    public $id;
    public $livro_id;
    public $tipo_estoque;
    public $quantidade;
    public $atualizado_em;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    // Criar um novo registro de estoque
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET livro_id=:livro_id, tipo_estoque=:tipo_estoque, quantidade=:quantidade";

        $stmt = $this->conn->prepare($query);

        // Sanitizar dados
        $this->livro_id = htmlspecialchars(strip_tags($this->livro_id));
        $this->tipo_estoque = htmlspecialchars(strip_tags($this->tipo_estoque));
        $this->quantidade = htmlspecialchars(strip_tags($this->quantidade));

        // Bind dos parâmetros
        $stmt->bindParam(":livro_id", $this->livro_id);
        $stmt->bindParam(":tipo_estoque", $this->tipo_estoque);
        $stmt->bindParam(":quantidade", $this->quantidade);

        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    // Buscar estoque por livro e tipo
    public function findByLivroAndTipo($livro_id, $tipo_estoque) {
        $query = "SELECT id, livro_id, tipo_estoque, quantidade, atualizado_em 
                  FROM " . $this->table_name . " 
                  WHERE livro_id = :livro_id AND tipo_estoque = :tipo_estoque 
                  LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":livro_id", $livro_id);
        $stmt->bindParam(":tipo_estoque", $tipo_estoque);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->livro_id = $row['livro_id'];
            $this->tipo_estoque = $row['tipo_estoque'];
            $this->quantidade = $row['quantidade'];
            $this->atualizado_em = $row['atualizado_em'];
            return true;
        }
        return false;
    }

    // Atualizar quantidade de estoque
    public function updateQuantidade() {
        $query = "UPDATE " . $this->table_name . " 
                  SET quantidade=:quantidade, atualizado_em=CURRENT_TIMESTAMP 
                  WHERE livro_id=:livro_id AND tipo_estoque=:tipo_estoque";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":quantidade", $this->quantidade);
        $stmt->bindParam(":livro_id", $this->livro_id);
        $stmt->bindParam(":tipo_estoque", $this->tipo_estoque);

        return $stmt->execute();
    }

    // Adicionar quantidade ao estoque existente
    public function adicionarQuantidade($quantidade_adicionar) {
        $query = "UPDATE " . $this->table_name . " 
                  SET quantidade=quantidade + :quantidade_adicionar, 
                      atualizado_em=CURRENT_TIMESTAMP 
                  WHERE livro_id=:livro_id AND tipo_estoque=:tipo_estoque";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":quantidade_adicionar", $quantidade_adicionar);
        $stmt->bindParam(":livro_id", $this->livro_id);
        $stmt->bindParam(":tipo_estoque", $this->tipo_estoque);

        return $stmt->execute();
    }

    // Criar ou atualizar estoque
    public function createOrUpdate($operacao = 'substituir') {
        // Verificar se já existe sem modificar as propriedades
        $query = "SELECT id FROM " . $this->table_name . " 
                  WHERE livro_id = :livro_id AND tipo_estoque = :tipo_estoque 
                  LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":livro_id", $this->livro_id);
        $stmt->bindParam(":tipo_estoque", $this->tipo_estoque);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            if ($operacao === 'adicionar') {
                return $this->adicionarQuantidade($this->quantidade);
            } else {
                return $this->updateQuantidade();
            }
        } else {
            return $this->create();
        }
    }

    // Listar estoque com informações do livro
    public function readAllWithLivro($from_record_num = 0, $records_per_page = 20) {
        $query = "SELECT e.id, e.livro_id, e.tipo_estoque, e.quantidade, e.atualizado_em,
                         l.isbn, l.titulo, l.autor, l.editora
                  FROM " . $this->table_name . " e
                  INNER JOIN livros l ON e.livro_id = l.id
                  ORDER BY e.atualizado_em DESC 
                  LIMIT :from_record_num, :records_per_page";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":from_record_num", $from_record_num, PDO::PARAM_INT);
        $stmt->bindParam(":records_per_page", $records_per_page, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Buscar estoque por ISBN
    public function findByIsbn($isbn, $tipo_estoque = null) {
        $query = "SELECT e.id, e.livro_id, e.tipo_estoque, e.quantidade, e.atualizado_em,
                         l.isbn, l.titulo, l.autor, l.editora
                  FROM " . $this->table_name . " e
                  INNER JOIN livros l ON e.livro_id = l.id
                  WHERE l.isbn = :isbn";
        
        if ($tipo_estoque) {
            $query .= " AND e.tipo_estoque = :tipo_estoque";
        }
        
        $query .= " LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":isbn", $isbn);
        if ($tipo_estoque) {
            $stmt->bindParam(":tipo_estoque", $tipo_estoque);
        }
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        return false;
    }

    // Obter resumo de estoque por livro
    public function getResumoEstoque($livro_id) {
        $query = "SELECT tipo_estoque, SUM(quantidade) as total_quantidade
                  FROM " . $this->table_name . "
                  WHERE livro_id = :livro_id
                  GROUP BY tipo_estoque";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":livro_id", $livro_id);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Obter estoque de um livro específico
    public function getEstoqueLivro($livro_id) {
        $query = "SELECT tipo_estoque, quantidade, atualizado_em
                  FROM " . $this->table_name . "
                  WHERE livro_id = :livro_id
                  ORDER BY tipo_estoque";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":livro_id", $livro_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Atualizar quantidade de estoque por livro e tipo
    public function atualizarQuantidade($livro_id, $tipo_estoque, $quantidade) {
        $query = "UPDATE " . $this->table_name . " 
                  SET quantidade=:quantidade, atualizado_em=CURRENT_TIMESTAMP 
                  WHERE livro_id=:livro_id AND tipo_estoque=:tipo_estoque";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":quantidade", $quantidade, PDO::PARAM_INT);
        $stmt->bindParam(":livro_id", $livro_id, PDO::PARAM_INT);
        $stmt->bindParam(":tipo_estoque", $tipo_estoque, PDO::PARAM_STR);

        return $stmt->execute();
    }
}
