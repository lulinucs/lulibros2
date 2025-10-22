<?php

require_once __DIR__ . '/../config/database.php';

class Livro {
    private $conn;
    private $table_name = "livros";

    public $id;
    public $isbn;
    public $titulo;
    public $autor;
    public $editora;
    public $criado_em;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        error_log("DEBUG: Conexão com banco estabelecida: " . ($this->conn ? 'SUCESSO' : 'ERRO'));
    }

    // Método público para obter a conexão
    public function getConnection() {
        return $this->conn;
    }

    // Método público para obter o nome da tabela
    public function getTableName() {
        return $this->table_name;
    }

    // Criar um novo livro
    public function create() {
        error_log("DEBUG: CREATE iniciado para ISBN: " . $this->isbn);
        
        $query = "INSERT INTO " . $this->table_name . " 
                  SET isbn=:isbn, titulo=:titulo, autor=:autor, editora=:editora";

        $stmt = $this->conn->prepare($query);

        // Sanitizar dados
        $this->isbn = htmlspecialchars(strip_tags($this->isbn));
        $this->titulo = htmlspecialchars(strip_tags($this->titulo));
        $this->autor = htmlspecialchars(strip_tags($this->autor));
        $this->editora = htmlspecialchars(strip_tags($this->editora));

        error_log("DEBUG: Dados sanitizados - ISBN: " . $this->isbn . ", Título: " . $this->titulo);

        // Bind dos parâmetros
        $stmt->bindParam(":isbn", $this->isbn);
        $stmt->bindParam(":titulo", $this->titulo);
        $stmt->bindParam(":autor", $this->autor);
        $stmt->bindParam(":editora", $this->editora);

        $resultado = $stmt->execute();
        error_log("DEBUG: INSERT executado: " . ($resultado ? 'SUCESSO' : 'ERRO'));
        if (!$resultado) {
            error_log("DEBUG: Erro no INSERT: " . print_r($stmt->errorInfo(), true));
        }

        if($resultado) {
            $this->id = $this->conn->lastInsertId();
            error_log("DEBUG: ID do novo livro: " . $this->id);
            return true;
        }
        return false;
    }

    // Buscar livro por ISBN
    public function findByIsbn($isbn) {
        $query = "SELECT id, isbn, titulo, autor, editora, criado_em 
                  FROM " . $this->table_name . " 
                  WHERE isbn = :isbn 
                  LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":isbn", $isbn);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->isbn = $row['isbn'];
            $this->titulo = $row['titulo'];
            $this->autor = $row['autor'];
            $this->editora = $row['editora'];
            $this->criado_em = $row['criado_em'];
            return true;
        }
        return false;
    }

    // Buscar livro por ID
    public function findById($id) {
        $query = "SELECT id, isbn, titulo, autor, editora, criado_em 
                  FROM " . $this->table_name . " 
                  WHERE id = :id 
                  LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->isbn = $row['isbn'];
            $this->titulo = $row['titulo'];
            $this->autor = $row['autor'];
            $this->editora = $row['editora'];
            $this->criado_em = $row['criado_em'];
            return true;
        }
        return false;
    }

    // Listar todos os livros com paginação
    public function readAll($from_record_num = 0, $records_per_page = 20) {
        $query = "SELECT id, isbn, titulo, autor, editora, criado_em 
                  FROM " . $this->table_name . " 
                  ORDER BY criado_em DESC 
                  LIMIT :from_record_num, :records_per_page";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":from_record_num", $from_record_num, PDO::PARAM_INT);
        $stmt->bindParam(":records_per_page", $records_per_page, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Contar total de livros
    public function countAll() {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    // Buscar livros por termo
    public function search($term) {
        $query = "SELECT id, isbn, titulo, autor, editora, criado_em 
                  FROM " . $this->table_name . " 
                  WHERE titulo LIKE :term 
                     OR autor LIKE :term 
                     OR isbn LIKE :term 
                     OR editora LIKE :term
                  ORDER BY criado_em DESC";

        $stmt = $this->conn->prepare($query);
        $term = "%{$term}%";
        $stmt->bindParam(":term", $term);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Verificar se ISBN já existe
    public function isbnExists($isbn) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE isbn = :isbn";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":isbn", $isbn);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    // Criar ou atualizar livro (para importação)
    public function createOrUpdate() {
        error_log("DEBUG: createOrUpdate iniciado para ISBN: " . $this->isbn);
        
        // Primeiro, verificar se já existe
        if ($this->findByIsbn($this->isbn)) {
            error_log("DEBUG: Livro já existe, atualizando...");
            // Atualizar livro existente
            $query = "UPDATE " . $this->table_name . " 
                      SET titulo=:titulo, autor=:autor, editora=:editora 
                      WHERE isbn=:isbn";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":titulo", $this->titulo);
            $stmt->bindParam(":autor", $this->autor);
            $stmt->bindParam(":editora", $this->editora);
            $stmt->bindParam(":isbn", $this->isbn);
            
            $resultado = $stmt->execute();
            error_log("DEBUG: UPDATE executado: " . ($resultado ? 'SUCESSO' : 'ERRO'));
            if (!$resultado) {
                error_log("DEBUG: Erro no UPDATE: " . print_r($stmt->errorInfo(), true));
            }
            
            if ($resultado) {
                // Buscar o ID do livro atualizado
                $this->findByIsbn($this->isbn);
                error_log("DEBUG: Livro atualizado com ID: " . $this->id);
                return true;
            }
            return false;
        } else {
            error_log("DEBUG: Livro não existe, criando novo...");
            // Criar novo livro
            $resultado = $this->create();
            error_log("DEBUG: CREATE executado: " . ($resultado ? 'SUCESSO' : 'ERRO'));
            if ($resultado) {
                error_log("DEBUG: Novo livro criado com ID: " . $this->id);
            }
            return $resultado;
        }
    }

    // Buscar livro por ISBN e retornar dados
    public function buscarPorIsbn($isbn) {
        $query = "SELECT id, isbn, titulo, autor, editora, criado_em 
                  FROM " . $this->table_name . " 
                  WHERE isbn = :isbn 
                  LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":isbn", $isbn);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        return false;
    }

    // Verificar se livro existe por ID
    public function existe($id) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
}
