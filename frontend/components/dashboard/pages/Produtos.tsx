import React, { useState, useEffect } from 'react';
import { config, debugLog } from '../../../config/env';
import { getToken, isAuthenticated, verifyToken } from '../../../utils/auth';
import ConfirmationModal from '../../common/ConfirmationModal';

interface Livro {
  id: number;
  isbn: string;
  titulo: string;
  autor: string;
  editora: string;
  criado_em: string;
  precos: Preco[];
  estoque: Estoque[];
}

interface Preco {
  tipo_estoque: string;
  preco: number;
  criado_em: string;
}

interface Estoque {
  tipo_estoque: string;
  quantidade: number;
  atualizado_em: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const Produtos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'massiva' | 'individual'>('massiva');
  
  // Estados para Gestão Massiva
  const [livrosFile, setLivrosFile] = useState<File | null>(null);
  const [precosFile, setPrecosFile] = useState<File | null>(null);
  const [estoqueFile, setEstoqueFile] = useState<File | null>(null);
  const [operacaoEstoque, setOperacaoEstoque] = useState<'substituir' | 'adicionar'>('substituir');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingEndpoint, setPendingEndpoint] = useState<string>('');
  const [pendingOperacao, setPendingOperacao] = useState<string>('');

  // Estados para Gestão Individual
  const [livros, setLivros] = useState<Livro[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstoque, setFiltroEstoque] = useState<'todos' | 'novo' | 'saldo'>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para edição individual
  const [editingLivro, setEditingLivro] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<{
    livro: {
      titulo: string;
      autor: string;
      editora: string;
    };
    precos: { [key: string]: number };
    estoque: { [key: string]: number };
  } | null>(null);

  useEffect(() => {
    // Verificar autenticação ao carregar o componente
    const checkAuth = async () => {
      debugLog('Verificando autenticação...');
      if (!isAuthenticated()) {
        debugLog('Usuário não autenticado');
        setError('Você precisa fazer login para acessar esta página.');
        return;
      }

      // Verificar se o token ainda é válido
      const isValid = await verifyToken();
      if (!isValid) {
        debugLog('Token inválido ou expirado');
        setError('Sua sessão expirou. Faça login novamente.');
        return;
      }

      debugLog('Usuário autenticado com sucesso');
      
      if (activeTab === 'individual') {
        fetchLivros();
      }
    };

    checkAuth();
  }, [activeTab]);

  // Limpar mensagem de upload quando mudar de aba
  useEffect(() => {
    if (activeTab === 'individual') {
      setUploadMessage('');
    }
  }, [activeTab]);

  const fetchLivros = async (page = 1, search = '', filtro = 'todos') => {
    setIsLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (search) {
        params.append('search', search);
      }

      if (filtro !== 'todos') {
        params.append('tipoEstoque', filtro);
      }

      debugLog('Buscando livros:', { page, search, filtro });

      const response = await fetch(`${config.apiUrls.produtos.listar}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      debugLog('Resposta da busca:', data);

      if (response.ok) {
        setLivros(data.livros);
        setPagination(data.pagination);
      } else {
        throw new Error(data.message || 'Erro ao buscar livros');
      }
    } catch (error) {
      console.error('Erro ao buscar livros:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLivros(1, searchTerm, filtroEstoque);
  };

  const handlePageChange = (newPage: number) => {
    fetchLivros(newPage, searchTerm, filtroEstoque);
  };

  const handleFiltroChange = (novoFiltro: 'todos' | 'novo' | 'saldo') => {
    setFiltroEstoque(novoFiltro);
    fetchLivros(1, searchTerm, novoFiltro);
  };

  // Funções de upload para Gestão Massiva
  const handleLivrosUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!livrosFile) return;

    // Verificar autenticação antes do upload
    if (!isAuthenticated()) {
      setError('Você precisa fazer login para fazer upload de arquivos.');
      return;
    }

    setPendingFile(livrosFile);
    setPendingEndpoint(config.apiUrls.produtos.uploadLivros);
    setPendingOperacao('');
    setShowConfirmation(true);
  };

  const handlePrecosUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!precosFile) return;

    // Verificar autenticação antes do upload
    if (!isAuthenticated()) {
      setError('Você precisa fazer login para fazer upload de arquivos.');
      return;
    }

    setPendingFile(precosFile);
    setPendingEndpoint(config.apiUrls.produtos.uploadPrecos);
    setPendingOperacao('');
    setShowConfirmation(true);
  };

  const handleEstoqueUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estoqueFile) return;

    // Verificar autenticação antes do upload
    if (!isAuthenticated()) {
      setError('Você precisa fazer login para fazer upload de arquivos.');
      return;
    }

    setPendingFile(estoqueFile);
    setPendingEndpoint(config.apiUrls.produtos.uploadEstoque);
    setPendingOperacao(operacaoEstoque);
    setShowConfirmation(true);
  };

  const executeUpload = async () => {
    if (!pendingFile || !pendingEndpoint) return;

    setIsUploading(true);

    try {
      // Verificar autenticação antes de executar o upload
      if (!isAuthenticated()) {
        throw new Error('Você precisa fazer login para fazer upload de arquivos.');
      }

      const token = getToken();
      debugLog('Token obtido:', token ? 'Token presente' : 'Token ausente');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      // Verificar se o token ainda é válido
      const isValid = await verifyToken();
      if (!isValid) {
        throw new Error('Sua sessão expirou. Faça login novamente.');
      }

      // Criar FormData no momento da execução
      const formData = new FormData();
      formData.append('file', pendingFile);
      if (pendingOperacao) {
        formData.append('operacao', pendingOperacao);
      }

      debugLog('Enviando requisição para:', pendingEndpoint);
      debugLog('Arquivo:', pendingFile.name, 'Tamanho:', pendingFile.size);

      const response = await fetch(pendingEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      debugLog('Status da resposta:', response.status);
      debugLog('Headers da resposta:', Object.fromEntries(response.headers.entries()));

      let data;
      try {
        data = await response.json();
        debugLog('Resposta do upload:', data);
      } catch (jsonError) {
        debugLog('Erro ao fazer parse do JSON:', jsonError);
        const textResponse = await response.text();
        debugLog('Resposta em texto:', textResponse);
        throw new Error(`Erro no servidor: ${textResponse.substring(0, 200)}...`);
      }
      
      debugLog('Status da resposta:', response.status);
      debugLog('Response.ok:', response.ok);

      if (response.ok) {
        // Verificar se realmente foi sucesso baseado no resultado
        if (data.resultado && data.resultado.erros > 0) {
          // Houve erros na importação
          const erroMessage = `Importação concluída com erros: ${data.resultado.sucessos} sucessos, ${data.resultado.erros} erros.`;
          debugLog('Importação com erros:', erroMessage);
          setUploadMessage(erroMessage);
          if (data.resultado.erros_detalhes && data.resultado.erros_detalhes.length > 0) {
            setError(data.resultado.erros_detalhes.join('; '));
          }
        } else {
          // Sucesso real
          const message = data.message || 'Upload realizado com sucesso!';
          debugLog('Definindo mensagem de sucesso:', message);
          setUploadMessage(message);
          setError(''); // Limpar erros anteriores
        }
        
        // Limpar arquivos apenas se houve sucesso
        if (data.resultado && data.resultado.erros === 0) {
          setLivrosFile(null);
          setPrecosFile(null);
          setEstoqueFile(null);
        }
      } else {
        debugLog('Erro na resposta:', { status: response.status, data });
        throw new Error(data.message || `Erro no upload (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      debugLog('Erro capturado:', error);
      setUploadMessage(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsUploading(false);
      setShowConfirmation(false);
      setPendingFile(null);
      setPendingEndpoint('');
      setPendingOperacao('');
    }
  };

  const getConfirmationDetails = () => {
    if (pendingEndpoint === config.apiUrls.produtos.uploadLivros) {
      return {
        title: 'Confirmar Upload de Livros',
        message: `Tem certeza que deseja fazer upload do arquivo "${pendingFile?.name}"?`,
        type: 'info' as const,
        requiresPassword: false
      };
    } else if (pendingEndpoint === config.apiUrls.produtos.uploadPrecos) {
      return {
        title: 'Confirmar Upload de Preços',
        message: `Tem certeza que deseja fazer upload do arquivo "${pendingFile?.name}"?`,
        type: 'info' as const,
        requiresPassword: false
      };
    } else if (pendingEndpoint === config.apiUrls.produtos.uploadEstoque) {
      const operacaoText = pendingOperacao === 'substituir' ? 'SUBSTITUIR' : 'ADICIONAR AO';
      return {
        title: 'Confirmar Upload de Estoque',
        message: `⚠️ ATENÇÃO: Você está prestes a ${operacaoText} o estoque com o arquivo "${pendingFile?.name}". Esta operação pode alterar significativamente o inventário.`,
        type: 'danger' as const,
        requiresPassword: true
      };
    }
    return {
      title: 'Confirmar Operação',
      message: 'Tem certeza que deseja continuar?',
      type: 'info' as const,
      requiresPassword: false
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getTotalEstoque = (estoque: Estoque[]) => {
    return estoque.reduce((total, item) => total + item.quantidade, 0);
  };

  const getPrecoMinimo = (precos: Preco[]) => {
    if (precos.length === 0) return null;
    return Math.min(...precos.map(p => p.preco));
  };

  const getPrecoMaximo = (precos: Preco[]) => {
    if (precos.length === 0) return null;
    return Math.max(...precos.map(p => p.preco));
  };

  // Funções de edição simplificada
  const startEditing = (livro: any) => {
    setEditingLivro(livro.id);
    
    // Criar cópias independentes dos dados
    const tituloInicial = String(livro.titulo || '');
    const autorInicial = String(livro.autor || '');
    const editoraInicial = String(livro.editora || '');
    
    setEditingData({
      livro: {
        titulo: tituloInicial,
        autor: autorInicial,
        editora: editoraInicial
      },
      precos: {
        'Novo': livro.precos.find((p: any) => p.tipo_estoque === 'Novo')?.preco || 0,
        'Saldo': livro.precos.find((p: any) => p.tipo_estoque === 'Saldo')?.preco || 0
      },
      estoque: {
        'Novo': livro.estoque.find((e: any) => e.tipo_estoque === 'Novo')?.quantidade || 0,
        'Saldo': livro.estoque.find((e: any) => e.tipo_estoque === 'Saldo')?.quantidade || 0
      }
    });
    
  };

  const cancelEditing = () => {
    setEditingLivro(null);
    setEditingData(null);
  };

  const updateEditingData = (field: string, value: any, subField?: string) => {
    if (!editingData) return;

    if (field === 'livro') {
      setEditingData({
        ...editingData,
        livro: {
          ...editingData.livro,
          [subField!]: String(value || '') // Forçar conversão para string
        }
      });
    } else if (field === 'precos') {
      setEditingData({
        ...editingData,
        precos: {
          ...editingData.precos,
          [subField!]: parseFloat(value) || 0
        }
      });
    } else if (field === 'estoque') {
      setEditingData({
        ...editingData,
        estoque: {
          ...editingData.estoque,
          [subField!]: parseInt(value) || 0
        }
      });
    }
  };

  const saveAllChanges = async () => {
    if (!editingLivro || !editingData) return;

    setIsLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Preparar dados do livro
      const livroData = {
        titulo: editingData.livro.titulo.trim(),
        autor: editingData.livro.autor.trim(),
        editora: editingData.livro.editora.trim()
      };

      // Salvar dados do livro
      const livroResponse = await fetch(config.apiUrls.produtos.atualizar(editingLivro), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(livroData)
      });

      if (!livroResponse.ok) {
        const data = await livroResponse.json();
        throw new Error(data.message || 'Erro ao salvar dados do livro');
      }

      // Salvar preços (só se preço > 0)
      for (const [tipo, preco] of Object.entries(editingData.precos)) {
        if (Number(preco) > 0) {
          debugLog(`Salvando preço ${tipo}:`, preco);
          const precoResponse = await fetch(config.apiUrls.produtos.updatePreco, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              livro_id: editingLivro,
              tipo_estoque: tipo,
              preco: preco
            })
          });

          const precoData = await precoResponse.json();
          debugLog(`Resposta preço ${tipo}:`, { status: precoResponse.status, data: precoData });

          if (!precoResponse.ok) {
            throw new Error(`Erro ao salvar preço ${tipo}: ${precoData.message}`);
          }
        }
      }

      // Salvar estoque (sempre, mesmo se 0)
      for (const [tipo, quantidade] of Object.entries(editingData.estoque)) {
        debugLog(`Salvando estoque ${tipo}:`, quantidade);
        const estoqueResponse = await fetch(config.apiUrls.produtos.updateEstoque, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            livro_id: editingLivro,
            tipo_estoque: tipo,
            quantidade: Math.max(0, Number(quantidade)) // Garantir que não seja negativo
          })
        });

        const estoqueData = await estoqueResponse.json();
        debugLog(`Resposta estoque ${tipo}:`, { status: estoqueResponse.status, data: estoqueData });

        if (!estoqueResponse.ok) {
          throw new Error(`Erro ao salvar estoque ${tipo}: ${estoqueData.message}`);
        }
      }

      // Recarregar apenas os dados do livro editado
      await fetchLivros(pagination.page, searchTerm, filtroEstoque);
      
      // Cancelar edição
      cancelEditing();

    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">📚 Produtos</h1>
        <p className="mt-2 text-gray-600">Gerencie o catálogo de livros da loja.</p>
      </div>

      {/* Tabs de Navegação */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'massiva', label: '📦 Gestão Massiva', icon: '📦' },
              { id: 'individual', label: '✏️ Gestão Individual', icon: '✏️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Erro de Autenticação</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                    {error.includes('login') && (
                      <p className="mt-2">
                        <button 
                          onClick={() => window.location.reload()} 
                          className="font-medium underline hover:text-red-600"
                        >
                          Clique aqui para recarregar a página e fazer login novamente
                        </button>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {uploadMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">{uploadMessage}</p>
            </div>
          )}

          {/* Tab: Gestão Massiva */}
          {activeTab === 'massiva' && (
            <div className="space-y-8">
              {/* Upload de Livros */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-800 mb-4">📚 Upload de Livros</h3>
                <p className="text-sm text-blue-600 mb-4">
                  Faça upload de um arquivo CSV ou XLS com os dados dos livros.
                </p>
                
                {/* Exemplo de arquivo */}
                <div className="mb-4 p-4 bg-white border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">📋 Exemplo de arquivo CSV:</h4>
                  <div className="bg-green-50 p-3 rounded text-sm font-mono border border-green-200">
                    <div className="text-gray-600">isbn;titulo;autor;editora</div>
                    <div className="text-gray-800">9788535914849;O Hobbit;J.R.R. Tolkien;Martins Fontes</div>
                    <div className="text-gray-800">9788535911234;O Senhor dos Anéis;J.R.R. Tolkien;Martins Fontes</div>
                    <div className="text-gray-800">9788535919999;1984;George Orwell;Companhia das Letras</div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Campos obrigatórios:</strong> isbn, titulo, autor<br/>
                    <strong>Campo opcional:</strong> editora<br/>
                    <strong>⚠️ OBRIGATÓRIO:</strong> Use ponto e vírgula (;) como separador
                  </p>
                </div>

                <form onSubmit={handleLivrosUpload} className="space-y-4">
                  <div>
                    <input
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      onChange={(e) => setLivrosFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!livrosFile || isUploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUploading ? 'Enviando...' : 'Upload de Livros'}
                  </button>
                </form>
              </div>

              {/* Upload de Preços */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-green-800 mb-4">💰 Upload de Preços</h3>
                <p className="text-sm text-green-600 mb-4">
                  Faça upload de um arquivo CSV ou XLS com os preços dos livros.
                </p>
                
                {/* Exemplo de arquivo */}
                <div className="mb-4 p-4 bg-white border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">📋 Exemplo de arquivo CSV (RECOMENDADO):</h4>
                  <div className="bg-green-50 p-3 rounded text-sm font-mono border border-green-200">
                    <div className="text-gray-600">isbn;tipo_estoque;preco</div>
                    <div className="text-gray-800">9788535914849;Novo;45.90</div>
                    <div className="text-gray-800">9788535914849;Saldo;25.50</div>
                    <div className="text-gray-800">9788535911234;Novo;52.30</div>
                    <div className="text-gray-800">9788535911234;Saldo;30.00</div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Campos obrigatórios:</strong> isbn, tipo_estoque, preco<br/>
                    <strong>Tipos de estoque:</strong> Novo, Saldo<br/>
                    <strong>Formato do preço:</strong> Use ponto como separador decimal (ex: 45.90)<br/>
                    <strong>⚠️ OBRIGATÓRIO:</strong> Use ponto e vírgula (;) como separador
                  </p>
                </div>

                <form onSubmit={handlePrecosUpload} className="space-y-4">
                  <div>
                    <input
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      onChange={(e) => setPrecosFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!precosFile || isUploading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUploading ? 'Enviando...' : 'Upload de Preços'}
                  </button>
                </form>
              </div>

              {/* Upload de Estoque */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-orange-800 mb-4">📦 Upload de Estoque</h3>
                <p className="text-sm text-orange-600 mb-4">
                  Faça upload de um arquivo CSV ou XLS com as quantidades em estoque.
                </p>
                
                {/* Exemplo de arquivo */}
                <div className="mb-4 p-4 bg-white border border-orange-200 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">📋 Exemplo de arquivo CSV (RECOMENDADO):</h4>
                  <div className="bg-green-50 p-3 rounded text-sm font-mono border border-green-200">
                    <div className="text-gray-600">isbn;tipo_estoque;quantidade</div>
                    <div className="text-gray-800">9788535914849;Novo;10</div>
                    <div className="text-gray-800">9788535914849;Saldo;5</div>
                    <div className="text-gray-800">9788535911234;Novo;15</div>
                    <div className="text-gray-800">9788535911234;Saldo;8</div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Campos obrigatórios:</strong> isbn, tipo_estoque, quantidade<br/>
                    <strong>Tipos de estoque:</strong> Novo, Saldo<br/>
                    <strong>Quantidade:</strong> Número inteiro (ex: 10, 5, 15)<br/>
                    <strong>⚠️ OBRIGATÓRIO:</strong> Use ponto e vírgula (;) como separador
                  </p>
                </div>
                
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Operações de Estoque:</h4>
                  <div className="space-y-2 text-sm text-yellow-700">
                    <div className="flex items-center">
                      <span className="font-medium">Substituir quantidade:</span>
                      <span className="ml-2">Substitui a quantidade atual pela nova quantidade</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Adicionar ao estoque:</span>
                      <span className="ml-2">Adiciona a nova quantidade à quantidade atual</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleEstoqueUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operação
                    </label>
                    <select
                      value={operacaoEstoque}
                      onChange={(e) => setOperacaoEstoque(e.target.value as 'substituir' | 'adicionar')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="substituir">Substituir quantidade</option>
                      <option value="adicionar">Adicionar ao estoque</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      O tipo de estoque deve estar no arquivo (coluna tipo_estoque)
                    </p>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      onChange={(e) => setEstoqueFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!estoqueFile || isUploading}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUploading ? 'Enviando...' : 'Upload de Estoque'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Tab: Gestão Individual */}
          {activeTab === 'individual' && (
            <div className="space-y-6">
              {/* Busca e Filtros */}
              <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por título, autor, ISBN ou editora..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'Buscando...' : 'Buscar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFilters(!showFilters)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </button>
                  </div>

                  {showFilters && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-6">
    <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filtrar por Tipo de Estoque:
                          </label>
                          <div className="flex space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="todos"
                                checked={filtroEstoque === 'todos'}
                                onChange={(e) => handleFiltroChange(e.target.value as 'todos' | 'novo' | 'saldo')}
                                className="mr-2"
                              />
                              <span className="text-sm">Todos</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="novo"
                                checked={filtroEstoque === 'novo'}
                                onChange={(e) => handleFiltroChange(e.target.value as 'todos' | 'novo' | 'saldo')}
                                className="mr-2"
                              />
                              <span className="text-sm text-green-600 font-medium">🟢 Apenas Novo</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="saldo"
                                checked={filtroEstoque === 'saldo'}
                                onChange={(e) => handleFiltroChange(e.target.value as 'todos' | 'novo' | 'saldo')}
                                className="mr-2"
                              />
                              <span className="text-sm text-orange-600 font-medium">🟠 Apenas Saldo</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Resultados */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Carregando produtos...</p>
                </div>
              ) : livros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">📚</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum Produto Encontrado</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Nenhum produto encontrado com os critérios de busca.' : 'Ainda não há produtos cadastrados.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Estatísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-gray-600 text-sm font-medium">Total de Livros</div>
                      <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-gray-600 text-sm font-medium">Página Atual</div>
                      <div className="text-2xl font-bold text-gray-900">{pagination.page} de {pagination.pages}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-gray-600 text-sm font-medium">Filtro Ativo</div>
                      <div className="text-lg font-bold text-blue-600 capitalize">
                        {filtroEstoque === 'todos' ? 'Todos' : filtroEstoque === 'novo' ? '🟢 Novo' : '🟠 Saldo'}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-gray-600 text-sm font-medium">Por Página</div>
                      <div className="text-2xl font-bold text-gray-900">{pagination.limit}</div>
                    </div>
                  </div>

                  {/* Lista de Livros */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              📚 Livro
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              💰 Preços
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              📦 Estoque
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ℹ️ Info
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {livros.map((livro) => (
                            <tr key={livro.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="space-y-2">
                                  <div className="text-sm font-medium text-gray-900">
                                    {editingLivro === livro.id ? (
                                      <input
                                        type="text"
                                        value={editingData?.livro.titulo || ''}
                                        onChange={(e) => updateEditingData('livro', e.target.value, 'titulo')}
                                        className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    ) : (
                                      <span>{livro.titulo}</span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {editingLivro === livro.id ? (
                                      <input
                                        type="text"
                                        value={editingData?.livro.autor || ''}
                                        onChange={(e) => updateEditingData('livro', e.target.value, 'autor')}
                                        className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    ) : (
                                      <span>{livro.autor}</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400">ISBN: {livro.isbn}</div>
                                  <div className="text-xs text-gray-400">
                                    {editingLivro === livro.id ? (
                                      <input
                                        type="text"
                                        value={editingData?.livro.editora || ''}
                                        onChange={(e) => updateEditingData('livro', e.target.value, 'editora')}
                                        placeholder="Editora (opcional - deixe vazio se não tiver)"
                                        className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    ) : (
                                      <span>{livro.editora || 'Sem editora'}</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Cadastrado: {formatDate(livro.criado_em)}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {livro.precos.length === 0 ? (
                                    <span className="text-gray-400 italic">Sem preços cadastrados</span>
                                  ) : (
                                    <div className="space-y-2">
                                      {livro.precos.map((preco, index) => (
                                        <div key={index} className={`flex justify-between items-center p-2 rounded ${
                                          preco.tipo_estoque === 'Novo' 
                                            ? 'bg-green-50 border border-green-200' 
                                            : 'bg-orange-50 border border-orange-200'
                                        }`}>
                                          <span className={`text-xs font-medium ${
                                            preco.tipo_estoque === 'Novo' ? 'text-green-700' : 'text-orange-700'
                                          }`}>
                                            {preco.tipo_estoque === 'Novo' ? '🟢 Novo:' : '🟠 Saldo:'}
                                          </span>
                                          <span className="font-bold text-lg">
                                            {editingLivro === livro.id ? (
                                              <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={editingData?.precos[preco.tipo_estoque] || 0}
                                                onChange={(e) => updateEditingData('precos', e.target.value, preco.tipo_estoque)}
                                                className="w-20 px-2 py-1 text-lg border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              />
                                            ) : (
                                              <span>{formatCurrency(preco.preco)}</span>
                                            )}
                                          </span>
                                        </div>
                                      ))}
                                      {livro.precos.length > 1 && (
                                        <div className="pt-2 border-t border-gray-200">
                                          <div className="flex justify-between text-xs font-medium bg-blue-50 p-2 rounded">
                                            <span className="text-blue-700">💰 Faixa de Preços:</span>
                                            <span className="text-blue-900">
                                              {formatCurrency(getPrecoMinimo(livro.precos)!)} - {formatCurrency(getPrecoMaximo(livro.precos)!)}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {livro.estoque.length === 0 ? (
                                    <span className="text-gray-400 italic">Sem estoque cadastrado</span>
                                  ) : (
                                    <div className="space-y-2">
                                      {livro.estoque.map((item, index) => (
                                        <div key={index} className={`flex justify-between items-center p-2 rounded ${
                                          item.tipo_estoque === 'Novo' 
                                            ? 'bg-green-50 border border-green-200' 
                                            : 'bg-orange-50 border border-orange-200'
                                        }`}>
                                          <span className={`text-xs font-medium ${
                                            item.tipo_estoque === 'Novo' ? 'text-green-700' : 'text-orange-700'
                                          }`}>
                                            {item.tipo_estoque === 'Novo' ? '🟢 Novo:' : '🟠 Saldo:'}
                                          </span>
                                          <span className={`font-bold text-lg ${
                                            item.quantidade === 0 ? 'text-red-600' : 
                                            item.quantidade < 5 ? 'text-yellow-600' : 'text-green-600'
                                          }`}>
                                            {editingLivro === livro.id ? (
                                              <input
                                                type="number"
                                                min="0"
                                                value={editingData?.estoque[item.tipo_estoque] || 0}
                                                onChange={(e) => updateEditingData('estoque', e.target.value, item.tipo_estoque)}
                                                className="w-20 px-2 py-1 text-lg border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              />
                                            ) : (
                                              <span>
                                                {item.quantidade} {item.quantidade === 1 ? 'unidade' : 'unidades'}
                                              </span>
                                            )}
                                          </span>
                                        </div>
                                      ))}
                                      <div className="pt-2 border-t border-gray-200">
                                        <div className="flex justify-between text-xs font-medium bg-blue-50 p-2 rounded">
                                          <span className="text-blue-700">📦 Total em Estoque:</span>
                                          <span className={`text-lg font-bold ${
                                            getTotalEstoque(livro.estoque) === 0 ? 'text-red-600' : 
                                            getTotalEstoque(livro.estoque) < 10 ? 'text-yellow-600' : 'text-green-600'
                                          }`}>
                                            {getTotalEstoque(livro.estoque)} {getTotalEstoque(livro.estoque) === 1 ? 'unidade' : 'unidades'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-center">
                                  <div className="text-xs text-gray-400 mb-2">
                                    ISBN: {livro.isbn}
                                  </div>
                                  {editingLivro === livro.id ? (
                                    <div className="flex space-x-2 justify-center">
                                      <button
                                        onClick={saveAllChanges}
                                        disabled={isLoading}
                                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                      >
                                        {isLoading ? '⏳ Salvando...' : '✓ Salvar'}
                                      </button>
                                      <button
                                        onClick={cancelEditing}
                                        disabled={isLoading}
                                        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                                      >
                                        ✕ Cancelar
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => startEditing(livro)}
                                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      ✏️ Editar
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginação */}
                    {pagination.pages > 1 && (
                      <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Página {pagination.page} de {pagination.pages}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handlePageChange(pagination.page - 1)}
                              disabled={pagination.page === 1}
                              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Anterior
                            </button>
                            <button
                              onClick={() => handlePageChange(pagination.page + 1)}
                              disabled={pagination.page === pagination.pages}
                              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Próxima
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={executeUpload}
        {...getConfirmationDetails()}
      />
    </div>
  );
};

export default Produtos;