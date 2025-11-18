<?php

require_once __DIR__ . '/../config/database.php';

class Caixa {
    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    // Criar nova abertura de caixa
    public function abrir($fundo_inicial, $admin_id) {
        $query = "INSERT INTO caixa (fundo_inicial, admin_abertura_id) VALUES (:fundo_inicial, :admin_id)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':fundo_inicial', $fundo_inicial);
        $stmt->bindParam(':admin_id', $admin_id);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Fechar caixa
    public function fechar($caixa_id, $dinheiro_final, $credito_conferido, $debito_conferido, $pix_conferido, $outros_conferido, $admin_id) {
        $query = "UPDATE caixa SET 
                    data_fechamento = NOW(),
                    status = 'fechado',
                    dinheiro_final = :dinheiro_final,
                    credito_conferido = :credito_conferido,
                    debito_conferido = :debito_conferido,
                    pix_conferido = :pix_conferido,
                    outros_conferido = :outros_conferido,
                    admin_fechamento_id = :admin_id
                  WHERE id = :caixa_id AND status = 'aberto'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':caixa_id', $caixa_id);
        $stmt->bindParam(':dinheiro_final', $dinheiro_final);
        $stmt->bindParam(':credito_conferido', $credito_conferido);
        $stmt->bindParam(':debito_conferido', $debito_conferido);
        $stmt->bindParam(':pix_conferido', $pix_conferido);
        $stmt->bindParam(':outros_conferido', $outros_conferido);
        $stmt->bindParam(':admin_id', $admin_id);
        
        return $stmt->execute();
    }

    // Obter caixa atual (aberto)
    public function getCaixaAtual() {
        $query = "SELECT c.*, 
                         a1.usuario as admin_abertura,
                         a2.usuario as admin_fechamento
                  FROM caixa c
                  LEFT JOIN admins a1 ON c.admin_abertura_id = a1.id
                  LEFT JOIN admins a2 ON c.admin_fechamento_id = a2.id
                  WHERE c.status = 'aberto'
                  ORDER BY c.data_abertura DESC
                  LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Obter caixa por ID
    public function getById($id) {
        $query = "SELECT c.*, 
                         a1.usuario as admin_abertura,
                         a2.usuario as admin_fechamento
                  FROM caixa c
                  LEFT JOIN admins a1 ON c.admin_abertura_id = a1.id
                  LEFT JOIN admins a2 ON c.admin_fechamento_id = a2.id
                  WHERE c.id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Listar histórico de caixas
    public function listar($page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;
        
        $query = "SELECT c.*, 
                         a1.usuario as admin_abertura,
                         a2.usuario as admin_fechamento
                  FROM caixa c
                  LEFT JOIN admins a1 ON c.admin_abertura_id = a1.id
                  LEFT JOIN admins a2 ON c.admin_fechamento_id = a2.id
                  ORDER BY c.data_abertura DESC
                  LIMIT :offset, :limit";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Contar total de caixas
    public function countAll() {
        $query = "SELECT COUNT(*) as total FROM caixa";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)$result['total'];
    }

    // Atualizar valores registrados (chamado quando há vendas)
    public function atualizarValoresRegistrados($caixa_id, $dinheiro, $credito, $debito, $pix, $outros) {
        $query = "UPDATE caixa SET 
                    dinheiro_registrado = dinheiro_registrado + :dinheiro,
                    credito_registrado = credito_registrado + :credito,
                    debito_registrado = debito_registrado + :debito,
                    pix_registrado = pix_registrado + :pix,
                    outros_registrado = outros_registrado + :outros
                  WHERE id = :caixa_id AND status = 'aberto'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':caixa_id', $caixa_id);
        $stmt->bindParam(':dinheiro', $dinheiro);
        $stmt->bindParam(':credito', $credito);
        $stmt->bindParam(':debito', $debito);
        $stmt->bindParam(':pix', $pix);
        $stmt->bindParam(':outros', $outros);
        
        return $stmt->execute();
    }

    // Atualizar totais de movimentações manuais
    public function atualizarMovimentacoesManuais($caixa_id, $inserido, $retirado) {
        $query = "UPDATE caixa SET 
                    total_inserido_manual = total_inserido_manual + :inserido,
                    total_retirado_manual = total_retirado_manual + :retirado
                  WHERE id = :caixa_id AND status = 'aberto'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':caixa_id', $caixa_id);
        $stmt->bindParam(':inserido', $inserido);
        $stmt->bindParam(':retirado', $retirado);
        
        return $stmt->execute();
    }

    // Verificar se há caixa aberto
    public function temCaixaAberto() {
        $query = "SELECT COUNT(*) as total FROM caixa WHERE status = 'aberto'";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)$result['total'] > 0;
    }

    // Obter resumo do caixa atual
    public function getResumoCaixaAtual() {
        $caixa = $this->getCaixaAtual();
        if (!$caixa) {
            return null;
        }

        // Calcular totais
        $total_registrado = $caixa['dinheiro_registrado'] + 
                           $caixa['credito_registrado'] + 
                           $caixa['debito_registrado'] + 
                           $caixa['pix_registrado'] + 
                           $caixa['outros_registrado'];

        $total_manual = 0; // Campos de movimentação manual não implementados ainda
        
        // Calcular quebra de dinheiro em espécie
        // Fórmula: Fundo + Movimentações + Vendas Dinheiro - Final = Quebra
        $dinheiro_esperado = $caixa['fundo_inicial'] + $total_manual + $caixa['dinheiro_registrado'];
        $quebra_dinheiro = ($caixa['dinheiro_final'] ?? 0) - $dinheiro_esperado;
        
        // Para outras formas de pagamento, quebra = conferido - registrado
        $quebra_credito = ($caixa['credito_conferido'] ?? 0) - $caixa['credito_registrado'];
        $quebra_debito = ($caixa['debito_conferido'] ?? 0) - $caixa['debito_registrado'];
        $quebra_pix = ($caixa['pix_conferido'] ?? 0) - $caixa['pix_registrado'];
        $quebra_outros = ($caixa['outros_conferido'] ?? 0) - $caixa['outros_registrado'];
        
        $caixa['total_registrado'] = $total_registrado;
        $caixa['total_manual'] = $total_manual;
        $caixa['total_geral'] = $caixa['fundo_inicial'] + $total_registrado + $total_manual;
        
        // Adicionar quebras
        $caixa['quebras'] = [
            'dinheiro' => $quebra_dinheiro,
            'credito' => $quebra_credito,
            'debito' => $quebra_debito,
            'pix' => $quebra_pix,
            'outros' => $quebra_outros,
            'total' => $quebra_dinheiro + $quebra_credito + $quebra_debito + $quebra_pix + $quebra_outros
        ];

        return $caixa;
    }

    // Obter resumo de um caixa específico (para histórico)
    public function getResumoCaixa($caixa_id) {
        $caixa = $this->getById($caixa_id);
        if (!$caixa) {
            return null;
        }

        // Calcular totais
        $total_registrado = $caixa['dinheiro_registrado'] + 
                           $caixa['credito_registrado'] + 
                           $caixa['debito_registrado'] + 
                           $caixa['pix_registrado'] + 
                           $caixa['outros_registrado'];

        $total_manual = 0; // Campos de movimentação manual não implementados ainda
        
        // Calcular quebra de dinheiro em espécie
        // Fórmula: Fundo + Movimentações + Vendas Dinheiro - Final = Quebra
        $dinheiro_esperado = $caixa['fundo_inicial'] + $total_manual + $caixa['dinheiro_registrado'];
        $quebra_dinheiro = ($caixa['dinheiro_final'] ?? 0) - $dinheiro_esperado;
        
        // Para outras formas de pagamento, quebra = conferido - registrado
        $quebra_credito = ($caixa['credito_conferido'] ?? 0) - $caixa['credito_registrado'];
        $quebra_debito = ($caixa['debito_conferido'] ?? 0) - $caixa['debito_registrado'];
        $quebra_pix = ($caixa['pix_conferido'] ?? 0) - $caixa['pix_registrado'];
        $quebra_outros = ($caixa['outros_conferido'] ?? 0) - $caixa['outros_registrado'];
        
        $caixa['total_registrado'] = $total_registrado;
        $caixa['total_manual'] = $total_manual;
        $caixa['total_geral'] = $caixa['fundo_inicial'] + $total_registrado + $total_manual;
        
        // Adicionar quebras
        $caixa['quebras'] = [
            'dinheiro' => $quebra_dinheiro,
            'credito' => $quebra_credito,
            'debito' => $quebra_debito,
            'pix' => $quebra_pix,
            'outros' => $quebra_outros,
            'total' => $quebra_dinheiro + $quebra_credito + $quebra_debito + $quebra_pix + $quebra_outros
        ];

        return $caixa;
    }

    // Método público para obter a conexão
    public function getConnection() {
        return $this->conn;
    }

    // Relatório financeiro
    public function getRelatorioFinanceiro($dataInicio = null, $dataFim = null) {
        try {
            $query = "SELECT 
                        c.id,
                        c.data_abertura,
                        c.data_fechamento,
                        c.status,
                        c.fundo_inicial as dinheiro_inicial,
                        c.dinheiro_final,
                        c.dinheiro_registrado,
                        c.credito_registrado,
                        c.debito_registrado,
                        c.pix_registrado,
                        c.outros_registrado,
                        c.credito_conferido,
                        c.debito_conferido,
                        c.pix_conferido,
                        c.outros_conferido,
                        a_abertura.usuario as admin_abertura,
                        a_fechamento.usuario as admin_fechamento
                     FROM caixa c
                     LEFT JOIN admins a_abertura ON c.admin_abertura_id = a_abertura.id
                     LEFT JOIN admins a_fechamento ON c.admin_fechamento_id = a_fechamento.id
                     WHERE 1=1";

            $params = [];

            if ($dataInicio) {
                $query .= " AND DATE(c.data_abertura) >= :data_inicio";
                $params[':data_inicio'] = $dataInicio;
            }

            if ($dataFim) {
                $query .= " AND DATE(c.data_abertura) <= :data_fim";
                $params[':data_fim'] = $dataFim;
            }

            $query .= " ORDER BY c.data_abertura DESC";

            $stmt = $this->conn->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();

            $caixas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Processar cada caixa
            foreach ($caixas as &$caixa) {
                // Truncar todos os valores para 2 casas decimais
                $caixa['dinheiro_inicial'] = round((float)$caixa['dinheiro_inicial'], 2);
                $caixa['dinheiro_final'] = round((float)($caixa['dinheiro_final'] ?? 0), 2);
                $caixa['dinheiro_registrado'] = round((float)$caixa['dinheiro_registrado'], 2);
                $caixa['credito_registrado'] = round((float)$caixa['credito_registrado'], 2);
                $caixa['debito_registrado'] = round((float)$caixa['debito_registrado'], 2);
                $caixa['pix_registrado'] = round((float)$caixa['pix_registrado'], 2);
                $caixa['outros_registrado'] = round((float)$caixa['outros_registrado'], 2);
                
                // Calcular totais registrados
                $caixa['total_registrado'] = round($caixa['dinheiro_registrado'] + $caixa['credito_registrado'] + 
                                           $caixa['debito_registrado'] + $caixa['pix_registrado'] + $caixa['outros_registrado'], 2);
                
                // Buscar movimentações do caixa ANTES de calcular dinheiro_conferido
                $movimentacoes = $this->getMovimentacoesPorCaixa($caixa['id']);
                $caixa['movimentacoes'] = $movimentacoes;
                
                // Calcular total_manual (soma das movimentações: entrada - saída)
                $total_manual = 0;
                foreach ($movimentacoes as $mov) {
                    if ($mov['tipo'] === 'entrada') {
                        $total_manual += (float)$mov['valor'];
                    } else {
                        $total_manual -= (float)$mov['valor'];
                    }
                }
                $total_manual = round($total_manual, 2);
                
                // Calcular dinheiro_conferido: dinheiro_final - dinheiro_inicial - total_manual
                // Só calcula se o caixa estiver fechado e tiver dinheiro_final
                if ($caixa['status'] === 'fechado' && $caixa['dinheiro_final'] !== null) {
                    $caixa['dinheiro_conferido'] = round($caixa['dinheiro_final'] - $caixa['dinheiro_inicial'] - $total_manual, 2);
                } else {
                    $caixa['dinheiro_conferido'] = 0;
                }
                
                // Usar valores conferidos da tabela para outras formas de pagamento
                $caixa['credito_conferido'] = round((float)($caixa['credito_conferido'] ?? 0), 2);
                $caixa['debito_conferido'] = round((float)($caixa['debito_conferido'] ?? 0), 2);
                $caixa['pix_conferido'] = round((float)($caixa['pix_conferido'] ?? 0), 2);
                $caixa['outros_conferido'] = round((float)($caixa['outros_conferido'] ?? 0), 2);
                
                // Calcular total_conferido INCLUINDO dinheiro_conferido
                $caixa['total_conferido'] = round($caixa['dinheiro_conferido'] + $caixa['credito_conferido'] + 
                                           $caixa['debito_conferido'] + $caixa['pix_conferido'] + $caixa['outros_conferido'], 2);
                
                $caixa['diferenca'] = round($caixa['total_conferido'] - $caixa['total_registrado'], 2);
            }

            return $caixas;

        } catch (Exception $e) {
            error_log("Erro ao buscar relatório financeiro: " . $e->getMessage());
            throw $e;
        }
    }

    // Buscar movimentações por caixa
    private function getMovimentacoesPorCaixa($caixaId) {
        try {
            $query = "SELECT 
                        id,
                        tipo,
                        valor,
                        motivo as descricao,
                        data_movimentacao as data
                     FROM movimentacoes_caixa 
                     WHERE caixa_id = :caixa_id
                     ORDER BY data_movimentacao DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':caixa_id', $caixaId);
            $stmt->execute();

            $movimentacoes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Truncar valores das movimentações
            foreach ($movimentacoes as &$mov) {
                $mov['valor'] = round((float)$mov['valor'], 2);
            }
            
            return $movimentacoes;

        } catch (Exception $e) {
            error_log("Erro ao buscar movimentações do caixa: " . $e->getMessage());
            return [];
        }
    }

}
