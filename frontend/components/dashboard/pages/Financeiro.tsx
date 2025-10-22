import React, { useState, useEffect } from 'react';
import { config, debugLog } from '../../../config/env';
import { getToken } from '../../../utils/auth';
import { Caixa, Movimentacao, Pagination, ActiveTab } from './financeiro/types';
import StatusCaixa from './financeiro/StatusCaixa';
import AbrirCaixa from './financeiro/AbrirCaixa';
import Movimentacoes from './financeiro/Movimentacoes';
import FecharCaixa from './financeiro/FecharCaixa';
import HistoricoCaixas from './financeiro/HistoricoCaixas';
import DetalhesCaixa from './financeiro/DetalhesCaixa';

const Financeiro: React.FC = () => {
  const [caixaAtual, setCaixaAtual] = useState<Caixa | null>(null);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [caixaSelecionado, setCaixaSelecionado] = useState<Caixa | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('status');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Handlers para os componentes filhos

  useEffect(() => {
    fetchStatusCaixa();
  }, []);

  useEffect(() => {
    if (activeTab === 'historico') {
      fetchHistoricoCaixas();
    }
  }, [activeTab]);

  const fetchStatusCaixa = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(config.apiUrls.financeiro.caixa.status, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      debugLog('Status do caixa:', data);

      if (response.ok) {
        if (data.caixa_aberto) {
          setCaixaAtual(data);
        } else {
          setCaixaAtual(null);
        }
      } else {
        throw new Error(data.message || 'Erro ao buscar status do caixa');
      }
    } catch (error) {
      console.error('Erro ao buscar status do caixa:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirCaixa = async (fundoInicial: number) => {
    setIsLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(config.apiUrls.financeiro.caixa.abrir, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fundo_inicial: fundoInicial
        })
      });

      const data = await response.json();
      debugLog('Resposta abertura caixa:', data);

      if (response.ok) {
        await fetchStatusCaixa();
        setActiveTab('status');
      } else {
        throw new Error(data.message || 'Erro ao abrir caixa');
      }
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCriarMovimentacao = async (tipo: 'insercao' | 'retirada', valor: number, motivo: string) => {
    setIsLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(config.apiUrls.financeiro.movimentacoes.criar, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo,
          valor,
          motivo
        })
      });

      const data = await response.json();
      debugLog('Resposta movimentação:', data);

      if (response.ok) {
        await fetchStatusCaixa();
      } else {
        throw new Error(data.message || 'Erro ao criar movimentação');
      }
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFecharCaixa = async (caixaId: number, dinheiroFinal: number, creditoConferido: number, debitoConferido: number, pixConferido: number, outrosConferido: number) => {
    setIsLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(config.apiUrls.financeiro.caixa.fechar, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caixa_id: caixaId,
          dinheiro_final: dinheiroFinal,
          credito_conferido: creditoConferido,
          debito_conferido: debitoConferido,
          pix_conferido: pixConferido,
          outros_conferido: outrosConferido
        })
      });

      const data = await response.json();
      debugLog('Resposta fechamento caixa:', data);

      if (response.ok) {
        await fetchStatusCaixa();
        setActiveTab('status');
      } else {
        throw new Error(data.message || 'Erro ao fechar caixa');
      }
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistoricoCaixas = async (page = 1) => {
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

      const response = await fetch(`${config.apiUrls.financeiro.caixa.listar}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      debugLog('Histórico de caixas:', data);

      if (response.ok) {
        setCaixas(data.caixas);
        setPagination(data.pagination);
      } else {
        throw new Error(data.message || 'Erro ao buscar histórico de caixas');
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de caixas:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDetalhesCaixa = async (caixaId: number) => {
    setIsLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(`${config.apiUrls.financeiro.caixa.obter}/${caixaId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      debugLog('Detalhes do caixa:', data);

      if (response.ok) {
        setCaixaSelecionado(data);
      } else {
        throw new Error(data.message || 'Erro ao buscar detalhes do caixa');
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do caixa:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerDetalhes = async (caixaId: number) => {
    await fetchDetalhesCaixa(caixaId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">💰 Painel Financeiro</h1>
        <p className="mt-2 text-gray-600">Gerencie abertura, movimentações e fechamento de caixa.</p>
      </div>

      {/* Tabs de Navegação */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'status', label: '📊 Status do Caixa', icon: '📊' },
              { id: 'abrir', label: '🔓 Abrir Caixa', icon: '🔓' },
              { id: 'movimentar', label: '💸 Movimentações', icon: '💸' },
              { id: 'fechar', label: '🔒 Fechar Caixa', icon: '🔒' },
              { id: 'historico', label: '📋 Histórico', icon: '📋' }
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

          {/* Tab: Status do Caixa */}
          {activeTab === 'status' && (
            <StatusCaixa 
              caixaAtual={caixaAtual}
              isLoading={isLoading}
              onAbrirCaixa={() => setActiveTab('abrir')}
            />
          )}

          {/* Tab: Abrir Caixa */}
          {activeTab === 'abrir' && (
            <AbrirCaixa 
              isLoading={isLoading}
              onAbrirCaixa={handleAbrirCaixa}
            />
          )}

          {/* Tab: Movimentações */}
          {activeTab === 'movimentar' && (
            <Movimentacoes 
              caixaAtual={caixaAtual}
              isLoading={isLoading}
              onCriarMovimentacao={handleCriarMovimentacao}
            />
          )}

          {/* Tab: Fechar Caixa */}
          {activeTab === 'fechar' && (
            <FecharCaixa 
              caixaAtual={caixaAtual}
              isLoading={isLoading}
              onFecharCaixa={handleFecharCaixa}
            />
          )}

          {/* Tab: Histórico */}
          {activeTab === 'historico' && (
            <HistoricoCaixas 
              caixas={caixas}
              pagination={pagination}
              isLoading={isLoading}
              onFetchHistorico={fetchHistoricoCaixas}
              onVerDetalhes={handleVerDetalhes}
            />
          )}

          {/* Modal de Detalhes do Caixa */}
          <DetalhesCaixa 
            caixaSelecionado={caixaSelecionado}
            onFechar={() => setCaixaSelecionado(null)}
          />
        </div>
      </div>
    </div>
  );
};

export default Financeiro;