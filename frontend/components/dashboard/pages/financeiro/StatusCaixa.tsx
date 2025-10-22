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
  movimentacoes?: Movimentacao[];
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

interface Movimentacao {
  id: number;
  caixa_id: number;
  tipo: 'insercao' | 'retirada';
  valor: number;
  motivo: string;
  data_movimentacao: string;
  admin_nome: string;
}

interface StatusCaixaProps {
  caixaAtual: Caixa | null;
  isLoading: boolean;
  onAbrirCaixa: () => void;
}

const StatusCaixa: React.FC<StatusCaixaProps> = ({ caixaAtual, isLoading, onAbrirCaixa }) => {
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
        <p className="mt-2 text-gray-600">Carregando status do caixa...</p>
      </div>
    );
  }

  if (!caixaAtual) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-400 text-2xl">🔒</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum Caixa Aberto</h3>
        <p className="text-gray-500 mb-4">Abra um caixa para começar as operações financeiras.</p>
        <button
          onClick={onAbrirCaixa}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Abrir Caixa
        </button>
      </div>
    );
  }

  // Cálculos simplificados
  const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const dinheiro_reg = toNumber(caixaAtual.dinheiro_registrado);
  const pix_reg = toNumber(caixaAtual.pix_registrado);
  const debito_reg = toNumber(caixaAtual.debito_registrado);
  const credito_reg = toNumber(caixaAtual.credito_registrado);
  const outros_reg = toNumber(caixaAtual.outros_registrado);

  const registTotal = dinheiro_reg + pix_reg + debito_reg + credito_reg + outros_reg;

  const movManuais = toNumber(caixaAtual.total_manual);
  const caixaInicial = toNumber(caixaAtual.fundo_inicial);

  return (
    <div className="space-y-6">
      {/* Informações Gerais */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-lg">📅</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Informações Gerais</h4>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
            <span className="text-sm font-medium text-gray-600">Status</span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              🟢 Aberto
            </span>
          </div>
          
          <div className="p-4 bg-white rounded-lg border border-gray-100">
            <div className="text-sm font-medium text-gray-600 mb-2">Abertura</div>
            <div className="text-sm text-gray-900">
              Aberto em <span className="font-medium">{formatDate(caixaAtual.data_abertura)}</span> por <span className="font-medium text-blue-600">{caixaAtual.admin_abertura}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhamento por Forma de Pagamento */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-6">💳 Valores Registrados por Forma</h4>
        
        {/* Dinheiro - Seção especial com mais detalhes */}
        <div className="mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 className="font-medium text-green-800 mb-4 flex items-center">
              💵 Dinheiro (Espécie)
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Caixa Inicial</div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(caixaInicial)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Registrado</div>
                <div className="text-lg font-bold text-green-700">
                  {formatCurrency(caixaAtual.dinheiro_registrado || 0)}
                </div>
                <div className="text-xs text-gray-500">Vendas em dinheiro</div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Movimentações</div>
                <div className={`text-lg font-bold ${movManuais >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {movManuais >= 0 ? '+' : ''}{formatCurrency(movManuais)}
                </div>
                <div className="text-xs text-gray-500">
                  {movManuais >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Valor Esperado</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(caixaInicial + dinheiro_reg + movManuais)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Outras formas de pagamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Crédito */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-800 mb-3 flex items-center">
              💳 Crédito
            </h5>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Registrado</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(caixaAtual.credito_registrado || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Débito */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h5 className="font-medium text-purple-800 mb-3 flex items-center">
              💳 Débito
            </h5>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Registrado</div>
                <div className="text-lg font-bold text-purple-600">
                  {formatCurrency(caixaAtual.debito_registrado || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* PIX */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h5 className="font-medium text-orange-800 mb-3 flex items-center">
              📱 PIX
            </h5>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Registrado</div>
                <div className="text-lg font-bold text-orange-600">
                  {formatCurrency(caixaAtual.pix_registrado || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Outros */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-800 mb-3 flex items-center">
              🔀 Outros
            </h5>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Registrado</div>
                <div className="text-lg font-bold text-gray-600">
                  {formatCurrency(caixaAtual.outros_registrado || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Consolidado */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h5 className="font-medium text-blue-800 mb-4 flex items-center">
            📊 Resumo Consolidado do Dia
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Total Registrado</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(registTotal)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Todas as vendas do dia
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Fundo Inicial</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(caixaInicial)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Caixa inicial
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Total Geral</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(caixaInicial + registTotal + movManuais)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Fundo + Vendas + Movimentações
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movimentações */}
      {caixaAtual.movimentacoes && caixaAtual.movimentacoes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">
            💸 Movimentações ({caixaAtual.movimentacoes.length})
          </h4>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {caixaAtual.movimentacoes.map((mov) => (
              <div key={mov.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">
                    {mov.tipo === 'insercao' ? '➕ Inserção' : '➖ Retirada'} - {formatCurrency(mov.valor)}
                  </div>
                  <div className="text-sm text-gray-500">{mov.motivo}</div>
                  <div className="text-xs text-gray-400">
                    {formatDate(mov.data_movimentacao)} - {mov.admin_nome}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  mov.tipo === 'insercao' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {mov.tipo === 'insercao' ? 'Inserção' : 'Retirada'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusCaixa;
