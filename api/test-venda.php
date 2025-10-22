<?php
// Teste simples para verificar se o backend está funcionando
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Simular dados de venda
$input = json_decode(file_get_contents('php://input'), true);

echo json_encode([
    'success' => true,
    'message' => 'Backend funcionando',
    'received_data' => $input,
    'method' => $_SERVER['REQUEST_METHOD'],
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set'
]);
?>
