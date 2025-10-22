<?php

require_once __DIR__ . '/models/Admin.php';

echo "=== CRIAR NOVO ADMIN ===\n\n";

// Dados do novo admin
$usuario = "admin";
$senha = "v1d4l0k4";

echo "Criando admin com:\n";
echo "Usuário: $usuario\n";
echo "Senha: $senha\n\n";

try {
    $admin = new Admin();
    
    // Verificar se usuário já existe
    if ($admin->usuarioExists($usuario)) {
        echo "❌ ERRO: Usuário '$usuario' já existe!\n";
        echo "Tente com outro nome de usuário.\n";
        exit;
    }
    
    // Criar novo admin
    $admin->usuario = $usuario;
    $admin->senha_hash = Admin::hashPassword($senha);
    
    if ($admin->create()) {
        echo "✅ SUCESSO: Admin criado com sucesso!\n";
        echo "Agora você pode fazer login com:\n";
        echo "Usuário: $usuario\n";
        echo "Senha: $senha\n";
    } else {
        echo "❌ ERRO: Falha ao criar admin no banco de dados.\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERRO: " . $e->getMessage() . "\n";
}

echo "\n=== FIM ===\n";
