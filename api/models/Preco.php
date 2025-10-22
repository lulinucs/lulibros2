<?php

require_once __DIR__ . '/../config/database.php';

class Preco {
    private $conn;
    private $table_name = "precos";

    public $id;
    public $livro_id;
    public $tipo_estoque;
    public $preco;
    public $criado_em;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    // Criar um novo preço
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET livro_id=:livro_id, tipo_estoque=:tipo_estoque, preco=:preco";

        $stmt = $this->conn->prepare($query);

        // Sanitizar dados
        $this->livro_id = htmlspecialchars(strip_tags($this->livro_id));
        $this->tipo_estoque = htmlspecialchars(strip_tags($this->tipo_estoque));
        $this->preco = htmlspecialchars(strip_tags($this->preco));

        // Bind dos parâmetros
        $stmt->bindParam(":livro_id", $this->livro_id);
        $stmt->bindParam(":tipo_estoque", $this->tipo_estoque);
        $stmt->bindParam(":preco", $this->preco);

        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    // Buscar preço por livro e tipo
    public function findByLivroAndTipo($livro_id, $tipo_estoque) {
        $query = "SELECT id, livro_id, tipo_estoque, preco, criado_em 
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
            $this->preco = $row['preco'];
            $this->criado_em = $row['criado_em'];
            return true;
        }
        return false;
    }

    // Atualizar preço existente
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET preco=:preco 
                  WHERE livro_id=:livro_id AND tipo_estoque=:tipo_estoque";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":preco", $this->preco);
        $stmt->bindParam(":livro_id", $this->livro_id);
        $stmt->bindParam(":tipo_estoque", $this->tipo_estoque);

        return $stmt->execute();
    }

    // Criar ou atualizar preço
    public function createOrUpdate() {
        // Verificar se já existe sem modificar as propriedades
        $query = "SELECT id FROM " . $this->table_name . " 
                  WHERE livro_id = :livro_id AND tipo_estoque = :tipo_estoque 
                  LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":livro_id", $this->livro_id);
        $stmt->bindParam(":tipo_estoque", $this->tipo_estoque);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            return $this->update();
        } else {
            return $this->create();
        }
    }

    // Listar preços com informações do livro
    public function readAllWithLivro($from_record_num = 0, $records_per_page = 20) {
        $query = "SELECT p.id, p.livro_id, p.tipo_estoque, p.preco, p.criado_em,
                         l.isbn, l.titulo, l.autor, l.editora
                  FROM " . $this->table_name . " p
                  INNER JOIN livros l ON p.livro_id = l.id
                  ORDER BY p.criado_em DESC 
                  LIMIT :from_record_num, :records_per_page";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":from_record_num", $from_record_num, PDO::PARAM_INT);
        $stmt->bindParam(":records_per_page", $records_per_page, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Buscar preço por ISBN
    public function findByIsbn($isbn, $tipo_estoque = null) {
        $query = "SELECT p.id, p.livro_id, p.tipo_estoque, p.preco, p.criado_em,
                         l.isbn, l.titulo, l.autor, l.editora
                  FROM " . $this->table_name . " p
                  INNER JOIN livros l ON p.livro_id = l.id
                  WHERE l.isbn = :isbn";
        
        if ($tipo_estoque) {
            $query .= " AND p.tipo_estoque = :tipo_estoque";
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

    // Buscar preços de um livro específico
    public function getPrecosLivro($livro_id) {
        $query = "SELECT tipo_estoque, preco FROM " . $this->table_name . " WHERE livro_id = :livro_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":livro_id", $livro_id);
        $stmt->execute();
        
        $precos = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $precos[$row['tipo_estoque']] = $row['preco'];
        }
        
        return $precos;
    }
}
