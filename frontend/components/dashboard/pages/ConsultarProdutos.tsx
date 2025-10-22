import React, { useState, useEffect } from 'react';
import { config, debugLog } from '../../../config/env';
import { getToken } from '../../../utils/auth';

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

const ConsultarProdutos: React.FC = () => {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtroEstoque, setFiltroEstoque] = useState<'todos' | 'novo' | 'saldo'>('todos');
  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => {
    fetchLivros(1, searchTerm, filtroEstoque);
  }, []);

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };


  const abrirBuscaCapa = (isbn: string) => {
    const url = `https://www.google.com/search?q=${isbn}&tbm=isch`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Consultar Produtos</h1>
        <p className="mt-2 text-gray-600">Visualize todos os livros cadastrados com preços e estoque.</p>
      </div>

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
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Carregando produtos...</p>
        </div>
      ) : (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>

          {/* Lista de Livros */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {livros.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>Nenhum livro encontrado.</p>
                {searchTerm && (
                  <p className="mt-2">Tente ajustar os termos de busca.</p>
                )}
              </div>
            ) : (
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
                        🖼️ Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {livros.map((livro) => (
                      <tr key={livro.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-gray-900">{livro.titulo}</div>
                            <div className="text-sm text-gray-600">{livro.autor}</div>
                            {livro.editora && (
                              <div className="text-xs text-gray-500">{livro.editora}</div>
                            )}
                            <div className="text-xs text-gray-400">ISBN: {livro.isbn}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {livro.precos.length === 0 ? (
                              <span className="text-gray-400 italic">Sem preços cadastrados</span>
                            ) : (
                              <div className="space-y-1">
                                {livro.precos.map((preco, index) => (
                                  <div key={index} className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                      {preco.tipo_estoque === 'Novo' ? '🟢 Novo:' : '🟠 Saldo:'}
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                      {formatCurrency(preco.preco)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {livro.estoque.length === 0 ? (
                              <span className="text-gray-400 italic">Sem estoque cadastrado</span>
                            ) : (
                              <div className="space-y-1">
                                {livro.estoque.map((item, index) => (
                                  <div key={index} className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                      {item.tipo_estoque === 'Novo' ? '🟢 Novo:' : '🟠 Saldo:'}
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                      {item.quantidade} {item.quantidade === 1 ? 'unidade' : 'unidades'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => abrirBuscaCapa(livro.isbn)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                            title="Buscar capa do livro no Google"
                          >
                            🖼️ Ver Capa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Paginação */}
          {pagination.pages > 1 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando página {pagination.page} de {pagination.pages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = Math.max(1, pagination.page - 2) + i;
                    if (pageNum > pagination.pages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          pageNum === pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConsultarProdutos;