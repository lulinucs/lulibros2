<?php

require_once __DIR__ . '/../models/Venda.php';
require_once __DIR__ . '/../models/Livro.php';
require_once __DIR__ . '/../models/Preco.php';
require_once __DIR__ . '/../models/Estoque.php';
require_once __DIR__ . '/../models/Cliente.php';
require_once __DIR__ . '/../models/Caixa.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class VendaController {
    private $venda;
    private $livro;
    private $preco;
    private $estoque;
    private $cliente;
    private $caixa;

    public function __construct() {
        $this->venda = new Venda();
        $this->livro = new Livro();
        $this->preco = new Preco();
        $this->estoque = new Estoque();
        $this->cliente = new Cliente();
        $this->caixa = new Caixa();
    }

    // Buscar livro por ISBN
    public function buscarLivroPorIsbn($isbn = null) {
        try {
            // Se não foi passado como parâmetro, tenta pegar do GET
            if ($isbn === null) {
                $isbn = $_GET['isbn'] ?? '';
            }
            
            if (empty($isbn)) {
                http_response_code(400);
                echo json_encode(['error' => 'ISBN é obrigatório']);
                return;
            }

            // Buscar livro por ISBN
            $livro = $this->livro->buscarPorIsbn($isbn);
            
            if (!$livro) {
                http_response_code(404);
                echo json_encode(['error' => 'Livro não encontrado']);
                return;
            }

            // Buscar preços
            $precos = $this->preco->getPrecosLivro($livro['id']);
            
            // Buscar estoque
            $estoque = $this->estoque->getEstoqueLivro($livro['id']);

            // Organizar dados
            $livro['precos'] = $precos;
            $livro['estoque'] = $estoque;

            echo json_encode($livro);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    // Verificar estoque de um livro
    public function verificarEstoque($livroId = null, $tipoEstoque = null) {
        try {
            // Se não foi passado como parâmetro, tenta pegar do GET
            if ($livroId === null) {
                $livroId = $_GET['livro_id'] ?? '';
            }
            if ($tipoEstoque === null) {
                $tipoEstoque = $_GET['tipo_estoque'] ?? '';
            }
            
            if (empty($livroId)) {
                http_response_code(400);
                echo json_encode(['error' => 'Livro ID é obrigatório']);
                return;
            }

            // Buscar estoque
            $estoque = $this->estoque->getEstoqueLivro($livroId);
            
            $resultado = [
                'Novo' => 0,
                'Saldo' => 0
            ];

            foreach ($estoque as $item) {
                if ($item['tipo_estoque'] === 'Novo') {
                    $resultado['Novo'] = (int)$item['quantidade'];
                } elseif ($item['tipo_estoque'] === 'Saldo') {
                    $resultado['Saldo'] = (int)$item['quantidade'];
                }
            }

            echo json_encode($resultado);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }


    // Finalizar venda
    public function finalizarVenda() {
        try {
            // Verificar autenticação
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (empty($authHeader)) {
                http_response_code(401);
                echo json_encode(['error' => 'Token de autorização necessário']);
                return;
            }

            // Extrair token do Bearer
            if (strpos($authHeader, 'Bearer ') === 0) {
                $token = substr($authHeader, 7);
            } else {
                $token = $authHeader;
            }

            $payload = JWT::decode($token);
            
            if (!$payload) {
                http_response_code(401);
                echo json_encode(['error' => 'Token inválido']);
                return;
            }

            $adminId = $payload['admin_id'];

            // Obter dados da venda
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Debug: Log dos dados recebidos
            error_log("DEBUG finalizarVenda - Input recebido: " . print_r($input, true));
            error_log("DEBUG finalizarVenda - Tipo do input: " . gettype($input));
            error_log("DEBUG finalizarVenda - Chaves do input: " . implode(', ', array_keys($input)));
            error_log("DEBUG finalizarVenda - Campo itens existe? " . (isset($input['itens']) ? 'SIM' : 'NÃO'));
            error_log("DEBUG finalizarVenda - Campo livros existe? " . (isset($input['livros']) ? 'SIM' : 'NÃO'));
            
            if (!$input) {
                error_log("DEBUG finalizarVenda - ERRO: Input é null ou vazio");
                http_response_code(400);
                echo json_encode(['error' => 'Dados da venda são obrigatórios']);
                return;
            }
            
            if (!isset($input['itens'])) {
                error_log("DEBUG finalizarVenda - ERRO: Campo 'itens' não encontrado. Input: " . print_r($input, true));
                http_response_code(400);
                echo json_encode(['error' => 'Campo itens é obrigatório']);
                return;
            }
            
            if (!is_array($input['itens'])) {
                error_log("DEBUG finalizarVenda - ERRO: Campo 'itens' não é array. Input: " . print_r($input, true));
                http_response_code(400);
                echo json_encode(['error' => 'Campo itens deve ser um array']);
                return;
            }

            $itens = $input['itens'];
            $clienteId = $input['cliente_id'] ?? null;
            $formaPagamento = $input['forma_pagamento'] ?? 'Dinheiro';
            $totalVenda = $input['total_venda'] ?? 0;
            $caixaId = $input['caixa_id'] ?? null;

            // Validar forma de pagamento
            $formasValidas = ['Dinheiro', 'Débito', 'Crédito', 'PIX', 'Outros'];
            if (!in_array($formaPagamento, $formasValidas)) {
                http_response_code(400);
                echo json_encode(['error' => 'Forma de pagamento inválida']);
                return;
            }

            // Validar cliente se fornecido
            if ($clienteId && !$this->cliente->existe($clienteId)) {
                http_response_code(400);
                echo json_encode(['error' => 'Cliente não encontrado']);
                return;
            }

            // Validar e processar cada item
            $totalCalculado = 0;
            foreach ($itens as $item) {
                // Debug: Log de cada item
                error_log("DEBUG finalizarVenda - Processando item: " . print_r($item, true));
                
                // Validar dados obrigatórios
                if (!isset($item['livro_id']) || !isset($item['tipo_estoque']) || 
                    !isset($item['quantidade']) || !isset($item['total_item'])) {
                    error_log("DEBUG finalizarVenda - ERRO: Dados incompletos. Item: " . print_r($item, true));
                    http_response_code(400);
                    echo json_encode(['error' => 'Dados incompletos para um dos itens']);
                    return;
                }

                $livroId = $item['livro_id'];
                $tipoEstoque = $item['tipo_estoque'];
                $quantidade = (int)$item['quantidade'];
                $totalItem = (float)$item['total_item'];

                // Verificar se o livro existe
                if (!$this->livro->existe($livroId)) {
                    http_response_code(400);
                    echo json_encode(['error' => "Livro ID {$livroId} não encontrado"]);
                    return;
                }

                // Verificar estoque disponível
                $estoque = $this->estoque->getEstoqueLivro($livroId);
                $estoqueDisponivel = 0;
                
                foreach ($estoque as $itemEstoque) {
                    if ($itemEstoque['tipo_estoque'] === $tipoEstoque) {
                        $estoqueDisponivel = (int)$itemEstoque['quantidade'];
                        break;
                    }
                }

                if ($estoqueDisponivel < $quantidade) {
                    http_response_code(400);
                    echo json_encode(['error' => "Estoque insuficiente para o livro ID {$livroId}"]);
                    return;
                }

                $totalCalculado += $totalItem;
            }

            // Criar venda principal
            $vendaId = $this->venda->criarVendaCompleta([
                'cliente_id' => $clienteId,
                'forma_pagamento' => $formaPagamento,
                'total_venda' => $totalVenda,
                'admin_id' => $adminId,
                'caixa_id' => $caixaId
            ]);

            if (!$vendaId) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao criar venda']);
                return;
            }

            // Criar itens da venda
            foreach ($itens as $item) {
                $this->venda->criarItemVenda([
                    'venda_id' => $vendaId,
                    'livro_id' => $item['livro_id'],
                    'tipo_estoque' => $item['tipo_estoque'],
                    'quantidade' => $item['quantidade'],
                    'preco_unitario' => $item['preco_unitario'],
                    'desconto_percentual' => $item['desconto_percentual'],
                    'total_item' => $item['total_item']
                ]);
            }

            // Atualizar estoque
            foreach ($itens as $item) {
                $livroId = $item['livro_id'];
                $tipoEstoque = $item['tipo_estoque'];
                $quantidade = (int)$item['quantidade'];

                // Buscar estoque atual
                $estoque = $this->estoque->getEstoqueLivro($livroId);
                $estoqueAtual = 0;
                
                foreach ($estoque as $itemEstoque) {
                    if ($itemEstoque['tipo_estoque'] === $tipoEstoque) {
                        $estoqueAtual = (int)$itemEstoque['quantidade'];
                        break;
                    }
                }

                // Atualizar estoque
                $novoEstoque = $estoqueAtual - $quantidade;
                $this->estoque->atualizarQuantidade($livroId, $tipoEstoque, $novoEstoque);
            }

            // Registrar movimentação no caixa
            $caixaAtual = $this->caixa->getCaixaAtual();
            if ($caixaAtual) {
                // Calcular valores por forma de pagamento
                $dinheiro = 0;
                $credito = 0;
                $debito = 0;
                $pix = 0;
                $outros = 0;

                switch ($formaPagamento) {
                    case 'Dinheiro':
                        $dinheiro = $totalVenda;
                        break;
                    case 'Crédito':
                        $credito = $totalVenda;
                        break;
                    case 'Débito':
                        $debito = $totalVenda;
                        break;
                    case 'PIX':
                        $pix = $totalVenda;
                        break;
                    case 'Outros':
                    default:
                        $outros = $totalVenda;
                        break;
                }

                // Atualizar valores registrados no caixa
                $this->caixa->atualizarValoresRegistrados(
                    $caixaAtual['id'],
                    $dinheiro,
                    $credito,
                    $debito,
                    $pix,
                    $outros
                );
            }

            // Resposta de sucesso
            echo json_encode([
                'success' => true,
                'message' => 'Venda finalizada com sucesso',
                'venda_id' => $vendaId,
                'total' => $totalVenda,
                'quantidade_itens' => count($itens)
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    // Listar vendas
    public function listar() {
        try {
            // Verificar autenticação
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (empty($authHeader)) {
                http_response_code(401);
                echo json_encode(['error' => 'Token de autorização necessário']);
                return;
            }

            // Extrair token do Bearer
            if (strpos($authHeader, 'Bearer ') === 0) {
                $token = substr($authHeader, 7);
            } else {
                $token = $authHeader;
            }

            $payload = JWT::decode($token);
            
            if (!$payload) {
                http_response_code(401);
                echo json_encode(['error' => 'Token inválido']);
                return;
            }

            // Obter filtros
            $filtros = [];
            
            if (isset($_GET['data_inicio'])) {
                $filtros['data_inicio'] = $_GET['data_inicio'];
            }
            
            if (isset($_GET['data_fim'])) {
                $filtros['data_fim'] = $_GET['data_fim'];
            }
            
            if (isset($_GET['cliente_id'])) {
                $filtros['cliente_id'] = (int)$_GET['cliente_id'];
            }
            
            if (isset($_GET['forma_pagamento'])) {
                $filtros['forma_pagamento'] = $_GET['forma_pagamento'];
            }
            
            if (isset($_GET['tipo_estoque'])) {
                $filtros['tipo_estoque'] = $_GET['tipo_estoque'];
            }

            // Paginação
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $offset = ($page - 1) * $limit;

            $filtros['limit'] = $limit;
            $filtros['offset'] = $offset;

            // Buscar vendas
            $vendas = $this->venda->listar($filtros);
            $total = $this->venda->countAll($filtros);

            echo json_encode([
                'vendas' => $vendas,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    // Obter venda por ID
    public function obter() {
        try {
            // Verificar autenticação
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (empty($authHeader)) {
                http_response_code(401);
                echo json_encode(['error' => 'Token de autorização necessário']);
                return;
            }

            // Extrair token do Bearer
            if (strpos($authHeader, 'Bearer ') === 0) {
                $token = substr($authHeader, 7);
            } else {
                $token = $authHeader;
            }

            $payload = JWT::decode($token);
            
            if (!$payload) {
                http_response_code(401);
                echo json_encode(['error' => 'Token inválido']);
                return;
            }

            $id = $_GET['id'] ?? '';
            
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(['error' => 'ID da venda é obrigatório']);
                return;
            }

            $venda = $this->venda->obter($id);
            
            if (!$venda) {
                http_response_code(404);
                echo json_encode(['error' => 'Venda não encontrada']);
                return;
            }

            echo json_encode($venda);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    // Obter estatísticas de vendas
    public function getEstatisticas() {
        try {
            // Verificar autenticação
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (empty($authHeader)) {
                http_response_code(401);
                echo json_encode(['error' => 'Token de autorização necessário']);
                return;
            }

            // Extrair token do Bearer
            if (strpos($authHeader, 'Bearer ') === 0) {
                $token = substr($authHeader, 7);
            } else {
                $token = $authHeader;
            }

            $payload = JWT::decode($token);
            
            if (!$payload) {
                http_response_code(401);
                echo json_encode(['error' => 'Token inválido']);
                return;
            }

            // Obter filtros
            $filtros = [];
            
            if (isset($_GET['data_inicio'])) {
                $filtros['data_inicio'] = $_GET['data_inicio'];
            }
            
            if (isset($_GET['data_fim'])) {
                $filtros['data_fim'] = $_GET['data_fim'];
            }

            // Buscar estatísticas
            $estatisticas = $this->venda->getEstatisticas($filtros);
            $vendasPorFormaPagamento = $this->venda->getVendasPorFormaPagamento($filtros);
            $vendasPorTipoEstoque = $this->venda->getVendasPorTipoEstoque($filtros);

            echo json_encode([
                'estatisticas' => $estatisticas,
                'vendas_por_forma_pagamento' => $vendasPorFormaPagamento,
                'vendas_por_tipo_estoque' => $vendasPorTipoEstoque
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function listarVendas() {
        try {
            // Verificar autenticação
            $payload = AuthMiddleware::authenticate();

            // Obter parâmetros de filtro
            $dataInicio = $_GET['data_inicio'] ?? null;
            $dataFim = $_GET['data_fim'] ?? null;
            $formaPagamento = $_GET['forma_pagamento'] ?? null;
            $cliente = $_GET['cliente'] ?? null;
            $page = (int)($_GET['page'] ?? 1);
            $limit = (int)($_GET['limit'] ?? 20);

            // Validar parâmetros
            if ($page < 1) $page = 1;
            if ($limit < 1 || $limit > 100) $limit = 20;

            // Construir filtros
            $filtros = [];
            if ($dataInicio) $filtros['data_inicio'] = $dataInicio;
            if ($dataFim) $filtros['data_fim'] = $dataFim;
            if ($formaPagamento) $filtros['forma_pagamento'] = $formaPagamento;
            if ($cliente) $filtros['cliente'] = $cliente;

            // Buscar vendas
            $resultado = $this->venda->listarVendasAgrupadas($filtros, $page, $limit);

            if ($resultado === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro ao buscar vendas']);
                return;
            }

            http_response_code(200);
            echo json_encode($resultado);

        } catch (Exception $e) {
            error_log("Erro ao listar vendas: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function obterVenda($id) {
        try {
            // Verificar autenticação
            $payload = AuthMiddleware::authenticate();

            // Validar ID
            if (!is_numeric($id) || $id <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'ID da venda inválido']);
                return;
            }

            // Buscar venda com itens
            $venda = $this->venda->obterVendaComItens($id);

            if (!$venda) {
                http_response_code(404);
                echo json_encode(['error' => 'Venda não encontrada']);
                return;
            }

            http_response_code(200);
            echo json_encode($venda);

        } catch (Exception $e) {
            error_log("Erro ao obter venda: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function estornarVenda($id) {
        try {
            // Verificar autenticação
            $payload = AuthMiddleware::authenticate();

            // Validar ID
            if (!is_numeric($id) || $id <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'ID da venda inválido']);
                return;
            }

            // Verificar se a venda existe antes de estornar
            $venda = $this->venda->obterVendaComItens($id);
            if (!$venda) {
                http_response_code(404);
                echo json_encode(['error' => 'Venda não encontrada']);
                return;
            }

            // Executar estorno
            $resultado = $this->venda->estornarVenda($id);

            if ($resultado === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Erro interno ao estornar venda']);
                return;
            }

            // Log do estorno
            error_log("Venda estornada: ID {$id}, Total: {$resultado['total_estornado']}, Itens: {$resultado['itens_estornados']}, Caixa afetado: " . ($resultado['caixa_afetado'] ? 'SIM' : 'NÃO'));

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Venda estornada com sucesso',
                'data' => $resultado
            ]);

        } catch (Exception $e) {
            error_log("Erro ao estornar venda: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function getRelatorios() {
        try {
            // Verificar autenticação
            $payload = AuthMiddleware::authenticate();

            // Obter parâmetros de filtro
            $dataInicio = $_GET['data_inicio'] ?? null;
            $dataFim = $_GET['data_fim'] ?? null;
            $tipoEstoque = $_GET['tipo_estoque'] ?? null;
            $agrupar = $_GET['agrupar'] ?? 'false';

            // Validar datas
            if ($dataInicio && !strtotime($dataInicio)) {
                throw new Exception('Data de início inválida');
            }
            if ($dataFim && !strtotime($dataFim)) {
                throw new Exception('Data de fim inválida');
            }

            // Buscar dados do relatório
            $relatorio = $this->venda->getRelatorios($dataInicio, $dataFim, $tipoEstoque, $agrupar === 'true');

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $relatorio
            ]);

        } catch (Exception $e) {
            error_log("Erro ao buscar relatórios: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function exportarRelatorios() {
        try {
            $payload = AuthMiddleware::authenticate();
            $dataInicio = $_GET['data_inicio'] ?? null;
            $dataFim = $_GET['data_fim'] ?? null;
            $tipoEstoque = $_GET['tipo_estoque'] ?? null;
            $agrupar = $_GET['agrupar'] ?? 'false';

            if ($dataInicio && !strtotime($dataInicio)) {
                throw new Exception('Data de início inválida');
            }
            if ($dataFim && !strtotime($dataFim)) {
                throw new Exception('Data de fim inválida');
            }

            $relatorio = $this->venda->getRelatorios($dataInicio, $dataFim, $tipoEstoque, $agrupar === 'true');
            
            // Gerar Excel
            $this->gerarExcelVendas($relatorio, $dataInicio, $dataFim, $agrupar === 'true');

        } catch (Exception $e) {
            error_log("Erro ao exportar relatórios: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    // Gerar arquivo Excel para vendas
    private function gerarExcelVendas($relatorio, $dataInicio, $dataFim, $agrupar) {
        // Criar conteúdo Excel usando XML
        $excelContent = $this->criarExcelVendasXML($relatorio, $dataInicio, $dataFim, $agrupar);
        
        // Headers para download
        $dataAtual = date('Y-m-d');
        $nomeArquivo = "relatorio_vendas_{$dataAtual}.xls";
        
        header('Content-Type: application/vnd.ms-excel');
        header('Content-Disposition: attachment; filename="' . $nomeArquivo . '"');
        header('Cache-Control: max-age=0');
        
        echo $excelContent;
        exit;
    }

    // Criar XML do Excel para vendas
    private function criarExcelVendasXML($relatorio, $dataInicio, $dataFim, $agrupar) {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">';
        
        // Estilos
        $xml .= '<Styles>';
        $xml .= '<Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#CCCCCC" ss:Pattern="Solid"/></Style>';
        $xml .= '<Style ss:ID="currency"><NumberFormat ss:Format="R$ #,##0.00"/></Style>';
        $xml .= '</Styles>';
        
        // Aba: Relatório de Vendas
        $xml .= '<Worksheet ss:Name="Relatório de Vendas">';
        $xml .= '<Table>';
        
        // Cabeçalho
        $xml .= '<Row>';
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">ISBN</Data></Cell>';
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Título</Data></Cell>';
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Autor</Data></Cell>';
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Editora</Data></Cell>';
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Tipo de Estoque</Data></Cell>';
        
        if ($agrupar) {
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Quantidade Total</Data></Cell>';
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Preço Médio</Data></Cell>';
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Valor Total</Data></Cell>';
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Vendas</Data></Cell>';
        } else {
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Data</Data></Cell>';
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Cliente</Data></Cell>';
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Forma de Pagamento</Data></Cell>';
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Quantidade</Data></Cell>';
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Preço Unitário</Data></Cell>';
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Desconto (%)</Data></Cell>';
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Valor Total</Data></Cell>';
        }
        $xml .= '</Row>';
        
        // Dados
        foreach ($relatorio['dados'] as $item) {
            $xml .= '<Row>';
            $xml .= '<Cell><Data ss:Type="String">' . htmlspecialchars($item['isbn']) . '</Data></Cell>';
            $xml .= '<Cell><Data ss:Type="String">' . htmlspecialchars($item['livro_titulo']) . '</Data></Cell>';
            $xml .= '<Cell><Data ss:Type="String">' . htmlspecialchars($item['livro_autor'] ?? '') . '</Data></Cell>';
            $xml .= '<Cell><Data ss:Type="String">' . htmlspecialchars($item['livro_editora'] ?? '') . '</Data></Cell>';
            $xml .= '<Cell><Data ss:Type="String">' . htmlspecialchars($item['tipo_estoque']) . '</Data></Cell>';
            
            if ($agrupar) {
                $xml .= '<Cell><Data ss:Type="Number">' . ($item['quantidade_total'] ?? 0) . '</Data></Cell>';
                $xml .= '<Cell ss:StyleID="currency"><Data ss:Type="Number">' . ($item['preco_medio'] ?? 0) . '</Data></Cell>';
                $xml .= '<Cell ss:StyleID="currency"><Data ss:Type="Number">' . ($item['valor_total'] ?? 0) . '</Data></Cell>';
                $xml .= '<Cell><Data ss:Type="Number">' . ($item['vendas_count'] ?? 0) . '</Data></Cell>';
            } else {
                $xml .= '<Cell><Data ss:Type="String">' . date('d/m/Y H:i', strtotime($item['data_venda'])) . '</Data></Cell>';
                $xml .= '<Cell><Data ss:Type="String">' . htmlspecialchars($item['cliente_nome'] ?? 'Cliente não informado') . '</Data></Cell>';
                $xml .= '<Cell><Data ss:Type="String">' . htmlspecialchars($item['forma_pagamento']) . '</Data></Cell>';
                $xml .= '<Cell><Data ss:Type="Number">' . $item['quantidade'] . '</Data></Cell>';
                $xml .= '<Cell ss:StyleID="currency"><Data ss:Type="Number">' . $item['preco_unitario'] . '</Data></Cell>';
                $xml .= '<Cell><Data ss:Type="Number">' . $item['desconto_percentual'] . '</Data></Cell>';
                $xml .= '<Cell ss:StyleID="currency"><Data ss:Type="Number">' . $item['total_item'] . '</Data></Cell>';
            }
            $xml .= '</Row>';
        }
        
        $xml .= '</Table>';
        $xml .= '</Worksheet>';
        
        $xml .= '</Workbook>';
        
        return $xml;
    }
}
?>
