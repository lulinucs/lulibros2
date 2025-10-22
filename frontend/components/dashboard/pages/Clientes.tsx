import React, { useState, useEffect } from 'react';
import { config, debugLog } from '../../../config/env';
import { getToken } from '../../../utils/auth';

interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  cpf_formatado: string;
  email?: string;
  criado_em: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'listar' | 'registrar'>('listar');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'criar' | 'editar'>('criar');

  // Estados para formulários
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: ''
  });

  useEffect(() => {
    if (activeTab === 'listar') {
      fetchClientes();
    }
  }, [activeTab]);

  const fetchClientes = async (page = 1, search = '') => {
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

      debugLog('Buscando clientes:', { page, search });

      const response = await fetch(`${config.apiUrls.clientes.listar}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      debugLog('Resposta da busca:', data);

      if (response.ok) {
        setClientes(data.clientes);
        setPagination(data.pagination);
      } else {
        throw new Error(data.message || 'Erro ao buscar clientes');
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClientes(1, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    fetchClientes(newPage, searchTerm);
  };

  const handleCriarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(config.apiUrls.clientes.criar, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          cpf: formData.cpf,
          email: formData.email || null
        })
      });

      const data = await response.json();
      debugLog('Resposta criação:', data);

      if (response.ok) {
        setFormData({ nome: '', cpf: '', email: '' });
        setActiveTab('listar');
        await fetchClientes();
      } else {
        throw new Error(data.message || 'Erro ao criar cliente');
      }
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSelecionado) return;

    setIsLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(`${config.apiUrls.clientes.atualizar}/${clienteSelecionado.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          cpf: formData.cpf,
          email: formData.email || null
        })
      });

      const data = await response.json();
      debugLog('Resposta edição:', data);

      if (response.ok) {
        setShowModal(false);
        setClienteSelecionado(null);
        setFormData({ nome: '', cpf: '', email: '' });
        await fetchClientes();
      } else {
        throw new Error(data.message || 'Erro ao atualizar cliente');
      }
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletarCliente = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este cliente?')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(`${config.apiUrls.clientes.deletar}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      debugLog('Resposta deleção:', data);

      if (response.ok) {
        await fetchClientes();
      } else {
        throw new Error(data.message || 'Erro ao deletar cliente');
      }
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (mode: 'criar' | 'editar', cliente?: Cliente) => {
    setModalMode(mode);
    if (mode === 'editar' && cliente) {
      setClienteSelecionado(cliente);
      setFormData({
        nome: cliente.nome,
        cpf: cliente.cpf,
        email: cliente.email || ''
      });
    } else {
      setClienteSelecionado(null);
      setFormData({ nome: '', cpf: '', email: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setClienteSelecionado(null);
    setFormData({ nome: '', cpf: '', email: '' });
    setError('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">👥 Clientes</h1>
        <p className="mt-2 text-gray-600">Gerencie o cadastro de clientes da loja.</p>
      </div>

      {/* Tabs de Navegação */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'listar', label: '📋 Listar Clientes', icon: '📋' },
              { id: 'registrar', label: '➕ Registrar Cliente', icon: '➕' }
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
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Tab: Listar Clientes */}
          {activeTab === 'listar' && (
            <div className="space-y-6">
              {/* Busca */}
              <div className="bg-gray-50 rounded-lg p-4">
                <form onSubmit={handleSearch} className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nome, CPF ou email..."
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
                </form>
              </div>

              {/* Lista de Clientes */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Carregando clientes...</p>
                </div>
              ) : clientes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">👥</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum Cliente Encontrado</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 'Nenhum cliente encontrado com os critérios de busca.' : 'Ainda não há clientes cadastrados.'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setActiveTab('registrar')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Registrar Primeiro Cliente
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Estatísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-gray-600 text-sm font-medium">Total de Clientes</div>
                      <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-gray-600 text-sm font-medium">Página Atual</div>
                      <div className="text-2xl font-bold text-gray-900">{pagination.page} de {pagination.pages}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-gray-600 text-sm font-medium">Por Página</div>
                      <div className="text-2xl font-bold text-gray-900">{pagination.limit}</div>
                    </div>
                  </div>

                  {/* Tabela de Clientes */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              👤 Cliente
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              📧 Contato
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              📅 Cadastrado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ⚙️ Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {clientes.map((cliente) => (
                            <tr key={cliente.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{cliente.nome}</div>
                                  <div className="text-sm text-gray-500">CPF: {cliente.cpf_formatado}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {cliente.email ? (
                                    <span className="text-blue-600">{cliente.email}</span>
                                  ) : (
                                    <span className="text-gray-400 italic">Sem email</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {formatDate(cliente.criado_em)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => openModal('editar', cliente)}
                                    className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                                  >
                                    ✏️ Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeletarCliente(cliente.id)}
                                    className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                                  >
                                    🗑️ Deletar
                                  </button>
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

          {/* Tab: Registrar Cliente */}
          {activeTab === 'registrar' && (
            <div className="max-w-md mx-auto">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-green-800 mb-4">➕ Registrar Novo Cliente</h3>
                <form onSubmit={handleCriarCliente} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Digite o nome completo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CPF *
                    </label>
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 11) {
                          setFormData({...formData, cpf: value});
                        }
                      }}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Digite apenas números (11 dígitos)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email (Opcional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="cliente@email.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading || !formData.nome || !formData.cpf}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Registrando...' : 'Registrar Cliente'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {modalMode === 'criar' ? '➕ Registrar Cliente' : '✏️ Editar Cliente'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={modalMode === 'criar' ? handleCriarCliente : handleEditarCliente} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Digite o nome completo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF *
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 11) {
                      setFormData({...formData, cpf: value});
                    }
                  }}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Digite apenas números (11 dígitos)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Opcional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="cliente@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !formData.nome || !formData.cpf}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Salvando...' : (modalMode === 'criar' ? 'Registrar' : 'Salvar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
