<?php

require_once __DIR__ . '/../config/database.php';

class Admin {
    private $conn;
    private $table_name = "admins";

    public $id;
    public $usuario;
    public $senha_hash;
    public $criado_em;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    // Criar um novo admin
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET usuario=:usuario, senha_hash=:senha_hash";

        $stmt = $this->conn->prepare($query);

        // Sanitizar dados
        $this->usuario = htmlspecialchars(strip_tags($this->usuario));
        $this->senha_hash = htmlspecialchars(strip_tags($this->senha_hash));

        // Bind dos parâmetros
        $stmt->bindParam(":usuario", $this->usuario);
        $stmt->bindParam(":senha_hash", $this->senha_hash);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Buscar admin por usuário
    public function findByUsuario($usuario) {
        $query = "SELECT id, usuario, senha_hash, criado_em 
                  FROM " . $this->table_name . " 
                  WHERE usuario = :usuario 
                  LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":usuario", $usuario);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->usuario = $row['usuario'];
            $this->senha_hash = $row['senha_hash'];
            $this->criado_em = $row['criado_em'];
            return true;
        }
        return false;
    }

    // Verificar senha
    public function verifyPassword($senha) {
        return password_verify($senha, $this->senha_hash);
    }

    // Gerar hash da senha
    public static function hashPassword($senha) {
        return password_hash($senha, PASSWORD_DEFAULT);
    }

    // Verificar se usuário existe
    public function usuarioExists($usuario) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE usuario = :usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":usuario", $usuario);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
}
