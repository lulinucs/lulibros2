<?php
// Script para testar especificamente o endpoint do caixa
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config/env.php';
require_once 'config/database.php';
require_once 'models/Caixa.php';
require_once 'models/MovimentacaoCaixa.php';

echo "=== TESTE ESPECÍFICO CAIXA ===\n";

try {
    echo "1. Testando conexão...\n";
    $db = new Database();
    $conn = $db->getConnection();
    echo "✅ Conexão OK\n";
    
    echo "2. Testando tabela caixa...\n";
    $stmt = $conn->query("SELECT COUNT(*) as total FROM caixa");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✅ Tabela caixa: {$result['total']} registros\n";
    
    echo "3. Testando tabela movimentacoes_caixa...\n";
    $stmt = $conn->query("SELECT COUNT(*) as total FROM movimentacoes_caixa");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✅ Tabela movimentacoes_caixa: {$result['total']} registros\n";
    
    echo "4. Testando modelo Caixa...\n";
    $caixa = new Caixa();
    $caixaAtual = $caixa->getCaixaAtual();
    if ($caixaAtual) {
        echo "✅ Caixa atual encontrado: ID {$caixaAtual['id']}\n";
    } else {
        echo "ℹ️ Nenhum caixa aberto\n";
    }
    
    echo "5. Testando modelo MovimentacaoCaixa...\n";
    $movimentacao = new MovimentacaoCaixa();
    if ($caixaAtual) {
        $movimentacoes = $movimentacao->listarPorCaixa($caixaAtual['id']);
        echo "✅ Movimentações: " . count($movimentacoes) . " registros\n";
        
        $resumo = $movimentacao->getResumoPorCaixa($caixaAtual['id']);
        echo "✅ Resumo movimentações: " . json_encode($resumo) . "\n";
    }
    
    echo "6. Testando getResumoCaixaAtual()...\n";
    $resumo = $caixa->getResumoCaixaAtual();
    if ($resumo) {
        echo "✅ Resumo caixa OK\n";
        echo "Fundo inicial: {$resumo['fundo_inicial']}\n";
        echo "Status: {$resumo['status']}\n";
    } else {
        echo "ℹ️ Nenhum resumo de caixa\n";
    }
    
    echo "7. Testando JSON final...\n";
    $json = json_encode($resumo);
    if ($json === false) {
        echo "❌ Erro no JSON: " . json_last_error_msg() . "\n";
    } else {
        echo "✅ JSON OK - Tamanho: " . strlen($json) . " bytes\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERRO: " . $e->getMessage() . "\n";
    echo "Arquivo: " . $e->getFile() . "\n";
    echo "Linha: " . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>
