<?php

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../utils/Cors.php';
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/ProdutosController.php';
require_once __DIR__ . '/../controllers/FinanceiroController.php';
require_once __DIR__ . '/../controllers/ClienteController.php';
require_once __DIR__ . '/../controllers/VendaController.php';

// Configurar CORS
Cors::handle();

// Configurar headers JSON
header('Content-Type: application/json; charset=utf-8');

// Obter método e URI da requisição
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api', '', $uri);

// Definir rotas
$routes = [
    // Autenticação
    'POST /auth/login' => ['AuthController', 'login'],
    'POST /auth/register' => ['AuthController', 'register'],
    'GET /auth/verify' => ['AuthController', 'verify'],
    'POST /auth/validate-password' => ['AuthController', 'validatePassword'],
    
    // Produtos
    'GET /produtos' => ['ProdutosController', 'listar'],
    'GET /produtos/{id}' => ['ProdutosController', 'obter'],
    'PUT /produtos/{id}' => ['ProdutosController', 'atualizar'],
    'POST /produtos/upload-livros' => ['ProdutosController', 'uploadLivros'],
    'POST /produtos/upload-precos' => ['ProdutosController', 'uploadPrecos'],
    'POST /produtos/upload-estoque' => ['ProdutosController', 'uploadEstoque'],
    'POST /produtos/update-preco' => ['ProdutosController', 'atualizarPreco'],
    'POST /produtos/update-estoque' => ['ProdutosController', 'atualizarEstoque'],
    
    // Financeiro - Caixa
    'POST /financeiro/caixa/abrir' => ['FinanceiroController', 'abrirCaixa'],
    'POST /financeiro/caixa/fechar' => ['FinanceiroController', 'fecharCaixa'],
    'GET /financeiro/caixa/status' => ['FinanceiroController', 'getStatusCaixa'],
    'GET /financeiro/caixa' => ['FinanceiroController', 'listarCaixas'],
    'GET /financeiro/caixa/{id}' => ['FinanceiroController', 'getCaixa'],
    
    // Financeiro - Movimentações
    'POST /financeiro/movimentacoes' => ['FinanceiroController', 'criarMovimentacao'],
    'GET /financeiro/movimentacoes' => ['FinanceiroController', 'listarMovimentacoes'],
    
    // Financeiro - Estatísticas
    'GET /financeiro/estatisticas' => ['FinanceiroController', 'getEstatisticas'],
    'GET /financeiro/relatorio' => ['FinanceiroController', 'getRelatorioFinanceiro'],
    'GET /financeiro/relatorio/exportar' => ['FinanceiroController', 'exportarRelatorioFinanceiro'],
    
    // Clientes
    'POST /clientes' => ['ClienteController', 'criar'],
    'GET /clientes' => ['ClienteController', 'listar'],
    'GET /clientes/{id}' => ['ClienteController', 'obter'],
    'PUT /clientes/{id}' => ['ClienteController', 'atualizar'],
    'DELETE /clientes/{id}' => ['ClienteController', 'deletar'],
    'GET /clientes/cpf/{cpf}' => ['ClienteController', 'buscarPorCpf'],
    'GET /clientes/estatisticas' => ['ClienteController', 'getEstatisticas'],
    
// Vendas
'GET /vendas/produtos/isbn/{isbn}' => ['VendaController', 'buscarLivroPorIsbn'],
'GET /vendas/produtos/{id}/estoque' => ['VendaController', 'verificarEstoque'],
'POST /vendas' => ['VendaController', 'finalizarVenda'],
'GET /vendas' => ['VendaController', 'listarVendas'],
'GET /vendas/{id}' => ['VendaController', 'obterVenda'],
'DELETE /vendas/{id}' => ['VendaController', 'estornarVenda'],
'GET /vendas/estatisticas' => ['VendaController', 'getEstatisticas'],
'GET /vendas/relatorios' => ['VendaController', 'getRelatorios'],
'GET /vendas/relatorios/exportar' => ['VendaController', 'exportarRelatorios'],
];

// Função para encontrar rota correspondente
function findRoute($method, $path, $routes) {
    $routeKey = $method . ' ' . $path;
    
    if (isset($routes[$routeKey])) {
        return $routes[$routeKey];
    }
    
    // Tentar com parâmetros dinâmicos
    foreach ($routes as $route => $handler) {
        list($routeMethod, $routePath) = explode(' ', $route, 2);
        
        if ($routeMethod === $method) {
            // Converter rota para regex
            $pattern = preg_replace('/\{[^}]+\}/', '([^/]+)', $routePath);
            $pattern = '#^' . $pattern . '$#';
            
            if (preg_match($pattern, $path, $matches)) {
                array_shift($matches); // Remover o match completo
                return [$handler[0], $handler[1], $matches];
            }
        }
    }
    
    return null;
}

// Processar requisição
$route = findRoute($method, $path, $routes);

if ($route) {
    $controllerName = $route[0];
    $methodName = $route[1];
    $params = isset($route[2]) ? $route[2] : [];
    
    try {
        $controller = new $controllerName();
        call_user_func_array([$controller, $methodName], $params);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Erro interno do servidor: ' . $e->getMessage()]);
    }
} else {
    http_response_code(404);
    echo json_encode(['message' => 'Rota não encontrada']);
}
