<?php
// Configuração temporária para teste

// Definir variáveis de ambiente manualmente
$_ENV['DB_HOST'] = 'localhost';
$_ENV['DB_PORT'] = '3306';
$_ENV['DB_NAME'] = 'lulibros';
$_ENV['DB_USER'] = 'root';
$_ENV['DB_PASS'] = '';

// Testar conexão
try {
    $dsn = "mysql:host=localhost;port=3306;dbname=lulibros;charset=utf8mb4";
    $conn = new PDO($dsn, 'root', '');
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Conexão com banco de dados: OK\n";
    
    // Testar se a tabela livros existe
    $stmt = $conn->query("SHOW TABLES LIKE 'livros'");
    if ($stmt->rowCount() > 0) {
        echo "Tabela livros: OK\n";
        
        // Contar livros
        $stmt = $conn->query("SELECT COUNT(*) as total FROM livros");
        $result = $stmt->fetch();
        echo "Total de livros: " . $result['total'] . "\n";
        
        // Listar alguns livros
        $stmt = $conn->query("SELECT id, isbn, titulo FROM livros LIMIT 5");
        $livros = $stmt->fetchAll();
        echo "Livros encontrados:\n";
        foreach ($livros as $livro) {
            echo "- ID: {$livro['id']}, ISBN: {$livro['isbn']}, Título: {$livro['titulo']}\n";
        }
        
    } else {
        echo "Tabela livros: NÃO EXISTE\n";
    }
    
} catch (PDOException $e) {
    echo "Erro de conexão: " . $e->getMessage() . "\n";
}
?>
