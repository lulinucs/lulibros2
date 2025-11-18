
import React, { useState, useEffect } from 'react';
import { config } from '../../../config/env';
import { getToken } from '../../../utils/auth';
import { CalendarIcon, ChartBarIcon, DollarSignIcon, ShoppingCartIcon } from '../../icons/Icons';

interface RelatorioItem {
  venda_id?: number;
  data_venda?: string;
  forma_pagamento?: string;
  total_venda?: number;
  cliente_nome?: string;
  livro_titulo: string;
  livro_autor?: string;
  livro_editora?: string;
  isbn: string;
  tipo_estoque: string;
  quantidade: number;
  preco_unitario: number;
  desconto_percentual: number;
  total_item: number;
  // Campos para agrupamento
  quantidade_total?: number;
  valor_total?: number;
  preco_medio?: number;
  vendas_count?: number;
}

interface ResumoFinanceiro {
  total_vendas: number;
  total_itens: number;
  receita_total: number;
  unidades_vendidas: number;
  livros_diferentes: number;
  formas_pagamento: Array<{
    forma_pagamento: string;
    vendas: number;
    total: number;
  }>;
}

interface CaixaFinanceiro {
  id: number;
  data_abertura: string;
  data_fechamento?: string;
  admin_abertura: string;
  admin_fechamento?: string;
  status: string;
  dinheiro_inicial: number;
  dinheiro_final?: number;
  dinheiro_registrado: number;
  credito_registrado: number;
  debito_registrado: number;
  pix_registrado: number;
  outros_registrado: number;
  dinheiro_conferido?: number;
  credito_conferido?: number;
  debito_conferido?: number;
  pix_conferido?: number;
  outros_conferido?: number;
  movimentacoes: Array<{
    id: number;
    tipo: string;
    valor: number;
    descricao: string;
    data: string;
  }>;
  total_registrado: number;
  total_conferido: number;
  diferenca: number;
}

const Relatorios: React.FC = () => {
  const [dados, setDados] = useState<RelatorioItem[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [dadosFinanceiros, setDadosFinanceiros] = useState<CaixaFinanceiro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'vendas' | 'financeiro'>('vendas');
  
  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoEstoque, setTipoEstoque] = useState<string>('');
  const [agrupar, setAgrupar] = useState(false);

  // Carregar dados iniciais (últimos 30 dias)
  useEffect(() => {
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setDataFim(hoje.toISOString().split('T')[0]);
    setDataInicio(trintaDiasAtras.toISOString().split('T')[0]);
    
    carregarRelatorios(trintaDiasAtras.toISOString().split('T')[0], hoje.toISOString().split('T')[0], '', false);
  }, []);

  const carregarRelatorios = async (inicio: string, fim: string, tipo: string, agruparDados: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const params = new URLSearchParams();
      if (inicio) params.append('data_inicio', inicio);
      if (fim) params.append('data_fim', fim);
      if (tipo) params.append('tipo_estoque', tipo);
      if (agruparDados) params.append('agrupar', 'true');

      const response = await fetch(`${config.apiUrls.vendas.relatorios}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar relatórios');
      }

      const result = await response.json();
      setDados(result.data.dados);
      setResumo(result.data.resumo);

    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosFinanceiros = async (inicio: string, fim: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const params = new URLSearchParams();
      if (inicio) params.append('data_inicio', inicio);
      if (fim) params.append('data_fim', fim);

      const response = await fetch(`${config.apiUrls.financeiro.relatorio}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados financeiros');
      }

      const result = await response.json();
      setDadosFinanceiros(result.data);

    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = () => {
    if (abaAtiva === 'vendas') {
      carregarRelatorios(dataInicio, dataFim, tipoEstoque, agrupar);
    } else {
      carregarDadosFinanceiros(dataInicio, dataFim);
    }
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

  const getFormaPagamentoIcon = (forma: string) => {
    switch (forma) {
      case 'Dinheiro': return '💵';
      case 'PIX': return '📱';
      case 'Crédito': return '💎';
      case 'Débito': return '💳';
      default: return '🔧';
    }
  };

  const exportarXLS = async () => {
    if (dados.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const params = new URLSearchParams();
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);
      if (tipoEstoque) params.append('tipo_estoque', tipoEstoque);
      if (agrupar) params.append('agrupar', 'true');

      const response = await fetch(`${config.apiUrls.vendas.exportarRelatorios}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar relatório');
      }

      // Baixar arquivo Excel
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Nome do arquivo com data
      const dataAtual = new Date().toISOString().split('T')[0];
      const nomeArquivo = `relatorio_vendas_${dataAtual}.xls`;
      link.download = nomeArquivo;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const exportarFinanceiroXLS = async () => {
    if (dadosFinanceiros.length === 0) {
      alert('Não há dados financeiros para exportar');
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const params = new URLSearchParams();
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);

      const response = await fetch(`${config.apiUrls.financeiro.exportarRelatorio}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar relatório');
      }

      // Baixar arquivo Excel
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Nome do arquivo com data
      const dataAtual = new Date().toISOString().split('T')[0];
      const nomeArquivo = `relatorio_financeiro_${dataAtual}.xls`;
      link.download = nomeArquivo;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
        <p className="mt-2 text-gray-600">Análise detalhada das vendas e dados financeiros por período.</p>
        
        {/* Abas */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setAbaAtiva('vendas');
                if (dataInicio && dataFim) {
                  carregarRelatorios(dataInicio, dataFim, tipoEstoque, agrupar);
                }
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                abaAtiva === 'vendas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Relatório de Vendas
            </button>
            <button
              onClick={() => {
                setAbaAtiva('financeiro');
                if (dataInicio && dataFim) {
                  carregarDadosFinanceiros(dataInicio, dataFim);
                }
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                abaAtiva === 'financeiro'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              💰 Relatório Financeiro
            </button>
          </nav>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          {abaAtiva === 'vendas' && dados.length > 0 && (
            <button
              onClick={exportarXLS}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Exportar XLS</span>
            </button>
          )}
          {abaAtiva === 'financeiro' && dadosFinanceiros.length > 0 && (
            <button
              onClick={exportarFinanceiroXLS}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Exportar XLS</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {abaAtiva === 'vendas' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Estoque</label>
              <select
                value={tipoEstoque}
                onChange={(e) => setTipoEstoque(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="Novo">🟢 Novo</option>
                <option value="Saldo">🟠 Saldo</option>
              </select>
            </div>
          )}
          
          <div className="flex items-end">
            <button
              onClick={handleFiltrar}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Carregando...' : 'Filtrar'}
            </button>
          </div>
        </div>
        
        {abaAtiva === 'vendas' && (
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="agrupar"
              checked={agrupar}
              onChange={(e) => {
                setAgrupar(e.target.checked);
                // Filtrar automaticamente quando mudar o agrupamento
                carregarRelatorios(dataInicio, dataFim, tipoEstoque, e.target.checked);
              }}
              className="mr-2"
            />
            <label htmlFor="agrupar" className="text-sm text-gray-700">
              Agrupar por livro (mostrar preço médio)
            </label>
          </div>
        )}
      </div>

      {/* Resumo por Forma de Pagamento - Só para aba de vendas */}
      {abaAtiva === 'vendas' && resumo && resumo.formas_pagamento && resumo.formas_pagamento.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo por Forma de Pagamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumo.formas_pagamento.map((forma, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{getFormaPagamentoIcon(forma.forma_pagamento)}</span>
                    <span className="font-medium text-gray-900">{forma.forma_pagamento}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{forma.vendas} vendas</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(forma.total)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela de Dados - Só para aba de vendas */}
      {abaAtiva === 'vendas' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {agrupar ? 'Livros Vendidos (Agrupados)' : 'Detalhamento das Vendas'}
            </h3>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Carregando relatórios...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">
              <p>❌ {error}</p>
            </div>
          ) : dados.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>Nenhum dado encontrado para o período selecionado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {!agrupar && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pagamento
                        </th>
                      </>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Livro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {agrupar ? 'Preço Médio' : 'Preço Unit.'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dados.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {!agrupar && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(item.data_venda!)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.cliente_nome || 'Cliente não informado'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="flex items-center">
                              <span className="mr-2">{getFormaPagamentoIcon(item.forma_pagamento!)}</span>
                              {item.forma_pagamento}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4">
    <div>
                        <div className="text-sm font-medium text-gray-900">{item.livro_titulo}</div>
                        {item.livro_autor && (
                          <div className="text-sm text-gray-600">{item.livro_autor}</div>
                        )}
                        {item.livro_editora && (
                          <div className="text-sm text-gray-500">{item.livro_editora}</div>
                        )}
                        <div className="text-xs text-gray-400">ISBN: {item.isbn}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.tipo_estoque === 'Novo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {item.tipo_estoque === 'Novo' ? '🟢 Novo' : '🟠 Saldo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agrupar ? (item.quantidade_total || 0) : item.quantidade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(agrupar ? (item.preco_medio || 0) : item.preco_unitario)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(agrupar ? (item.valor_total || 0) : item.total_item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* Tabela de Relatório Financeiro */}
      {abaAtiva === 'financeiro' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Relatório Financeiro - Todos os Caixas</h3>
            <p className="text-sm text-gray-600">Detalhamento completo dos valores registrados vs conferidos</p>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Carregando dados financeiros...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : dadosFinanceiros.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Nenhum dado financeiro encontrado para o período selecionado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Caixa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Período
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registrado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conferido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diferença
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Movimentações
                    </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dadosFinanceiros.map((caixa) => (
                    <tr key={caixa.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{caixa.id}</div>
                        <div className="text-sm text-gray-500">
                          {caixa.admin_abertura}
                          {caixa.admin_fechamento && ` → ${caixa.admin_fechamento}`}
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(caixa.data_abertura)}
                          </div>
                          {caixa.data_fechamento && (
                            <div className="text-sm text-gray-500">
                              até {formatDate(caixa.data_fechamento)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            caixa.status === 'aberto' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {caixa.status === 'aberto' ? '🟢 Aberto' : '⚫ Fechado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(caixa.total_registrado)}
                          </div>
                          <div className="text-xs text-gray-500">
                            💵 {formatCurrency(caixa.dinheiro_registrado)} | 
                            💎 {formatCurrency(caixa.credito_registrado)} | 
                            💳 {formatCurrency(caixa.debito_registrado)} | 
                            📱 {formatCurrency(caixa.pix_registrado)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(caixa.total_conferido)}
                          </div>
                          <div className="text-xs text-gray-500">
                            💵 {formatCurrency(caixa.dinheiro_conferido || 0)} | 
                            💎 {formatCurrency(caixa.credito_conferido || 0)} | 
                            💳 {formatCurrency(caixa.debito_conferido || 0)} | 
                            📱 {formatCurrency(caixa.pix_conferido || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            caixa.diferenca === 0 
                              ? 'text-green-600' 
                              : caixa.diferenca > 0 
                                ? 'text-red-600' 
                                : 'text-yellow-600'
                          }`}>
                            {caixa.diferenca === 0 ? '🎉 Perfeito' : formatCurrency(caixa.diferenca)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {caixa.diferenca === 0 
                              ? 'Sem diferenças' 
                              : caixa.diferenca > 0 
                                ? 'Registrado > Conferido' 
                                : 'Conferido > Registrado'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {caixa.movimentacoes.length > 0 ? (
                              <div className="space-y-1">
                                {caixa.movimentacoes.slice(0, 2).map((mov, idx) => (
                                  <div key={idx} className="text-xs">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                      mov.tipo === 'entrada' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {mov.tipo === 'entrada' ? '⬆️' : '⬇️'} {formatCurrency(mov.valor)}
                                    </span>
                                    <div className="text-gray-500">{mov.descricao}</div>
                                  </div>
                                ))}
                                {caixa.movimentacoes.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{caixa.movimentacoes.length - 2} mais
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">Nenhuma</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default Relatorios;
