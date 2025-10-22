<?php

// Este arquivo vai ajudar a debugar o que está acontecendo no ambiente web
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== DEBUG WEB UPLOAD ===\n";
echo "Método: " . $_SERVER['REQUEST_METHOD'] . "\n";
echo "URI: " . $_SERVER['REQUEST_URI'] . "\n";
echo "Timestamp: " . date('Y-m-d H:i:s') . "\n\n";

echo "=== FILES ===\n";
if (isset($_FILES['file'])) {
    echo "Arquivo recebido:\n";
    print_r($_FILES['file']);
    echo "\n";
    
    if ($_FILES['file']['error'] === UPLOAD_ERR_OK) {
        echo "Arquivo OK, processando...\n";
        
        // Ler o arquivo
        $content = file_get_contents($_FILES['file']['tmp_name']);
        echo "Conteúdo do arquivo:\n";
        echo $content . "\n\n";
        
        // Processar CSV
        $lines = explode("\n", $content);
        echo "Linhas encontradas: " . count($lines) . "\n";
        
        foreach ($lines as $i => $line) {
            if (trim($line)) {
                echo "Linha $i: " . $line . "\n";
            }
        }
    } else {
        echo "Erro no arquivo: " . $_FILES['file']['error'] . "\n";
    }
} else {
    echo "Nenhum arquivo recebido\n";
}

echo "\n=== POST ===\n";
print_r($_POST);

echo "\n=== SERVER ===\n";
echo "REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD'] . "\n";
echo "CONTENT_TYPE: " . ($_SERVER['CONTENT_TYPE'] ?? 'não definido') . "\n";
echo "CONTENT_LENGTH: " . ($_SERVER['CONTENT_LENGTH'] ?? 'não definido') . "\n";

echo "\n=== DEBUG CONCLUÍDO ===\n";

?>
