
import React, { useState, useEffect } from 'react';
import { ShoppingCartIcon, EyeIcon, CalendarIcon, FilterIcon, UndoIcon, AlertTriangleIcon } from '../../icons/Icons';
import { config } from '../../../config/env';
import { getToken } from '../../../utils/auth';

interface Venda {
  id: number;
  data_venda: string;
  forma_pagamento: string;
  total_venda: number;
  cliente_nome?: string;
  qtd_produtos: number;
  caixa_status?: string;
}

interface VendaDetalhes {
  venda: {
    id: number;
    data_venda: string;
    forma_pagamento: string;
    total_venda: number;
    cliente_nome?: string;
    cliente_cpf?: string;
  };
  itens: Array<{
    id: number;
    titulo: string;
    autor: string;
    editora: string;
    tipo_estoque: string;
    quantidade: number;
    preco_unitario: number;
    desconto_percentual: number;
    total_item: number;
  }>;
}

const Vendas: React.FC = () => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    data_inicio: '',
    data_fim: '',
    forma_pagamento: '',
    cliente: ''
  });
  const [paginacao, setPaginacao] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [vendaSelecionada, setVendaSelecionada] = useState<VendaDetalhes | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEstornoModal, setShowEstornoModal] = useState(false);
  const [vendaParaEstornar, setVendaParaEstornar] = useState<Venda | null>(null);
  const [estornando, setEstornando] = useState(false);

  // Carregar vendas
  const carregarVendas = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const params = new URLSearchParams();
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
      if (filtros.forma_pagamento) params.append('forma_pagamento', filtros.forma_pagamento);
      if (filtros.cliente) params.append('cliente', filtros.cliente);
      params.append('page', paginacao.page.toString());
      params.append('limit', paginacao.limit.toString());

      const response = await fetch(`${config.apiUrls.vendas.listar}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar vendas');
      }

      const data = await response.json();
      setVendas(data.vendas || []);
      setPaginacao(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0
      }));

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Carregar detalhes da venda
  const carregarDetalhesVenda = async (vendaId: number) => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch(`${config.apiUrls.vendas.obter(vendaId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar detalhes da venda');
      }

      const data = await response.json();
      setVendaSelecionada(data);
      setShowModal(true);

    } catch (error: any) {
      setError(error.message);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    setPaginacao(prev => ({ ...prev, page: 1 }));
    carregarVendas();
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      data_inicio: '',
      data_fim: '',
      forma_pagamento: '',
      cliente: ''
    });
    setPaginacao(prev => ({ ...prev, page: 1 }));
  };

  // Abrir modal de confirmação de estorno
  const abrirModalEstorno = (venda: Venda) => {
    // Verificar se o estorno é permitido
    if (venda.caixa_status && venda.caixa_status !== 'aberto') {
      alert('🚫 ESTORNO NÃO PERMITIDO!\n\nEsta venda pertence a um caixa que já foi fechado.\n\nApenas vendas do caixa aberto podem ser estornadas.');
      return;
    }
    
    setVendaParaEstornar(venda);
    setShowEstornoModal(true);
  };

  // Executar estorno
  const executarEstorno = async () => {
    if (!vendaParaEstornar) return;

    try {
      setEstornando(true);
      setError(null);

      const token = getToken();
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch(`${config.apiUrls.vendas.obter(vendaParaEstornar.id)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Verificar se é erro de caixa fechado
        if (errorData.error && errorData.error.includes('caixa está fechado')) {
          throw new Error('🚫 ESTORNO NÃO PERMITIDO!\n\nEsta venda pertence a um caixa que já foi fechado.\n\nApenas vendas do caixa aberto podem ser estornadas.');
        }
        
        throw new Error(errorData.error || 'Erro ao estornar venda');
      }

      const data = await response.json();
      
      // Recarregar lista de vendas
      await carregarVendas();
      
      // Fechar modais
      setShowEstornoModal(false);
      setVendaParaEstornar(null);
      
      // Mostrar sucesso
      alert(`✅ Venda estornada com sucesso!\n\n📊 Detalhes do estorno:\n• Total estornado: ${formatarMoeda(data.data.total_estornado)}\n• Itens estornados: ${data.data.itens_estornados}\n• Caixa afetado: ${data.data.caixa_afetado ? 'SIM' : 'NÃO'}`);

    } catch (error: any) {
      setError(error.message);
      
      // Verificar se é erro de caixa fechado (fallback)
      if (error.message.includes('caixa está fechado') || error.message.includes('caixa fechado')) {
        alert(`🚫 ESTORNO NÃO PERMITIDO!\n\nEsta venda pertence a um caixa que já foi fechado.\n\nApenas vendas do caixa aberto podem ser estornadas.`);
      } else {
        alert(`❌ Erro ao estornar venda: ${error.message}`);
      }
    } finally {
      setEstornando(false);
    }
  };

  // Carregar vendas ao montar componente
  useEffect(() => {
    carregarVendas();
  }, [paginacao.page]);

  // Formatar data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  // Formatar moeda
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Obter ícone da forma de pagamento
  const getFormaPagamentoIcon = (forma: string) => {
    switch (forma) {
      case 'Dinheiro': return '💵';
      case 'PIX': return '📱';
      case 'Débito': return '💳';
      case 'Crédito': return '💎';
      default: return '🔧';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ShoppingCartIcon className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Histórico de Vendas</h1>
                <p className="text-gray-600">Visualize e gerencie todas as vendas realizadas</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Total: {paginacao.total} vendas
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center mb-4">
            <FilterIcon className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={filtros.forma_pagamento}
                onChange={(e) => setFiltros(prev => ({ ...prev, forma_pagamento: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                <option value="Dinheiro">💵 Dinheiro</option>
                <option value="PIX">📱 PIX</option>
                <option value="Débito">💳 Débito</option>
                <option value="Crédito">💎 Crédito</option>
                <option value="Outros">🔧 Outros</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <input
                type="text"
                placeholder="Nome do cliente..."
                value={filtros.cliente}
                onChange={(e) => setFiltros(prev => ({ ...prev, cliente: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={limparFiltros}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Limpar
            </button>
            <button
              onClick={aplicarFiltros}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>

        {/* Lista de Vendas */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando vendas...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-600">❌ {error}</p>
              <button
                onClick={carregarVendas}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Tentar Novamente
              </button>
            </div>
          ) : vendas.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nenhuma venda encontrada</p>
              <p className="text-gray-400 text-sm">Ajuste os filtros ou realize uma venda</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Vendas ({vendas.length})
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {vendas.map((venda) => (
                  <div key={venda.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">#{venda.id}</span>
                            <span className="text-lg font-semibold text-gray-900">
                              {formatarMoeda(venda.total_venda)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {getFormaPagamentoIcon(venda.forma_pagamento)}
                            </span>
                            <span className="text-sm text-gray-600">
                              {venda.forma_pagamento}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {formatarData(venda.data_venda)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-4">
                          {venda.cliente_nome && (
                            <span className="text-sm text-gray-600">
                              👤 {venda.cliente_nome}
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            📚 {venda.qtd_produtos} {venda.qtd_produtos === 1 ? 'produto' : 'produtos'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => carregarDetalhesVenda(venda.id)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          Ver Detalhes
                        </button>
                        
                        <button
                          onClick={() => abrirModalEstorno(venda)}
                          disabled={venda.caixa_status && venda.caixa_status !== 'aberto'}
                          className={`px-4 py-2 text-white text-sm rounded-md transition-colors ${
                            venda.caixa_status && venda.caixa_status !== 'aberto'
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                          title={
                            venda.caixa_status && venda.caixa_status !== 'aberto'
                              ? 'Estorno não permitido: Caixa fechado'
                              : 'Estornar venda'
                          }
                        >
                          <UndoIcon className="w-4 h-4 mr-1" />
                          {venda.caixa_status && venda.caixa_status !== 'aberto' ? 'Bloqueado' : 'Estornar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Paginação */}
              {paginacao.pages > 1 && (
                <div className="p-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Página {paginacao.page} de {paginacao.pages}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPaginacao(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={paginacao.page === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      
                      <button
                        onClick={() => setPaginacao(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={paginacao.page === paginacao.pages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>

      {/* Modal de Detalhes da Venda */}
      {showModal && vendaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalhes da Venda #{vendaSelecionada.venda.id}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {/* Informações da Venda */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Data:</span>
                    <p className="font-medium">{formatarData(vendaSelecionada.venda.data_venda)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Forma de Pagamento:</span>
                    <p className="font-medium">
                      {getFormaPagamentoIcon(vendaSelecionada.venda.forma_pagamento)} {vendaSelecionada.venda.forma_pagamento}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Total:</span>
                    <p className="font-medium text-lg text-green-600">
                      {formatarMoeda(vendaSelecionada.venda.total_venda)}
                    </p>
                  </div>
                  {vendaSelecionada.venda.cliente_nome && (
                    <div>
                      <span className="text-sm text-gray-500">Cliente:</span>
                      <p className="font-medium">{vendaSelecionada.venda.cliente_nome}</p>
                      {vendaSelecionada.venda.cliente_cpf && (
                        <p className="text-sm text-gray-500">CPF: {vendaSelecionada.venda.cliente_cpf}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Itens da Venda */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Produtos ({vendaSelecionada.itens.length})
                </h4>
                
                <div className="space-y-4">
                  {vendaSelecionada.itens.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 mb-1">
                            {item.titulo}
                          </h5>
                          <p className="text-sm text-gray-600 mb-2">
                            {item.autor} • {item.editora}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.tipo_estoque === 'Novo' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {item.tipo_estoque === 'Novo' ? '🟢 Novo' : '🟠 Saldo'}
                            </span>
                            <span>Qtd: {item.quantidade}</span>
                            <span>Preço: {formatarMoeda(item.preco_unitario)}</span>
                            {item.desconto_percentual > 0 && (
                              <span>Desconto: {item.desconto_percentual}%</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatarMoeda(item.total_item)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Estorno */}
      {showEstornoModal && vendaParaEstornar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center">
              <AlertTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                ⚠️ CONFIRMAR ESTORNO
              </h3>
            </div>
            
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertTriangleIcon className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-800 mb-2">
                      🚨 ATENÇÃO: ESTA AÇÃO É IRREVERSÍVEL!
                    </h4>
                    <p className="text-red-700 text-sm mb-3">
                      Você está prestes a <strong>ESTORNAR COMPLETAMENTE</strong> esta venda. 
                      Esta ação irá:
                    </p>
                    <ul className="text-red-700 text-sm space-y-1 ml-4">
                      <li>• <strong>REMOVER</strong> a venda do sistema</li>
                      <li>• <strong>REINCREMENTAR</strong> o estoque dos produtos</li>
                      <li>• <strong>DECREMENTAR</strong> os valores do caixa</li>
                      <li>• <strong>APAGAR</strong> todos os dados relacionados</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h5 className="font-semibold text-gray-900 mb-3">📋 Detalhes da Venda:</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID da Venda:</span>
                    <span className="font-medium">#{vendaParaEstornar.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium text-green-600">
                      {formatarMoeda(vendaParaEstornar.total_venda)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Forma de Pagamento:</span>
                    <span className="font-medium">
                      {getFormaPagamentoIcon(vendaParaEstornar.forma_pagamento)} {vendaParaEstornar.forma_pagamento}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium">{formatarData(vendaParaEstornar.data_venda)}</span>
                  </div>
                  {vendaParaEstornar.cliente_nome && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-medium">{vendaParaEstornar.cliente_nome}</span>
                    </div>
                  )}
                </div>
              </div>

              

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEstornoModal(false);
                    setVendaParaEstornar(null);
                  }}
                  disabled={estornando}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Cancelar
                </button>
                
                <button
                  onClick={executarEstorno}
                  disabled={estornando}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {estornando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Estornando...
                    </>
                  ) : (
                    <>
                      <UndoIcon className="w-4 h-4 mr-2" />
                      SIM, ESTORNAR VENDA
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendas;
