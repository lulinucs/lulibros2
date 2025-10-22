import React from 'react';

interface Caixa {
  id: number;
  data_abertura: string;
  data_fechamento?: string;
  status: 'aberto' | 'fechado';
  fundo_inicial: number;
  dinheiro_registrado: number;
  credito_registrado: number;
  debito_registrado: number;
  pix_registrado: number;
  outros_registrado: number;
  credito_conferido?: number;
  debito_conferido?: number;
  pix_conferido?: number;
  outros_conferido?: number;
  total_inserido_manual: number;
  total_retirado_manual: number;
  dinheiro_final?: number;
  admin_abertura: string;
  admin_fechamento?: string;
  movimentacoes?: any[];
  resumo_movimentacoes?: {
    total_movimentacoes: number;
    total_inserido: number;
    total_retirado: number;
    saldo_liquido: number;
  };
  total_registrado?: number;
  total_manual?: number;
  total_geral?: number;
  quebras?: {
    dinheiro: number;
    credito: number;
    debito: number;
    pix: number;
    outros: number;
    total: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface HistoricoCaixasProps {
  caixas: Caixa[];
  pagination: Pagination;
  isLoading: boolean;
  onFetchHistorico: (page: number) => void;
  onVerDetalhes: (caixaId: number) => void;
}

const HistoricoCaixas: React.FC<HistoricoCaixasProps> = ({ 
  caixas, 
  pagination, 
  isLoading, 
  onFetchHistorico, 
  onVerDetalhes 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Carregando histórico...</p>
      </div>
    );
  }

  if (caixas.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-400 text-2xl">📋</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum Caixa Encontrado</h3>
        <p className="text-gray-500">Ainda não há caixas registrados no sistema.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista de Caixas */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">📋 Histórico de Caixas</h3>
          <p className="text-sm text-gray-500">Total: {pagination.total} caixas</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {caixas.map((caixa) => {
            // Cálculos para o resumo consolidado
            const toNumber = (v: any) => {
              const n = Number(v);
              return Number.isFinite(n) ? n : 0;
            };

            const dinheiro_reg = toNumber(caixa.dinheiro_registrado);
            const pix_reg = toNumber(caixa.pix_registrado);
            const debito_reg = toNumber(caixa.debito_registrado);
            const credito_reg = toNumber(caixa.credito_registrado);
            const outros_reg = toNumber(caixa.outros_registrado);
            const registTotal = dinheiro_reg + pix_reg + debito_reg + credito_reg + outros_reg;

            const credito_conf = toNumber(caixa.credito_conferido);
            const debito_conf = toNumber(caixa.debito_conferido);
            const pix_conf = toNumber(caixa.pix_conferido);
            const outros_conf = toNumber(caixa.outros_conferido);
            const movManuais = toNumber(caixa.total_manual);
            const caixaInicial = toNumber(caixa.fundo_inicial);
            const caixaFinal = toNumber(caixa.dinheiro_final);
            const dinheiro_conf = caixa.status === 'fechado' && caixa.dinheiro_final != null 
              ? caixa.dinheiro_final - caixaInicial - movManuais 
              : 0;
            const conferidoTotal = dinheiro_conf + credito_conf + debito_conf + pix_conf + outros_conf;

            return (
              <div key={caixa.id} className={`p-6 hover:bg-gray-50 ${
                caixa.status === 'aberto' ? 'bg-green-50 border-l-4 border-green-500' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        caixa.status === 'aberto' ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          Caixa #{caixa.id}
                          {caixa.status === 'aberto' && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              ATUAL
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {caixa.status === 'aberto' ? 'Aberto' : 'Fechado'} em {formatDate(caixa.data_abertura)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Aberto por: {caixa.admin_abertura}
                          {caixa.admin_fechamento && ` • Fechado por: ${caixa.admin_fechamento}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {caixa.status === 'fechado' ? (
                    // Resumo Consolidado para caixas fechados
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Registrado</div>
                        <div className="text-lg font-bold text-blue-600">
                          {formatCurrency(registTotal)}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Conferido</div>
                        <div className="text-lg font-bold text-indigo-600">
                          {formatCurrency(conferidoTotal)}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Diferença</div>
                        {(() => {
                          const diferenca = conferidoTotal - registTotal;
                          const isRuim = diferenca < 0;
                          const isPerfeito = diferenca === 0;
                          return (
                            <div className={`text-lg font-bold ${
                              isRuim ? 'text-red-600' : 
                              isPerfeito ? 'text-green-600' : 
                              'text-yellow-600'
                            }`}>
                              {diferenca >= 0 ? '+' : ''}{formatCurrency(diferenca)}
                              {isPerfeito && ' 🎉'}
                            </div>
                          );
                        })()}
                      </div>
                      
                      <button
                        onClick={() => onVerDetalhes(caixa.id)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  ) : (
                    // Destaque para caixa aberto
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Fundo Inicial</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(caixa.fundo_inicial)}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Registrado</div>
                        <div className="text-lg font-bold text-blue-600">
                          {formatCurrency(registTotal)}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onVerDetalhes(caixa.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
                  onClick={() => onFetchHistorico(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => onFetchHistorico(pagination.page + 1)}
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
    </div>
  );
};

export default HistoricoCaixas;
