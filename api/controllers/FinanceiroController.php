<?php

require_once __DIR__ . '/../models/Caixa.php';
require_once __DIR__ . '/../models/MovimentacaoCaixa.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class FinanceiroController {
    private $caixa;
    private $movimentacao;

    public function __construct() {
        $this->caixa = new Caixa();
        $this->movimentacao = new MovimentacaoCaixa();
    }

    // Abertura de caixa
    public function abrirCaixa() {
        AuthMiddleware::authenticate();
        
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['fundo_inicial'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Fundo inicial é obrigatório']);
            return;
        }

        $fundo_inicial = (float)$data['fundo_inicial'];
        
        if ($fundo_inicial < 0) {
            http_response_code(400);
            echo json_encode(['message' => 'Fundo inicial não pode ser negativo']);
            return;
        }

        // Verificar se já há caixa aberto
        if ($this->caixa->temCaixaAberto()) {
            http_response_code(400);
            echo json_encode(['message' => 'Já existe um caixa aberto. Feche o caixa atual antes de abrir um novo.']);
            return;
        }

        $payload = AuthMiddleware::authenticate();
        $admin_id = $payload['admin_id'];

        $caixa_id = $this->caixa->abrir($fundo_inicial, $admin_id);

        if ($caixa_id) {
            http_response_code(201);
            echo json_encode([
                'message' => 'Caixa aberto com sucesso',
                'caixa_id' => $caixa_id,
                'fundo_inicial' => $fundo_inicial
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Erro ao abrir caixa']);
        }
    }

    // Fechamento de caixa
    public function fecharCaixa() {
        AuthMiddleware::authenticate();
        
        $data = json_decode(file_get_contents("php://input"), true);

        $required_fields = ['caixa_id', 'dinheiro_final'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field])) {
                http_response_code(400);
                echo json_encode(['message' => "Campo {$field} é obrigatório"]);
                return;
            }
        }

        $caixa_id = (int)$data['caixa_id'];
        $dinheiro_final = (float)$data['dinheiro_final'];
        $credito_conferido = isset($data['credito_conferido']) ? (float)$data['credito_conferido'] : 0;
        $debito_conferido = isset($data['debito_conferido']) ? (float)$data['debito_conferido'] : 0;
        $pix_conferido = isset($data['pix_conferido']) ? (float)$data['pix_conferido'] : 0;
        $outros_conferido = isset($data['outros_conferido']) ? (float)$data['outros_conferido'] : 0;

        if ($dinheiro_final < 0) {
            http_response_code(400);
            echo json_encode(['message' => 'Dinheiro final não pode ser negativo']);
            return;
        }

        $payload = AuthMiddleware::authenticate();
        $admin_id = $payload['admin_id'];

        $success = $this->caixa->fechar(
            $caixa_id, 
            $dinheiro_final, 
            $credito_conferido, 
            $debito_conferido, 
            $pix_conferido, 
            $outros_conferido, 
            $admin_id
        );

        if ($success) {
            http_response_code(200);
            echo json_encode(['message' => 'Caixa fechado com sucesso']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Erro ao fechar caixa. Verifique se o caixa está aberto.']);
        }
    }

    // Obter status do caixa atual
    public function getStatusCaixa() {
        AuthMiddleware::authenticate();
        
        $caixa = $this->caixa->getResumoCaixaAtual();
        
        if (!$caixa) {
            http_response_code(200);
            echo json_encode([
                'caixa_aberto' => false,
                'message' => 'Nenhum caixa aberto'
            ]);
            return;
        }

        // Buscar movimentações do caixa atual
        $movimentacoes = $this->movimentacao->listarPorCaixa($caixa['id']);
        $resumo_movimentacoes = $this->movimentacao->getResumoPorCaixa($caixa['id']);

        $caixa['movimentacoes'] = $movimentacoes;
        $caixa['resumo_movimentacoes'] = $resumo_movimentacoes;
        $caixa['caixa_aberto'] = true;

        http_response_code(200);
        echo json_encode($caixa);
    }

    // Criar movimentação (inserção ou retirada)
    public function criarMovimentacao() {
        AuthMiddleware::authenticate();
        
        $data = json_decode(file_get_contents("php://input"), true);

        $required_fields = ['tipo', 'valor', 'motivo'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field])) {
                http_response_code(400);
                echo json_encode(['message' => "Campo {$field} é obrigatório"]);
                return;
            }
        }

        $tipo = $data['tipo'];
        $valor = (float)$data['valor'];
        $motivo = $data['motivo'];

        if (!in_array($tipo, ['insercao', 'retirada'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Tipo deve ser "insercao" ou "retirada"']);
            return;
        }

        if ($valor <= 0) {
            http_response_code(400);
            echo json_encode(['message' => 'Valor deve ser maior que zero']);
            return;
        }

        // Verificar se há caixa aberto
        $caixa_atual = $this->caixa->getCaixaAtual();
        if (!$caixa_atual) {
            http_response_code(400);
            echo json_encode(['message' => 'Nenhum caixa aberto. Abra um caixa antes de fazer movimentações.']);
            return;
        }

        $payload = AuthMiddleware::authenticate();
        $admin_id = $payload['admin_id'];

        $movimentacao_id = $this->movimentacao->criar(
            $caixa_atual['id'], 
            $tipo, 
            $valor, 
            $motivo, 
            $admin_id
        );

        if ($movimentacao_id) {
            // Atualizar totais de movimentações manuais no caixa
            $inserido = $tipo === 'insercao' ? $valor : 0;
            $retirado = $tipo === 'retirada' ? $valor : 0;
            
            $this->caixa->atualizarMovimentacoesManuais($caixa_atual['id'], $inserido, $retirado);

            http_response_code(201);
            echo json_encode([
                'message' => 'Movimentação registrada com sucesso',
                'movimentacao_id' => $movimentacao_id,
                'tipo' => $tipo,
                'valor' => $valor,
                'motivo' => $motivo
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Erro ao registrar movimentação']);
        }
    }

    // Listar histórico de caixas
    public function listarCaixas() {
        AuthMiddleware::authenticate();
        
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;

        $caixas = $this->caixa->listar($page, $limit);
        $total = $this->caixa->countAll();

        // Adicionar resumo completo para cada caixa
        foreach ($caixas as &$caixa) {
            $resumo = $this->caixa->getResumoCaixa($caixa['id']);
            if ($resumo) {
                // Manter dados originais e adicionar resumo
                $caixa = array_merge($caixa, $resumo);
            }
            
            // Adicionar resumo de movimentações
            $resumo_movimentacoes = $this->movimentacao->getResumoPorCaixa($caixa['id']);
            $caixa['resumo_movimentacoes'] = $resumo_movimentacoes;
        }

        http_response_code(200);
        echo json_encode([
            'caixas' => $caixas,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    // Listar movimentações
    public function listarMovimentacoes() {
        AuthMiddleware::authenticate();
        
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $caixa_id = isset($_GET['caixa_id']) ? (int)$_GET['caixa_id'] : null;

        if ($caixa_id) {
            $movimentacoes = $this->movimentacao->listarPorCaixa($caixa_id);
            $total = count($movimentacoes);
        } else {
            $movimentacoes = $this->movimentacao->listar($page, $limit);
            $total = $this->movimentacao->countAll();
        }

        http_response_code(200);
        echo json_encode([
            'movimentacoes' => $movimentacoes,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    // Obter estatísticas financeiras
    public function getEstatisticas() {
        AuthMiddleware::authenticate();
        
        $estatisticas_movimentacoes = $this->movimentacao->getEstatisticas();
        
        // Estatísticas de caixas
        $query = "SELECT 
                    COUNT(*) as total_caixas,
                    COUNT(CASE WHEN status = 'aberto' THEN 1 END) as caixas_abertos,
                    COUNT(CASE WHEN status = 'fechado' THEN 1 END) as caixas_fechados,
                    SUM(fundo_inicial) as total_fundo_inicial,
                    AVG(fundo_inicial) as media_fundo_inicial
                  FROM caixa";
        
        $stmt = $this->caixa->getConnection()->prepare($query);
        $stmt->execute();
        $estatisticas_caixas = $stmt->fetch(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode([
            'movimentacoes' => $estatisticas_movimentacoes,
            'caixas' => $estatisticas_caixas
        ]);
    }

    // Obter detalhes de um caixa específico
    public function getCaixa($id) {
        AuthMiddleware::authenticate();
        
        $caixa = $this->caixa->getResumoCaixa($id);
        
        if (!$caixa) {
            http_response_code(404);
            echo json_encode(['message' => 'Caixa não encontrado']);
            return;
        }

        // Buscar movimentações do caixa
        $movimentacoes = $this->movimentacao->listarPorCaixa($id);
        $resumo_movimentacoes = $this->movimentacao->getResumoPorCaixa($id);

        $caixa['movimentacoes'] = $movimentacoes;
        $caixa['resumo_movimentacoes'] = $resumo_movimentacoes;

        http_response_code(200);
        echo json_encode($caixa);
    }

    // Relatório financeiro
    public function getRelatorioFinanceiro() {
        try {
            $payload = AuthMiddleware::authenticate();
            $dataInicio = $_GET['data_inicio'] ?? null;
            $dataFim = $_GET['data_fim'] ?? null;

            if ($dataInicio && !strtotime($dataInicio)) {
                throw new Exception('Data de início inválida');
            }
            if ($dataFim && !strtotime($dataFim)) {
                throw new Exception('Data de fim inválida');
            }

            $relatorio = $this->caixa->getRelatorioFinanceiro($dataInicio, $dataFim);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $relatorio
            ]);

        } catch (Exception $e) {
            error_log("Erro ao buscar relatório financeiro: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    // Exportar relatório financeiro para Excel
    public function exportarRelatorioFinanceiro() {
        try {
            $payload = AuthMiddleware::authenticate();
            $dataInicio = $_GET['data_inicio'] ?? null;
            $dataFim = $_GET['data_fim'] ?? null;

            if ($dataInicio && !strtotime($dataInicio)) {
                throw new Exception('Data de início inválida');
            }
            if ($dataFim && !strtotime($dataFim)) {
                throw new Exception('Data de fim inválida');
            }

            $relatorio = $this->caixa->getRelatorioFinanceiro($dataInicio, $dataFim);
            
            // Gerar Excel
            $this->gerarExcelFinanceiro($relatorio, $dataInicio, $dataFim);

        } catch (Exception $e) {
            error_log("Erro ao exportar relatório financeiro: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    // Gerar arquivo Excel
    private function gerarExcelFinanceiro($caixas, $dataInicio, $dataFim) {
        // Criar conteúdo Excel usando XML
        $excelContent = $this->criarExcelXML($caixas, $dataInicio, $dataFim);
        
        // Headers para download
        $dataAtual = date('Y-m-d');
        $nomeArquivo = "relatorio_financeiro_{$dataAtual}.xls";
        
        header('Content-Type: application/vnd.ms-excel');
        header('Content-Disposition: attachment; filename="' . $nomeArquivo . '"');
        header('Cache-Control: max-age=0');
        
        echo $excelContent;
        exit;
    }

    // Criar XML do Excel
    private function criarExcelXML($caixas, $dataInicio, $dataFim) {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">';
        
        // Estilos
        $xml .= '<Styles>';
        $xml .= '<Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#CCCCCC" ss:Pattern="Solid"/></Style>';
        $xml .= '<Style ss:ID="currency"><NumberFormat ss:Format="R$ #,##0.00"/></Style>';
        $xml .= '</Styles>';
        
        // Aba 1: Resumo Geral
        $xml .= '<Worksheet ss:Name="Resumo Geral">';
        $xml .= '<Table>';
        
        // Cabeçalho
        $xml .= '<Row>';
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">ID</Data></Cell>';
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Data Abertura</Data></Cell>';
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Data Fechamento</Data></Cell>';
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Status</Data></Cell>';
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Admin Abertura</Data></Cell>';
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Admin Fechamento</Data></Cell>';
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Total Registrado</Data></Cell>';
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Total Conferido</Data></Cell>';
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Diferença</Data></Cell>';
        $xml .= '</Row>';
        
        // Dados dos caixas
        foreach ($caixas as $caixa) {
            $xml .= '<Row>';
            $xml .= '<Cell><Data ss:Type="Number">' . $caixa['id'] . '</Data></Cell>';
            $xml .= '<Cell><Data ss:Type="String">' . date('d/m/Y H:i', strtotime($caixa['data_abertura'])) . '</Data></Cell>';
            $xml .= '<Cell><Data ss:Type="String">' . ($caixa['data_fechamento'] ? date('d/m/Y H:i', strtotime($caixa['data_fechamento'])) : 'Aberto') . '</Data></Cell>';
            $xml .= '<Cell><Data ss:Type="String">' . ucfirst($caixa['status']) . '</Data></Cell>';
            $xml .= '<Cell><Data ss:Type="String">' . $caixa['admin_abertura'] . '</Data></Cell>';
            $xml .= '<Cell><Data ss:Type="String">' . ($caixa['admin_fechamento'] ?: '') . '</Data></Cell>';
            $xml .= '<Cell ss:StyleID="currency"><Data ss:Type="Number">' . $caixa['total_registrado'] . '</Data></Cell>';
            $xml .= '<Cell ss:StyleID="currency"><Data ss:Type="Number">' . $caixa['total_conferido'] . '</Data></Cell>';
            $xml .= '<Cell ss:StyleID="currency"><Data ss:Type="Number">' . $caixa['diferenca'] . '</Data></Cell>';
            $xml .= '</Row>';
        }
        
        $xml .= '</Table>';
        $xml .= '</Worksheet>';
        
        // Aba para cada caixa com movimentações
        foreach ($caixas as $caixa) {
            $xml .= '<Worksheet ss:Name="Caixa #' . $caixa['id'] . '">';
            $xml .= '<Table>';
            
            // Cabeçalho do caixa
            $xml .= '<Row>';
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Informação</Data></Cell>';
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Valor</Data></Cell>';
            $xml .= '</Row>';
            
            // Dados do caixa
            $xml .= '<Row><Cell><Data ss:Type="String">ID</Data></Cell><Cell><Data ss:Type="Number">' . $caixa['id'] . '</Data></Cell></Row>';
            $xml .= '<Row><Cell><Data ss:Type="String">Data Abertura</Data></Cell><Cell><Data ss:Type="String">' . date('d/m/Y H:i', strtotime($caixa['data_abertura'])) . '</Data></Cell></Row>';
            $xml .= '<Row><Cell><Data ss:Type="String">Status</Data></Cell><Cell><Data ss:Type="String">' . ucfirst($caixa['status']) . '</Data></Cell></Row>';
            $xml .= '<Row><Cell><Data ss:Type="String">Dinheiro Inicial</Data></Cell><Cell ss:StyleID="currency"><Data ss:Type="Number">' . $caixa['dinheiro_inicial'] . '</Data></Cell></Row>';
            $xml .= '<Row><Cell><Data ss:Type="String">Dinheiro Final</Data></Cell><Cell ss:StyleID="currency"><Data ss:Type="Number">' . $caixa['dinheiro_final'] . '</Data></Cell></Row>';
            $xml .= '<Row><Cell><Data ss:Type="String">Total Registrado</Data></Cell><Cell ss:StyleID="currency"><Data ss:Type="Number">' . $caixa['total_registrado'] . '</Data></Cell></Row>';
            $xml .= '<Row><Cell><Data ss:Type="String">Total Conferido</Data></Cell><Cell ss:StyleID="currency"><Data ss:Type="Number">' . $caixa['total_conferido'] . '</Data></Cell></Row>';
            $xml .= '<Row><Cell><Data ss:Type="String">Diferença</Data></Cell><Cell ss:StyleID="currency"><Data ss:Type="Number">' . $caixa['diferenca'] . '</Data></Cell></Row>';
            
            // Linha em branco
            $xml .= '<Row><Cell></Cell><Cell></Cell></Row>';
            
            // Cabeçalho das movimentações
            $xml .= '<Row>';
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Data</Data></Cell>';
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Tipo</Data></Cell>';
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Valor</Data></Cell>';
            $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Descrição</Data></Cell>';
            $xml .= '</Row>';
            
            // Movimentações
            if (!empty($caixa['movimentacoes'])) {
                foreach ($caixa['movimentacoes'] as $mov) {
                    $xml .= '<Row>';
                    $xml .= '<Cell><Data ss:Type="String">' . date('d/m/Y H:i', strtotime($mov['data'])) . '</Data></Cell>';
                    $xml .= '<Cell><Data ss:Type="String">' . ucfirst($mov['tipo']) . '</Data></Cell>';
                    $xml .= '<Cell ss:StyleID="currency"><Data ss:Type="Number">' . $mov['valor'] . '</Data></Cell>';
                    $xml .= '<Cell><Data ss:Type="String">' . htmlspecialchars($mov['descricao']) . '</Data></Cell>';
                    $xml .= '</Row>';
                }
            } else {
                $xml .= '<Row><Cell><Data ss:Type="String">Nenhuma movimentação</Data></Cell><Cell></Cell><Cell></Cell><Cell></Cell></Row>';
            }
            
            $xml .= '</Table>';
            $xml .= '</Worksheet>';
        }
        
        $xml .= '</Workbook>';
        
        return $xml;
    }
}
