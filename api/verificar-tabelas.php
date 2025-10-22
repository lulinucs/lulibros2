<?php
require_once 'config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "Verificando tabelas...\n";
    
    // Verificar se tabela vendas existe
    $stmt = $conn->query("SHOW TABLES LIKE 'vendas'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Tabela vendas existe\n";
    } else {
        echo "❌ Tabela vendas NÃO existe\n";
    }
    
    // Verificar se tabela venda_itens existe
    $stmt = $conn->query("SHOW TABLES LIKE 'venda_itens'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Tabela venda_itens existe\n";
    } else {
        echo "❌ Tabela venda_itens NÃO existe\n";
    }
    
    // Verificar estrutura da tabela vendas
    echo "\nEstrutura da tabela vendas:\n";
    $stmt = $conn->query("DESCRIBE vendas");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "- " . $row['Field'] . " (" . $row['Type'] . ")\n";
    }
    
    // Verificar estrutura da tabela venda_itens
    echo "\nEstrutura da tabela venda_itens:\n";
    $stmt = $conn->query("DESCRIBE venda_itens");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "- " . $row['Field'] . " (" . $row['Type'] . ")\n";
    }
    
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
?>
