<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Livro.php';
require_once __DIR__ . '/../models/Preco.php';
require_once __DIR__ . '/../models/Estoque.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ProdutosController {
    private $conn;
    private $livro;
    private $preco;
    private $estoque;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->livro = new Livro();
        $this->preco = new Preco();
        $this->estoque = new Estoque();
    }

    // Método para upload de livros via CSV
    public function uploadLivros() {
        try {
            // Verificar autenticação
            try {
                AuthMiddleware::authenticate();
            } catch (Exception $e) {
                // O método authenticate() já trata os erros de autenticação
                return;
            }

            // Verificar se foi enviado um arquivo
            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode(['message' => 'Nenhum arquivo foi enviado ou ocorreu um erro no upload.']);
                return;
            }

            $file = $_FILES['file'];
            $fileName = $file['name'];
            $fileTmpName = $file['tmp_name'];
            $fileSize = $file['size'];

            // Validações básicas do arquivo
            if ($fileSize === 0) {
                http_response_code(400);
                echo json_encode(['message' => 'O arquivo está vazio.']);
                return;
            }

            if ($fileSize > 5 * 1024 * 1024) { // 5MB máximo
                http_response_code(400);
                echo json_encode(['message' => 'O arquivo é muito grande. Máximo permitido: 5MB.']);
                return;
            }

            // Verificar extensão do arquivo
            $allowedExtensions = ['csv', 'xls', 'xlsx'];
            $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            
            if (!in_array($fileExtension, $allowedExtensions)) {
                http_response_code(400);
                echo json_encode(['message' => 'Formato de arquivo não suportado. Use CSV, XLS ou XLSX.']);
                return;
            }

            // Processar arquivo CSV
            if ($fileExtension === 'csv') {
                $this->processarCsvLivros($fileTmpName);
            } else {
                // Para XLS/XLSX, seria necessário uma biblioteca como PhpSpreadsheet
                http_response_code(400);
                echo json_encode(['message' => 'Arquivos XLS/XLSX ainda não são suportados. Use CSV.']);
                return;
            }

        } catch (Exception $e) {
            error_log("Erro no upload de livros: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Erro interno do servidor: ' . $e->getMessage()]);
        }
    }

    // Processar arquivo CSV de livros
    private function processarCsvLivros($filePath) {
        $sucessos = 0;
        $erros = 0;
        $errosDetalhes = [];
        $linha = 0;

        // Abrir arquivo CSV
        if (($handle = fopen($filePath, 'r')) !== FALSE) {
            // Pular cabeçalho se existir
            $header = fgetcsv($handle, 1000, ';');
            $linha++;

            // Remover BOM se presente
            if ($header && !empty($header[0])) {
                $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]);
            }

            // Debug: Log do cabeçalho
            error_log("DEBUG: Cabeçalho lido: " . print_r($header, true));
            error_log("DEBUG: Count do cabeçalho: " . count($header));

            // Verificar se o cabeçalho está correto
            if ($header && count($header) >= 3) {
                $expectedHeaders = ['isbn', 'titulo', 'autor', 'editora'];
                // Limpar espaços em branco e converter para lowercase
                $headerLower = array_map(function($h) { 
                    return strtolower(trim($h)); 
                }, $header);
                
                // Debug: Log dos cabeçalhos em lowercase
                error_log("DEBUG: Cabeçalho em lowercase: " . print_r($headerLower, true));
                
                // Verificar se tem pelo menos os campos obrigatórios
                if (!in_array('isbn', $headerLower) || !in_array('titulo', $headerLower) || !in_array('autor', $headerLower)) {
                    error_log("DEBUG: Cabeçalho inválido - campos obrigatórios não encontrados");
                    http_response_code(400);
                    echo json_encode(['message' => 'Cabeçalho inválido. Campos obrigatórios: isbn, titulo, autor. Campo opcional: editora. Cabeçalho encontrado: ' . implode(', ', $header)]);
                    fclose($handle);
                    return;
                }
            } else {
                error_log("DEBUG: Cabeçalho insuficiente ou vazio");
                http_response_code(400);
                echo json_encode(['message' => 'Cabeçalho insuficiente. Campos obrigatórios: isbn, titulo, autor. Campo opcional: editora.']);
                fclose($handle);
                return;
            }

            // Processar cada linha
            while (($data = fgetcsv($handle, 1000, ';')) !== FALSE) {
                $linha++;
                
                // Pular linhas vazias
                if (empty(array_filter($data))) {
                    continue;
                }

                // Validação básica da linha
                if (count($data) < 3) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: Campos insuficientes (mínimo: isbn, titulo, autor)";
                    continue;
                }

                // Extrair dados da linha
                $isbn = trim($data[0] ?? '');
                $titulo = trim($data[1] ?? '');
                $autor = trim($data[2] ?? '');
                $editora = trim($data[3] ?? '');

                // Validações básicas
                if (empty($isbn)) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: ISBN não pode estar vazio";
                    continue;
                }

                if (empty($titulo)) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: Título não pode estar vazio";
                    continue;
                }

                if (empty($autor)) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: Autor não pode estar vazio";
                    continue;
                }

                // Validar formato do ISBN (básico)
                if (!preg_match('/^[0-9]{10,13}$/', $isbn)) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: ISBN inválido (deve conter apenas números e ter 10-13 dígitos)";
                    continue;
                }

                try {
                    // Criar ou atualizar livro
                    $this->livro->isbn = $isbn;
                    $this->livro->titulo = $titulo;
                    $this->livro->autor = $autor;
                    $this->livro->editora = $editora;

                    $resultado = $this->livro->createOrUpdate();
                    
                    if ($resultado) {
                        $sucessos++;
                        
                        // Criar preços zerados para Novo e Saldo se não existirem
                        $this->criarPrecosZerados($this->livro->id);
                        
                        // Criar estoque zerado para Novo e Saldo se não existirem
                        $this->criarEstoqueZerado($this->livro->id);
                        
                    } else {
                        $erros++;
                        $errosDetalhes[] = "Linha {$linha}: Erro ao salvar livro no banco de dados";
                    }
                } catch (Exception $e) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: " . $e->getMessage();
                }
            }

            fclose($handle);
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Erro ao ler o arquivo CSV.']);
            return;
        }

        // Retornar resultado
        $resultado = [
            'message' => "Importação concluída! {$sucessos} livros processados com sucesso.",
            'resultado' => [
                'sucessos' => $sucessos,
                'erros' => $erros,
                'total_linhas' => $linha - 1, // -1 para excluir cabeçalho
                'erros_detalhes' => $errosDetalhes
            ]
        ];

        echo json_encode($resultado);
    }

    // Criar preços zerados para um livro
    private function criarPrecosZerados($livroId) {
        $tiposEstoque = ['Novo', 'Saldo'];
        
        foreach ($tiposEstoque as $tipo) {
            // Verificar se já existe preço para este tipo
            if (!$this->preco->findByLivroAndTipo($livroId, $tipo)) {
                $this->preco->livro_id = $livroId;
                $this->preco->tipo_estoque = $tipo;
                $this->preco->preco = 0.00;
                $this->preco->create();
            }
        }
    }

    // Criar estoque zerado para um livro
    private function criarEstoqueZerado($livroId) {
        $tiposEstoque = ['Novo', 'Saldo'];
        
        foreach ($tiposEstoque as $tipo) {
            // Verificar se já existe estoque para este tipo
            if (!$this->estoque->findByLivroAndTipo($livroId, $tipo)) {
                $this->estoque->livro_id = $livroId;
                $this->estoque->tipo_estoque = $tipo;
                $this->estoque->quantidade = 0;
                $this->estoque->create();
            }
        }
    }

    // Método para listar livros com paginação e filtros
    public function listar() {
        try {
            // Verificar autenticação
            try {
                AuthMiddleware::authenticate();
            } catch (Exception $e) {
                // O método authenticate() já trata os erros de autenticação
                return;
            }

            // Parâmetros de paginação
            $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
            $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 20;
            $search = isset($_GET['search']) ? trim($_GET['search']) : '';
            $tipoEstoque = isset($_GET['tipoEstoque']) ? trim($_GET['tipoEstoque']) : '';

            $offset = ($page - 1) * $limit;

            // Construir query base - usar subqueries para evitar produto cartesiano
            $query = "SELECT l.id, l.isbn, l.titulo, l.autor, l.editora, l.criado_em,
                             (SELECT GROUP_CONCAT(
                                 CONCAT('{\"tipo_estoque\":\"', tipo_estoque, '\",\"preco\":', preco, ',\"criado_em\":\"', criado_em, '\"}')
                                 SEPARATOR ','
                             ) FROM precos WHERE livro_id = l.id) as precos_json,
                             (SELECT GROUP_CONCAT(
                                 CONCAT('{\"tipo_estoque\":\"', tipo_estoque, '\",\"quantidade\":', quantidade, ',\"atualizado_em\":\"', atualizado_em, '\"}')
                                 SEPARATOR ','
                             ) FROM estoque WHERE livro_id = l.id) as estoque_json
                      FROM livros l";

            $whereConditions = [];
            $params = [];

            // Filtro de busca
            if (!empty($search)) {
                $whereConditions[] = "(l.titulo LIKE :search OR l.autor LIKE :search OR l.isbn LIKE :search OR l.editora LIKE :search)";
                $params[':search'] = "%{$search}%";
            }

            // Filtro por tipo de estoque
            if (!empty($tipoEstoque) && in_array($tipoEstoque, ['novo', 'saldo'])) {
                $whereConditions[] = "EXISTS (SELECT 1 FROM estoque WHERE livro_id = l.id AND tipo_estoque = :tipo_estoque AND quantidade > 0)";
                $params[':tipo_estoque'] = ucfirst($tipoEstoque);
            }

            // Adicionar condições WHERE
            if (!empty($whereConditions)) {
                $query .= " WHERE " . implode(' AND ', $whereConditions);
            }

            $query .= " GROUP BY l.id ORDER BY l.criado_em DESC LIMIT :offset, :limit";

            $stmt = $this->conn->prepare($query);
            
            // Bind parâmetros
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);

            $stmt->execute();
            $livros = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Debug: Log dos dados brutos
            error_log("DEBUG listar - Livros encontrados: " . count($livros));
            if (!empty($livros)) {
                error_log("DEBUG listar - Primeiro livro: " . print_r($livros[0], true));
            }

            // Processar dados dos livros
            foreach ($livros as &$livro) {
                // Processar preços
                $precos = [];
                error_log("DEBUG listar - Processando preços para livro {$livro['id']}: " . ($livro['precos_json'] ?? 'NULL'));
                if (!empty($livro['precos_json'])) {
                    // Dividir por '},{' para separar os objetos JSON corretamente
                    $precosData = preg_split('/\},\{/', $livro['precos_json']);
                    error_log("DEBUG listar - Preços data explode: " . print_r($precosData, true));
                    
                    foreach ($precosData as $index => $precoJson) {
                        // Adicionar chaves de volta se necessário
                        if ($index > 0) {
                            $precoJson = '{' . $precoJson;
                        }
                        if ($index < count($precosData) - 1) {
                            $precoJson = $precoJson . '}';
                        }
                        
                        $preco = json_decode($precoJson, true);
                        error_log("DEBUG listar - Preço JSON decode: " . print_r($preco, true));
                        if ($preco) {
                            $precos[] = $preco;
                        }
                    }
                }
                
                error_log("DEBUG listar - Preços finais: " . print_r($precos, true));
                $livro['precos'] = $precos;

                // Processar estoque
                $estoque = [];
                error_log("DEBUG listar - Processando estoque para livro {$livro['id']}: " . ($livro['estoque_json'] ?? 'NULL'));
                if (!empty($livro['estoque_json'])) {
                    // Dividir por '},{' para separar os objetos JSON corretamente
                    $estoqueData = preg_split('/\},\{/', $livro['estoque_json']);
                    error_log("DEBUG listar - Estoque data explode: " . print_r($estoqueData, true));
                    
                    foreach ($estoqueData as $index => $estoqueJson) {
                        // Adicionar chaves de volta se necessário
                        if ($index > 0) {
                            $estoqueJson = '{' . $estoqueJson;
                        }
                        if ($index < count($estoqueData) - 1) {
                            $estoqueJson = $estoqueJson . '}';
                        }
                        
                        $itemEstoque = json_decode($estoqueJson, true);
                        error_log("DEBUG listar - Estoque JSON decode: " . print_r($itemEstoque, true));
                        if ($itemEstoque) {
                            $estoque[] = $itemEstoque;
                        }
                    }
                }
                
                error_log("DEBUG listar - Estoque finais: " . print_r($estoque, true));
                $livro['estoque'] = $estoque;

                // Remover campos JSON auxiliares
                unset($livro['precos_json'], $livro['estoque_json']);
            }

            // Contar total de registros
            $countQuery = "SELECT COUNT(*) as total FROM livros l";
            
            if (!empty($whereConditions)) {
                $countQuery .= " WHERE " . implode(' AND ', $whereConditions);
            }

            $countStmt = $this->conn->prepare($countQuery);
            foreach ($params as $key => $value) {
                $countStmt->bindValue($key, $value);
            }
            $countStmt->execute();
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Calcular paginação
            $totalPages = ceil($total / $limit);

            $response = [
                'livros' => $livros,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => intval($total),
                    'pages' => $totalPages
                ]
            ];

            echo json_encode($response);

        } catch (Exception $e) {
            error_log("Erro ao listar livros: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Erro interno do servidor: ' . $e->getMessage()]);
        }
    }

    // Método para obter um livro específico
    public function obter($id = null) {
        try {
            // Verificar autenticação
            try {
                AuthMiddleware::authenticate();
            } catch (Exception $e) {
                // O método authenticate() já trata os erros de autenticação
                return;
            }

            if (!$id) {
                http_response_code(400);
                echo json_encode(['message' => 'ID do livro é obrigatório.']);
                return;
            }

            // Buscar livro
            if (!$this->livro->findById($id)) {
                http_response_code(404);
                echo json_encode(['message' => 'Livro não encontrado.']);
                return;
            }

            // Buscar preços
            $precos = $this->preco->getPrecosLivro($id);
            $precosArray = [];
            foreach ($precos as $tipo => $preco) {
                $precosArray[] = [
                    'tipo_estoque' => $tipo,
                    'preco' => floatval($preco),
                    'criado_em' => date('Y-m-d H:i:s')
                ];
            }

            // Buscar estoque
            $estoqueArray = $this->estoque->getEstoqueLivro($id);

            $livro = [
                'id' => $this->livro->id,
                'isbn' => $this->livro->isbn,
                'titulo' => $this->livro->titulo,
                'autor' => $this->livro->autor,
                'editora' => $this->livro->editora,
                'criado_em' => $this->livro->criado_em,
                'precos' => $precosArray,
                'estoque' => $estoqueArray
            ];

            echo json_encode($livro);

        } catch (Exception $e) {
            error_log("Erro ao obter livro: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Erro interno do servidor: ' . $e->getMessage()]);
        }
    }

    // Método para atualizar um livro
    public function atualizar($id = null) {
        try {
            // Verificar autenticação
            try {
                AuthMiddleware::authenticate();
            } catch (Exception $e) {
                // O método authenticate() já trata os erros de autenticação
                return;
            }

            if (!$id) {
                http_response_code(400);
                echo json_encode(['message' => 'ID do livro é obrigatório.']);
                return;
            }

            // Verificar se livro existe
            if (!$this->livro->findById($id)) {
                http_response_code(404);
                echo json_encode(['message' => 'Livro não encontrado.']);
                return;
            }

            // Obter dados do corpo da requisição
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                http_response_code(400);
                echo json_encode(['message' => 'Dados inválidos.']);
                return;
            }

            // Atualizar dados do livro
            $this->livro->titulo = $input['titulo'] ?? $this->livro->titulo;
            $this->livro->autor = $input['autor'] ?? $this->livro->autor;
            $this->livro->editora = $input['editora'] ?? $this->livro->editora;

            $query = "UPDATE livros SET titulo=:titulo, autor=:autor, editora=:editora WHERE id=:id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':titulo', $this->livro->titulo);
            $stmt->bindParam(':autor', $this->livro->autor);
            $stmt->bindParam(':editora', $this->livro->editora);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);

            if ($stmt->execute()) {
                echo json_encode(['message' => 'Livro atualizado com sucesso.']);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Erro ao atualizar livro.']);
            }

        } catch (Exception $e) {
            error_log("Erro ao atualizar livro: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Erro interno do servidor: ' . $e->getMessage()]);
        }
    }

    // Método para upload de preços via CSV
    public function uploadPrecos() {
        try {
            // Verificar autenticação
            try {
                AuthMiddleware::authenticate();
            } catch (Exception $e) {
                // O método authenticate() já trata os erros de autenticação
                return;
            }

            // Verificar se foi enviado um arquivo
            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode(['message' => 'Nenhum arquivo foi enviado ou ocorreu um erro no upload.']);
                return;
            }

            $file = $_FILES['file'];
            $fileName = $file['name'];
            $fileTmpName = $file['tmp_name'];
            $fileSize = $file['size'];

            // Validações básicas do arquivo
            if ($fileSize === 0) {
                http_response_code(400);
                echo json_encode(['message' => 'O arquivo está vazio.']);
                return;
            }

            if ($fileSize > 5 * 1024 * 1024) { // 5MB máximo
                http_response_code(400);
                echo json_encode(['message' => 'O arquivo é muito grande. Máximo permitido: 5MB.']);
                return;
            }

            // Verificar extensão do arquivo
            $allowedExtensions = ['csv', 'xls', 'xlsx'];
            $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            
            if (!in_array($fileExtension, $allowedExtensions)) {
                http_response_code(400);
                echo json_encode(['message' => 'Formato de arquivo não suportado. Use CSV, XLS ou XLSX.']);
                return;
            }

            // Processar arquivo CSV
            if ($fileExtension === 'csv') {
                $this->processarCsvPrecos($fileTmpName);
            } else {
                // Para XLS/XLSX, seria necessário uma biblioteca como PhpSpreadsheet
                http_response_code(400);
                echo json_encode(['message' => 'Arquivos XLS/XLSX ainda não são suportados. Use CSV.']);
                return;
            }

        } catch (Exception $e) {
            error_log("Erro no upload de preços: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Erro interno do servidor: ' . $e->getMessage()]);
        }
    }

    // Processar arquivo CSV de preços
    private function processarCsvPrecos($filePath) {
        $sucessos = 0;
        $erros = 0;
        $errosDetalhes = [];
        $linha = 0;

        // Abrir arquivo CSV
        if (($handle = fopen($filePath, 'r')) !== FALSE) {
            // Pular cabeçalho se existir
            $header = fgetcsv($handle, 1000, ';');
            $linha++;

            // Remover BOM se presente
            if ($header && !empty($header[0])) {
                $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]);
            }

            // Verificar se o cabeçalho está correto
            if ($header && count($header) >= 3) {
                $expectedHeaders = ['isbn', 'tipo_estoque', 'preco'];
                $headerLower = array_map(function($h) { 
                    return strtolower(trim($h)); 
                }, $header);
                
                // Verificar se tem pelo menos os campos obrigatórios
                if (!in_array('isbn', $headerLower) || !in_array('tipo_estoque', $headerLower) || !in_array('preco', $headerLower)) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Cabeçalho inválido. Campos obrigatórios: isbn, tipo_estoque, preco.']);
                    fclose($handle);
                    return;
                }
            } else {
                http_response_code(400);
                echo json_encode(['message' => 'Cabeçalho insuficiente. Campos obrigatórios: isbn, tipo_estoque, preco.']);
                fclose($handle);
                return;
            }

            // Processar cada linha
            while (($data = fgetcsv($handle, 1000, ';')) !== FALSE) {
                $linha++;
                
                // Pular linhas vazias
                if (empty(array_filter($data))) {
                    continue;
                }

                // Validação básica da linha
                if (count($data) < 3) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: Campos insuficientes (mínimo: isbn, tipo_estoque, preco)";
                    continue;
                }

                // Extrair dados da linha
                $isbn = trim($data[0] ?? '');
                $tipoEstoque = trim($data[1] ?? '');
                $preco = trim($data[2] ?? '');

                // Validações básicas
                if (empty($isbn)) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: ISBN não pode estar vazio";
                    continue;
                }

                if (empty($tipoEstoque)) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: Tipo de estoque não pode estar vazio";
                    continue;
                }

                if (empty($preco)) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: Preço não pode estar vazio";
                    continue;
                }

                // Validar formato do ISBN (básico)
                if (!preg_match('/^[0-9]{10,13}$/', $isbn)) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: ISBN inválido (deve conter apenas números e ter 10-13 dígitos)";
                    continue;
                }

                // Validar tipo de estoque
                if (!in_array($tipoEstoque, ['Novo', 'Saldo'])) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: Tipo de estoque deve ser 'Novo' ou 'Saldo'";
                    continue;
                }

                // Validar preço
                $precoFloat = floatval($preco);
                if ($precoFloat < 0) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: Preço não pode ser negativo";
                    continue;
                }

                try {
                    // Buscar livro por ISBN
                    if (!$this->livro->findByIsbn($isbn)) {
                        $erros++;
                        $errosDetalhes[] = "Linha {$linha}: Livro com ISBN {$isbn} não encontrado";
                        continue;
                    }

                    // Criar ou atualizar preço
                    $this->preco->livro_id = $this->livro->id;
                    $this->preco->tipo_estoque = $tipoEstoque;
                    $this->preco->preco = $precoFloat;

                    $resultado = $this->preco->createOrUpdate();
                    
                    if ($resultado) {
                        $sucessos++;
                    } else {
                        $erros++;
                        $errosDetalhes[] = "Linha {$linha}: Erro ao salvar preço no banco de dados";
                    }
                } catch (Exception $e) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: " . $e->getMessage();
                }
            }

            fclose($handle);
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Erro ao ler o arquivo CSV.']);
            return;
        }

        // Retornar resultado
        $resultado = [
            'message' => "Importação de preços concluída! {$sucessos} preços processados com sucesso.",
            'resultado' => [
                'sucessos' => $sucessos,
                'erros' => $erros,
                'total_linhas' => $linha - 1, // -1 para excluir cabeçalho
                'erros_detalhes' => $errosDetalhes
            ]
        ];

        echo json_encode($resultado);
    }

    // Método para upload de estoque via CSV
    public function uploadEstoque() {
        try {
            // Verificar autenticação
            try {
                AuthMiddleware::authenticate();
            } catch (Exception $e) {
                // O método authenticate() já trata os erros de autenticação
                return;
            }

            // Verificar se foi enviado um arquivo
            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode(['message' => 'Nenhum arquivo foi enviado ou ocorreu um erro no upload.']);
                return;
            }

            // Verificar operação (substituir ou adicionar)
            $operacao = $_POST['operacao'] ?? 'substituir';
            if (!in_array($operacao, ['substituir', 'adicionar'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Operação inválida. Use "substituir" ou "adicionar".']);
                return;
            }

            $file = $_FILES['file'];
            $fileName = $file['name'];
            $fileTmpName = $file['tmp_name'];
            $fileSize = $file['size'];

            // Validações básicas do arquivo
            if ($fileSize === 0) {
                http_response_code(400);
                echo json_encode(['message' => 'O arquivo está vazio.']);
                return;
            }

            if ($fileSize > 5 * 1024 * 1024) { // 5MB máximo
                http_response_code(400);
                echo json_encode(['message' => 'O arquivo é muito grande. Máximo permitido: 5MB.']);
                return;
            }

            // Verificar extensão do arquivo
            $allowedExtensions = ['csv', 'xls', 'xlsx'];
            $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            
            if (!in_array($fileExtension, $allowedExtensions)) {
                http_response_code(400);
                echo json_encode(['message' => 'Formato de arquivo não suportado. Use CSV, XLS ou XLSX.']);
                return;
            }

            // Processar arquivo CSV
            if ($fileExtension === 'csv') {
                $this->processarCsvEstoque($fileTmpName, $operacao);
            } else {
                // Para XLS/XLSX, seria necessário uma biblioteca como PhpSpreadsheet
                http_response_code(400);
                echo json_encode(['message' => 'Arquivos XLS/XLSX ainda não são suportados. Use CSV.']);
                return;
            }

        } catch (Exception $e) {
            error_log("Erro no upload de estoque: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Erro interno do servidor: ' . $e->getMessage()]);
        }
    }

    // Processar arquivo CSV de estoque
    private function processarCsvEstoque($filePath, $operacao) {
        $sucessos = 0;
        $erros = 0;
        $errosDetalhes = [];
        $linha = 0;

        // Abrir arquivo CSV
        if (($handle = fopen($filePath, 'r')) !== FALSE) {
            // Pular cabeçalho se existir
            $header = fgetcsv($handle, 1000, ';');
            $linha++;

            // Remover BOM se presente
            if ($header && !empty($header[0])) {
                $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]);
            }

            // Verificar se o cabeçalho está correto
            if ($header && count($header) >= 3) {
                $expectedHeaders = ['isbn', 'tipo_estoque', 'quantidade'];
                $headerLower = array_map(function($h) { 
                    return strtolower(trim($h)); 
                }, $header);
                
                // Verificar se tem pelo menos os campos obrigatórios
                if (!in_array('isbn', $headerLower) || !in_array('tipo_estoque', $headerLower) || !in_array('quantidade', $headerLower)) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Cabeçalho inválido. Campos obrigatórios: isbn, tipo_estoque, quantidade.']);
                    fclose($handle);
                    return;
                }
            } else {
                http_response_code(400);
                echo json_encode(['message' => 'Cabeçalho insuficiente. Campos obrigatórios: isbn, tipo_estoque, quantidade.']);
                fclose($handle);
                return;
            }

            // Processar cada linha
            while (($data = fgetcsv($handle, 1000, ';')) !== FALSE) {
                $linha++;
                
                // Pular linhas vazias
                if (empty(array_filter($data))) {
                    continue;
                }

                // Validação básica da linha
                if (count($data) < 3) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: Campos insuficientes (mínimo: isbn, tipo_estoque, quantidade)";
                    continue;
                }

                // Extrair dados da linha
                $isbn = trim($data[0] ?? '');
                $tipoEstoque = trim($data[1] ?? '');
                $quantidade = trim($data[2] ?? '');

                // Validações básicas
                if (empty($isbn)) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: ISBN não pode estar vazio";
                    continue;
                }

                if (empty($tipoEstoque)) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: Tipo de estoque não pode estar vazio";
                    continue;
                }

                if (empty($quantidade)) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: Quantidade não pode estar vazia";
                    continue;
                }

                // Validar formato do ISBN (básico)
                if (!preg_match('/^[0-9]{10,13}$/', $isbn)) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: ISBN inválido (deve conter apenas números e ter 10-13 dígitos)";
                    continue;
                }

                // Validar tipo de estoque
                if (!in_array($tipoEstoque, ['Novo', 'Saldo'])) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: Tipo de estoque deve ser 'Novo' ou 'Saldo'";
                    continue;
                }

                // Validar quantidade
                $quantidadeInt = intval($quantidade);
                if ($quantidadeInt < 0) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: Quantidade não pode ser negativa";
                    continue;
                }

                try {
                    // Buscar livro por ISBN
                    if (!$this->livro->findByIsbn($isbn)) {
                        $erros++;
                        $errosDetalhes[] = "Linha {$linha}: Livro com ISBN {$isbn} não encontrado";
                        continue;
                    }

                    // Criar ou atualizar estoque
                    $this->estoque->livro_id = $this->livro->id;
                    $this->estoque->tipo_estoque = $tipoEstoque;
                    $this->estoque->quantidade = $quantidadeInt;

                    $resultado = $this->estoque->createOrUpdate($operacao);
                    
                    if ($resultado) {
                        $sucessos++;
                    } else {
                        $erros++;
                        $errosDetalhes[] = "Linha {$linha}: Erro ao salvar estoque no banco de dados";
                    }
                } catch (Exception $e) {
                    $erros++;
                    $errosDetalhes[] = "Linha {$linha}: " . $e->getMessage();
                }
            }

            fclose($handle);
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Erro ao ler o arquivo CSV.']);
            return;
        }

        // Retornar resultado
        $operacaoText = $operacao === 'substituir' ? 'substituição' : 'adição';
        $resultado = [
            'message' => "Importação de estoque concluída! {$sucessos} registros de estoque processados com sucesso ({$operacaoText}).",
            'resultado' => [
                'sucessos' => $sucessos,
                'erros' => $erros,
                'total_linhas' => $linha - 1, // -1 para excluir cabeçalho
                'operacao' => $operacao,
                'erros_detalhes' => $errosDetalhes
            ]
        ];

        echo json_encode($resultado);
    }

    // Método para atualizar preço
    public function atualizarPreco() {
        try {
            // Verificar autenticação
            try {
                AuthMiddleware::authenticate();
            } catch (Exception $e) {
                // O método authenticate() já trata os erros de autenticação
                return;
            }

            // Obter dados do corpo da requisição
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Debug: Log dos dados recebidos
            error_log("DEBUG atualizarPreco - Input recebido: " . print_r($input, true));

            if (!$input) {
                http_response_code(400);
                echo json_encode(['message' => 'Dados inválidos.']);
                return;
            }

            // Validar campos obrigatórios
            $livro_id = $input['livro_id'] ?? null;
            $tipo_estoque = $input['tipo_estoque'] ?? null;
            $preco = $input['preco'] ?? null;

            if (!$livro_id || !$tipo_estoque || $preco === null) {
                http_response_code(400);
                echo json_encode(['message' => 'Campos obrigatórios: livro_id, tipo_estoque, preco.']);
                return;
            }

            // Validar tipo de estoque
            if (!in_array($tipo_estoque, ['Novo', 'Saldo'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Tipo de estoque deve ser "Novo" ou "Saldo".']);
                return;
            }

            // Validar preço
            $preco = floatval($preco);
            if ($preco < 0) {
                http_response_code(400);
                echo json_encode(['message' => 'Preço não pode ser negativo.']);
                return;
            }

            // Verificar se livro existe
            if (!$this->livro->findById($livro_id)) {
                http_response_code(404);
                echo json_encode(['message' => 'Livro não encontrado.']);
                return;
            }

            // Atualizar ou criar preço
            $this->preco->livro_id = $livro_id;
            $this->preco->tipo_estoque = $tipo_estoque;
            $this->preco->preco = $preco;

            error_log("DEBUG atualizarPreco - Tentando salvar: livro_id={$livro_id}, tipo={$tipo_estoque}, preco={$preco}");
            
            $resultado = $this->preco->createOrUpdate();
            
            error_log("DEBUG atualizarPreco - Resultado: " . ($resultado ? 'SUCESSO' : 'ERRO'));

            if ($resultado) {
                echo json_encode(['message' => 'Preço atualizado com sucesso.']);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Erro ao atualizar preço.']);
            }

        } catch (Exception $e) {
            error_log("Erro ao atualizar preço: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Erro interno do servidor: ' . $e->getMessage()]);
        }
    }

    // Método para atualizar estoque
    public function atualizarEstoque() {
        try {
            // Verificar autenticação
            try {
                AuthMiddleware::authenticate();
            } catch (Exception $e) {
                // O método authenticate() já trata os erros de autenticação
                return;
            }

            // Obter dados do corpo da requisição
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Debug: Log dos dados recebidos
            error_log("DEBUG atualizarEstoque - Input recebido: " . print_r($input, true));

            if (!$input) {
                http_response_code(400);
                echo json_encode(['message' => 'Dados inválidos.']);
                return;
            }

            // Validar campos obrigatórios
            $livro_id = $input['livro_id'] ?? null;
            $tipo_estoque = $input['tipo_estoque'] ?? null;
            $quantidade = $input['quantidade'] ?? null;

            if (!$livro_id || !$tipo_estoque || $quantidade === null) {
                http_response_code(400);
                echo json_encode(['message' => 'Campos obrigatórios: livro_id, tipo_estoque, quantidade.']);
                return;
            }

            // Validar tipo de estoque
            if (!in_array($tipo_estoque, ['Novo', 'Saldo'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Tipo de estoque deve ser "Novo" ou "Saldo".']);
                return;
            }

            // Validar quantidade
            $quantidade = intval($quantidade);
            if ($quantidade < 0) {
                http_response_code(400);
                echo json_encode(['message' => 'Quantidade não pode ser negativa.']);
                return;
            }

            // Verificar se livro existe
            if (!$this->livro->findById($livro_id)) {
                http_response_code(404);
                echo json_encode(['message' => 'Livro não encontrado.']);
                return;
            }

            // Atualizar ou criar estoque
            $this->estoque->livro_id = $livro_id;
            $this->estoque->tipo_estoque = $tipo_estoque;
            $this->estoque->quantidade = $quantidade;

            error_log("DEBUG atualizarEstoque - Tentando salvar: livro_id={$livro_id}, tipo={$tipo_estoque}, quantidade={$quantidade}");
            
            $resultado = $this->estoque->createOrUpdate();
            
            error_log("DEBUG atualizarEstoque - Resultado: " . ($resultado ? 'SUCESSO' : 'ERRO'));

            if ($resultado) {
                echo json_encode(['message' => 'Estoque atualizado com sucesso.']);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Erro ao atualizar estoque.']);
            }

        } catch (Exception $e) {
            error_log("Erro ao atualizar estoque: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Erro interno do servidor: ' . $e->getMessage()]);
        }
    }
}
