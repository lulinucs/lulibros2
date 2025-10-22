<?php

require_once __DIR__ . '/../config/database.php';

class Venda {
    private $conn;
    private $table_name = "vendas";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getConnection() {
        return $this->conn;
    }

    public function getTableName() {
        return $this->table_name;
    }

    // Criar nova venda
    public function criar($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (livro_id, tipo_estoque, cliente_id, quantidade, total, forma_pagamento) 
                  VALUES (:livro_id, :tipo_estoque, :cliente_id, :quantidade, :total, :forma_pagamento)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindValue(":livro_id", $data['livro_id'], PDO::PARAM_INT);
        $stmt->bindValue(":tipo_estoque", $data['tipo_estoque'], PDO::PARAM_STR);
        $stmt->bindValue(":cliente_id", $data['cliente_id'], PDO::PARAM_INT);
        $stmt->bindValue(":quantidade", $data['quantidade'], PDO::PARAM_INT);
        $stmt->bindValue(":total", $data['total'], PDO::PARAM_STR);
        $stmt->bindValue(":forma_pagamento", $data['forma_pagamento'], PDO::PARAM_STR);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Criar múltiplas vendas (para uma venda com vários livros)
    public function criarMultiplas($vendas) {
        $this->conn->beginTransaction();
        
        try {
            $vendaIds = [];
            
            foreach ($vendas as $venda) {
                $vendaId = $this->criar($venda);
                if (!$vendaId) {
                    throw new Exception("Erro ao criar venda para livro ID: " . $venda['livro_id']);
                }
                $vendaIds[] = $vendaId;
            }
            
            $this->conn->commit();
            return $vendaIds;
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    // Listar vendas com filtros
    public function listar($filtros = []) {
        $query = "SELECT v.*, l.isbn, l.titulo, l.autor, l.editora, c.nome as cliente_nome, c.cpf as cliente_cpf
                  FROM " . $this->table_name . " v
                  LEFT JOIN livros l ON v.livro_id = l.id
                  LEFT JOIN clientes c ON v.cliente_id = c.id
                  WHERE 1=1";

        $params = [];

        // Filtro por data
        if (isset($filtros['data_inicio'])) {
            $query .= " AND DATE(v.data_venda) >= :data_inicio";
            $params[':data_inicio'] = $filtros['data_inicio'];
        }

        if (isset($filtros['data_fim'])) {
            $query .= " AND DATE(v.data_venda) <= :data_fim";
            $params[':data_fim'] = $filtros['data_fim'];
        }

        // Filtro por cliente
        if (isset($filtros['cliente_id'])) {
            $query .= " AND v.cliente_id = :cliente_id";
            $params[':cliente_id'] = $filtros['cliente_id'];
        }

        // Filtro por forma de pagamento
        if (isset($filtros['forma_pagamento'])) {
            $query .= " AND v.forma_pagamento = :forma_pagamento";
            $params[':forma_pagamento'] = $filtros['forma_pagamento'];
        }

        // Filtro por tipo de estoque
        if (isset($filtros['tipo_estoque'])) {
            $query .= " AND v.tipo_estoque = :tipo_estoque";
            $params[':tipo_estoque'] = $filtros['tipo_estoque'];
        }

        // Ordenação
        $query .= " ORDER BY v.data_venda DESC";

        // Paginação
        if (isset($filtros['limit'])) {
            $query .= " LIMIT :limit";
            $params[':limit'] = $filtros['limit'];
        }

        if (isset($filtros['offset'])) {
            $query .= " OFFSET :offset";
            $params[':offset'] = $filtros['offset'];
        }

        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Obter venda por ID
    public function obter($id) {
        $query = "SELECT v.*, l.isbn, l.titulo, l.autor, l.editora, c.nome as cliente_nome, c.cpf as cliente_cpf
                  FROM " . $this->table_name . " v
                  LEFT JOIN livros l ON v.livro_id = l.id
                  LEFT JOIN clientes c ON v.cliente_id = c.id
                  WHERE v.id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Obter vendas por período (para relatórios)
    public function obterPorPeriodo($dataInicio, $dataFim) {
        $query = "SELECT v.*, l.isbn, l.titulo, l.autor, l.editora, c.nome as cliente_nome, c.cpf as cliente_cpf
                  FROM " . $this->table_name . " v
                  LEFT JOIN livros l ON v.livro_id = l.id
                  LEFT JOIN clientes c ON v.cliente_id = c.id
                  WHERE DATE(v.data_venda) BETWEEN :data_inicio AND :data_fim
                  ORDER BY v.data_venda DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":data_inicio", $dataInicio, PDO::PARAM_STR);
        $stmt->bindValue(":data_fim", $dataFim, PDO::PARAM_STR);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Obter estatísticas de vendas
    public function getEstatisticas($filtros = []) {
        $query = "SELECT 
                    COUNT(*) as total_vendas,
                    SUM(quantidade) as total_livros_vendidos,
                    SUM(total) as total_faturado,
                    AVG(total) as ticket_medio,
                    COUNT(DISTINCT cliente_id) as clientes_unicos
                  FROM " . $this->table_name . " v
                  WHERE 1=1";

        $params = [];

        // Filtro por data
        if (isset($filtros['data_inicio'])) {
            $query .= " AND DATE(v.data_venda) >= :data_inicio";
            $params[':data_inicio'] = $filtros['data_inicio'];
        }

        if (isset($filtros['data_fim'])) {
            $query .= " AND DATE(v.data_venda) <= :data_fim";
            $params[':data_fim'] = $filtros['data_fim'];
        }

        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }

        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Obter vendas por forma de pagamento
    public function getVendasPorFormaPagamento($filtros = []) {
        $query = "SELECT 
                    forma_pagamento,
                    COUNT(*) as quantidade,
                    SUM(total) as total
                  FROM " . $this->table_name . " v
                  WHERE 1=1";

        $params = [];

        // Filtro por data
        if (isset($filtros['data_inicio'])) {
            $query .= " AND DATE(v.data_venda) >= :data_inicio";
            $params[':data_inicio'] = $filtros['data_inicio'];
        }

        if (isset($filtros['data_fim'])) {
            $query .= " AND DATE(v.data_venda) <= :data_fim";
            $params[':data_fim'] = $filtros['data_fim'];
        }

        $query .= " GROUP BY forma_pagamento ORDER BY total DESC";

        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Obter vendas por tipo de estoque
    public function getVendasPorTipoEstoque($filtros = []) {
        $query = "SELECT 
                    tipo_estoque,
                    COUNT(*) as quantidade,
                    SUM(total) as total
                  FROM " . $this->table_name . " v
                  WHERE 1=1";

        $params = [];

        // Filtro por data
        if (isset($filtros['data_inicio'])) {
            $query .= " AND DATE(v.data_venda) >= :data_inicio";
            $params[':data_inicio'] = $filtros['data_inicio'];
        }

        if (isset($filtros['data_fim'])) {
            $query .= " AND DATE(v.data_venda) <= :data_fim";
            $params[':data_fim'] = $filtros['data_fim'];
        }

        $query .= " GROUP BY tipo_estoque ORDER BY total DESC";

        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Contar total de vendas
    public function countAll($filtros = []) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " v WHERE 1=1";

        $params = [];

        // Filtro por data
        if (isset($filtros['data_inicio'])) {
            $query .= " AND DATE(v.data_venda) >= :data_inicio";
            $params[':data_inicio'] = $filtros['data_inicio'];
        }

        if (isset($filtros['data_fim'])) {
            $query .= " AND DATE(v.data_venda) <= :data_fim";
            $params[':data_fim'] = $filtros['data_fim'];
        }

        // Filtro por cliente
        if (isset($filtros['cliente_id'])) {
            $query .= " AND v.cliente_id = :cliente_id";
            $params[':cliente_id'] = $filtros['cliente_id'];
        }

        // Filtro por forma de pagamento
        if (isset($filtros['forma_pagamento'])) {
            $query .= " AND v.forma_pagamento = :forma_pagamento";
            $params[':forma_pagamento'] = $filtros['forma_pagamento'];
        }

        // Filtro por tipo de estoque
        if (isset($filtros['tipo_estoque'])) {
            $query .= " AND v.tipo_estoque = :tipo_estoque";
            $params[':tipo_estoque'] = $filtros['tipo_estoque'];
        }

        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }

        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'];
    }

    // Criar venda completa (cabeçalho)
    public function criarVendaCompleta($data) {
        $query = "INSERT INTO vendas (cliente_id, forma_pagamento, total_venda, admin_id, caixa_id) 
                  VALUES (:cliente_id, :forma_pagamento, :total_venda, :admin_id, :caixa_id)";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":cliente_id", $data['cliente_id'], PDO::PARAM_INT);
        $stmt->bindValue(":forma_pagamento", $data['forma_pagamento'], PDO::PARAM_STR);
        $stmt->bindValue(":total_venda", $data['total_venda'], PDO::PARAM_STR);
        $stmt->bindValue(":admin_id", $data['admin_id'], PDO::PARAM_INT);
        $stmt->bindValue(":caixa_id", $data['caixa_id'], PDO::PARAM_INT);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Criar item da venda
    public function criarItemVenda($data) {
        $query = "INSERT INTO venda_itens (venda_id, livro_id, tipo_estoque, quantidade, preco_unitario, desconto_percentual, total_item) 
                  VALUES (:venda_id, :livro_id, :tipo_estoque, :quantidade, :preco_unitario, :desconto_percentual, :total_item)";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":venda_id", $data['venda_id'], PDO::PARAM_INT);
        $stmt->bindValue(":livro_id", $data['livro_id'], PDO::PARAM_INT);
        $stmt->bindValue(":tipo_estoque", $data['tipo_estoque'], PDO::PARAM_STR);
        $stmt->bindValue(":quantidade", $data['quantidade'], PDO::PARAM_INT);
        $stmt->bindValue(":preco_unitario", $data['preco_unitario'], PDO::PARAM_STR);
        $stmt->bindValue(":desconto_percentual", $data['desconto_percentual'], PDO::PARAM_STR);
        $stmt->bindValue(":total_item", $data['total_item'], PDO::PARAM_STR);

        return $stmt->execute();
    }


    // Obter venda com itens
    public function obterVendaComItens($id) {
        // Buscar venda
        $query = "SELECT v.*, c.nome as cliente_nome, c.cpf as cliente_cpf
                  FROM vendas v
                  LEFT JOIN clientes c ON v.cliente_id = c.id
                  WHERE v.id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id, PDO::PARAM_INT);
        $stmt->execute();
        $venda = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$venda) {
            return null;
        }

        // Buscar itens
        $query = "SELECT vi.*, l.titulo, l.autor, l.editora
                  FROM venda_itens vi
                  JOIN livros l ON vi.livro_id = l.id
                  WHERE vi.venda_id = :venda_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":venda_id", $id, PDO::PARAM_INT);
        $stmt->execute();
        $itens = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'venda' => $venda,
            'itens' => $itens
        ];
    }

    // Listar vendas agrupadas com filtros e paginação
    public function listarVendasAgrupadas($filtros = [], $page = 1, $limit = 20) {
        try {
            $offset = ($page - 1) * $limit;
            
            // Construir query base
            $query = "SELECT v.id, v.data_venda, v.forma_pagamento, v.total_venda, 
                            c.nome as cliente_nome,
                            cx.status as caixa_status,
                            COUNT(vi.id) as qtd_produtos
                     FROM vendas v
                     LEFT JOIN clientes c ON v.cliente_id = c.id
                     LEFT JOIN caixa cx ON v.caixa_id = cx.id
                     LEFT JOIN venda_itens vi ON v.id = vi.venda_id
                     WHERE 1=1";
            
            $params = [];
            
            // Aplicar filtros
            if (!empty($filtros['data_inicio'])) {
                $query .= " AND DATE(v.data_venda) >= :data_inicio";
                $params[':data_inicio'] = $filtros['data_inicio'];
            }
            
            if (!empty($filtros['data_fim'])) {
                $query .= " AND DATE(v.data_venda) <= :data_fim";
                $params[':data_fim'] = $filtros['data_fim'];
            }
            
            if (!empty($filtros['forma_pagamento'])) {
                $query .= " AND v.forma_pagamento = :forma_pagamento";
                $params[':forma_pagamento'] = $filtros['forma_pagamento'];
            }
            
            if (!empty($filtros['cliente'])) {
                $query .= " AND c.nome LIKE :cliente";
                $params[':cliente'] = '%' . $filtros['cliente'] . '%';
            }
            
            // Agrupar por venda
            $query .= " GROUP BY v.id, v.data_venda, v.forma_pagamento, v.total_venda, c.nome, cx.status";
            
            // Ordenar por data mais recente
            $query .= " ORDER BY v.data_venda DESC";
            
            // Contar total para paginação
            $countQuery = "SELECT COUNT(DISTINCT v.id) as total FROM vendas v
                          LEFT JOIN clientes c ON v.cliente_id = c.id
                          LEFT JOIN caixa cx ON v.caixa_id = cx.id
                          WHERE 1=1";
            
            $countParams = [];
            foreach ($filtros as $key => $value) {
                if (!empty($value)) {
                    if ($key === 'data_inicio') {
                        $countQuery .= " AND DATE(v.data_venda) >= :data_inicio";
                        $countParams[':data_inicio'] = $value;
                    } elseif ($key === 'data_fim') {
                        $countQuery .= " AND DATE(v.data_venda) <= :data_fim";
                        $countParams[':data_fim'] = $value;
                    } elseif ($key === 'forma_pagamento') {
                        $countQuery .= " AND v.forma_pagamento = :forma_pagamento";
                        $countParams[':forma_pagamento'] = $value;
                    } elseif ($key === 'cliente') {
                        $countQuery .= " AND c.nome LIKE :cliente";
                        $countParams[':cliente'] = '%' . $value . '%';
                    }
                }
            }
            
            $countStmt = $this->conn->prepare($countQuery);
            $countStmt->execute($countParams);
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Aplicar paginação
            $query .= " LIMIT :limit OFFSET :offset";
            
            $stmt = $this->conn->prepare($query);
            
            // Bind dos parâmetros de filtro
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
            }
            
            // Bind dos parâmetros de paginação como INT
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            $stmt->execute();
            $vendas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $pages = ceil($total / $limit);
            
            return [
                'vendas' => $vendas,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => $pages
                ]
            ];
            
        } catch (Exception $e) {
            error_log("Erro ao listar vendas agrupadas: " . $e->getMessage());
            return false;
        }
    }

    // Estornar venda (inverso completo)
    public function estornarVenda($vendaId) {
        try {
            error_log("DEBUG estornarVenda - Iniciando estorno da venda ID: {$vendaId}");
            $this->conn->beginTransaction();

            // 1. Buscar dados da venda
            $query = "SELECT v.*, c.id as caixa_id, c.dinheiro_registrado, c.credito_registrado, 
                            c.debito_registrado, c.pix_registrado, c.outros_registrado, c.status as caixa_status
                     FROM vendas v
                     LEFT JOIN caixa c ON v.caixa_id = c.id
                     WHERE v.id = :venda_id";
            
            error_log("DEBUG estornarVenda - Query: " . $query);

            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(":venda_id", $vendaId, PDO::PARAM_INT);
            $stmt->execute();
            $venda = $stmt->fetch(PDO::FETCH_ASSOC);

            error_log("DEBUG estornarVenda - Venda encontrada: " . print_r($venda, true));

            if (!$venda) {
                throw new Exception("Venda não encontrada");
            }

            // 1.5. VALIDAÇÃO: Só permitir estorno se o caixa estiver ABERTO
            if ($venda['caixa_id'] && $venda['caixa_status'] !== 'aberto') {
                throw new Exception("Estorno não permitido: O caixa da venda está fechado. Apenas vendas do caixa aberto podem ser estornadas.");
            }

            // 2. Buscar itens da venda
            $query = "SELECT vi.*, l.titulo
                     FROM venda_itens vi
                     JOIN livros l ON vi.livro_id = l.id
                     WHERE vi.venda_id = :venda_id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(":venda_id", $vendaId, PDO::PARAM_INT);
            $stmt->execute();
            $itens = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($itens)) {
                throw new Exception("Nenhum item encontrado para esta venda");
            }

            // 3. Reincrementar estoque para cada item
            foreach ($itens as $item) {
                $livroId = $item['livro_id'];
                $tipoEstoque = $item['tipo_estoque'];
                $quantidade = $item['quantidade'];

                // Reincrementar estoque (oposto de decrementar)
                $query = "UPDATE estoque 
                         SET quantidade = quantidade + :quantidade 
                         WHERE livro_id = :livro_id AND tipo_estoque = :tipo";

                $stmt = $this->conn->prepare($query);
                $stmt->bindValue(":quantidade", $quantidade, PDO::PARAM_INT);
                $stmt->bindValue(":livro_id", $livroId, PDO::PARAM_INT);
                $stmt->bindValue(":tipo", $tipoEstoque, PDO::PARAM_STR);
                $stmt->execute();

                if ($stmt->rowCount() === 0) {
                    throw new Exception("Erro ao reincrementar estoque para o livro: " . $item['titulo']);
                }
            }

            // 4. Decrementar valores do caixa (se caixa ainda estiver aberto)
            $caixaAfetado = false;
            if ($venda['caixa_id'] && $venda['caixa_id'] > 0) {
                $formaPagamento = $venda['forma_pagamento'];
                $totalVenda = $venda['total_venda'];

                $campoCaixa = '';
                switch ($formaPagamento) {
                    case 'Dinheiro':
                        $campoCaixa = 'dinheiro_registrado';
                        break;
                    case 'Crédito':
                        $campoCaixa = 'credito_registrado';
                        break;
                    case 'Débito':
                        $campoCaixa = 'debito_registrado';
                        break;
                    case 'PIX':
                        $campoCaixa = 'pix_registrado';
                        break;
                    case 'Outros':
                        $campoCaixa = 'outros_registrado';
                        break;
                }

                if ($campoCaixa) {
                    $query = "UPDATE caixa 
                             SET {$campoCaixa} = {$campoCaixa} - :total_venda 
                             WHERE id = :caixa_id";

                    $stmt = $this->conn->prepare($query);
                    $stmt->bindValue(":total_venda", $totalVenda, PDO::PARAM_STR);
                    $stmt->bindValue(":caixa_id", $venda['caixa_id'], PDO::PARAM_INT);
                    $stmt->execute();

                    if ($stmt->rowCount() === 0) {
                        throw new Exception("Erro ao decrementar valores do caixa");
                    }
                    
                    $caixaAfetado = true;
                    error_log("DEBUG estornarVenda - Caixa AFETADO! ID: {$venda['caixa_id']}, Campo: {$campoCaixa}, Valor: {$totalVenda}");
                }
            } else {
                error_log("DEBUG estornarVenda - Caixa NÃO afetado. caixa_id: " . ($venda['caixa_id'] ?? 'NULL'));
            }

            // 5. Remover itens da venda
            $query = "DELETE FROM venda_itens WHERE venda_id = :venda_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(":venda_id", $vendaId, PDO::PARAM_INT);
            $stmt->execute();

            // 6. Remover venda principal
            $query = "DELETE FROM vendas WHERE id = :venda_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(":venda_id", $vendaId, PDO::PARAM_INT);
            $stmt->execute();

            if ($stmt->rowCount() === 0) {
                throw new Exception("Erro ao remover venda");
            }

            $this->conn->commit();

            return [
                'success' => true,
                'venda_id' => $vendaId,
                'total_estornado' => $venda['total_venda'],
                'itens_estornados' => count($itens),
                'caixa_afetado' => $caixaAfetado
            ];

        } catch (Exception $e) {
            $this->conn->rollBack();
            error_log("ERRO estornarVenda - Venda ID {$vendaId}: " . $e->getMessage());
            error_log("ERRO estornarVenda - Stack trace: " . $e->getTraceAsString());
            return false;
        }
    }

    // Buscar dados para relatórios
    public function getRelatorios($dataInicio = null, $dataFim = null, $tipoEstoque = null, $agrupar = false) {
        try {
            // Query base para buscar vendas com itens
            $query = "SELECT 
                        v.id as venda_id,
                        v.data_venda,
                        v.forma_pagamento,
                        v.total_venda,
                        c.nome as cliente_nome,
                        l.titulo as livro_titulo,
                        l.autor as livro_autor,
                        l.editora as livro_editora,
                        l.isbn,
                        vi.tipo_estoque,
                        vi.quantidade,
                        vi.preco_unitario,
                        vi.desconto_percentual,
                        vi.total_item
                     FROM vendas v
                     LEFT JOIN clientes c ON v.cliente_id = c.id
                     JOIN venda_itens vi ON v.id = vi.venda_id
                     JOIN livros l ON vi.livro_id = l.id
                     WHERE 1=1";

            $params = [];

            // Aplicar filtros
            if ($dataInicio) {
                $query .= " AND DATE(v.data_venda) >= :data_inicio";
                $params[':data_inicio'] = $dataInicio;
            }

            if ($dataFim) {
                $query .= " AND DATE(v.data_venda) <= :data_fim";
                $params[':data_fim'] = $dataFim;
            }

            if ($tipoEstoque) {
                $query .= " AND vi.tipo_estoque = :tipo_estoque";
                $params[':tipo_estoque'] = $tipoEstoque;
            }

            $query .= " ORDER BY v.data_venda DESC, l.titulo";

            $stmt = $this->conn->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();

            $dados = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if ($agrupar) {
                // Agrupar por livro
                $agrupado = [];
                foreach ($dados as $item) {
                    $chave = $item['livro_titulo'] . '_' . $item['tipo_estoque'];
                    if (!isset($agrupado[$chave])) {
                        $agrupado[$chave] = [
                            'livro_titulo' => $item['livro_titulo'],
                            'livro_autor' => $item['livro_autor'],
                            'livro_editora' => $item['livro_editora'],
                            'isbn' => $item['isbn'],
                            'tipo_estoque' => $item['tipo_estoque'],
                            'quantidade_total' => 0,
                            'valor_total' => 0,
                            'preco_medio' => 0,
                            'vendas_count' => 0
                        ];
                    }
                    
                    // Converter para números
                    $quantidade = (int)$item['quantidade'];
                    $totalItem = (float)$item['total_item'];
                    
                    $agrupado[$chave]['quantidade_total'] += $quantidade;
                    $agrupado[$chave]['valor_total'] += $totalItem;
                    $agrupado[$chave]['vendas_count']++;
                }

                // Calcular preço médio
                foreach ($agrupado as &$item) {
                    if ($item['quantidade_total'] > 0) {
                        $item['preco_medio'] = round($item['valor_total'] / $item['quantidade_total'], 2);
                    } else {
                        $item['preco_medio'] = 0;
                    }
                }

                $dados = array_values($agrupado);
            }

            // Calcular resumo financeiro
            $resumo = $this->calcularResumoFinanceiro($dataInicio, $dataFim, $tipoEstoque);

            return [
                'dados' => $dados,
                'resumo' => $resumo,
                'filtros' => [
                    'data_inicio' => $dataInicio,
                    'data_fim' => $dataFim,
                    'tipo_estoque' => $tipoEstoque,
                    'agrupar' => $agrupar
                ]
            ];

        } catch (Exception $e) {
            error_log("Erro ao buscar relatórios: " . $e->getMessage());
            throw $e;
        }
    }

    // Calcular resumo financeiro
    private function calcularResumoFinanceiro($dataInicio = null, $dataFim = null, $tipoEstoque = null) {
        try {
            $query = "SELECT 
                        COUNT(DISTINCT v.id) as total_vendas,
                        COUNT(vi.id) as total_itens,
                        SUM(v.total_venda) as receita_total,
                        SUM(vi.quantidade) as unidades_vendidas,
                        COUNT(DISTINCT vi.livro_id) as livros_diferentes
                     FROM vendas v
                     JOIN venda_itens vi ON v.id = vi.venda_id
                     WHERE 1=1";

            $params = [];

            if ($dataInicio) {
                $query .= " AND DATE(v.data_venda) >= :data_inicio";
                $params[':data_inicio'] = $dataInicio;
            }

            if ($dataFim) {
                $query .= " AND DATE(v.data_venda) <= :data_fim";
                $params[':data_fim'] = $dataFim;
            }

            if ($tipoEstoque) {
                $query .= " AND vi.tipo_estoque = :tipo_estoque";
                $params[':tipo_estoque'] = $tipoEstoque;
            }

            $stmt = $this->conn->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();

            $resumo = $stmt->fetch(PDO::FETCH_ASSOC);

            // Buscar resumo por forma de pagamento
            $queryFormas = "SELECT 
                            v.forma_pagamento,
                            COUNT(DISTINCT v.id) as vendas,
                            SUM(v.total_venda) as total
                           FROM vendas v
                           JOIN venda_itens vi ON v.id = vi.venda_id
                           WHERE 1=1";

            if ($dataInicio) {
                $queryFormas .= " AND DATE(v.data_venda) >= :data_inicio";
            }
            if ($dataFim) {
                $queryFormas .= " AND DATE(v.data_venda) <= :data_fim";
            }
            if ($tipoEstoque) {
                $queryFormas .= " AND vi.tipo_estoque = :tipo_estoque";
            }

            $queryFormas .= " GROUP BY v.forma_pagamento ORDER BY total DESC";

            $stmtFormas = $this->conn->prepare($queryFormas);
            foreach ($params as $key => $value) {
                $stmtFormas->bindValue($key, $value);
            }
            $stmtFormas->execute();

            $resumo['formas_pagamento'] = $stmtFormas->fetchAll(PDO::FETCH_ASSOC);

            return $resumo;

        } catch (Exception $e) {
            error_log("Erro ao calcular resumo financeiro: " . $e->getMessage());
            return [
                'total_vendas' => 0,
                'total_itens' => 0,
                'receita_total' => 0,
                'unidades_vendidas' => 0,
                'livros_diferentes' => 0,
                'formas_pagamento' => []
            ];
        }
    }
}
?>
