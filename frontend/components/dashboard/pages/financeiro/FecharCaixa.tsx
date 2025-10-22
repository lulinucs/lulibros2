import React, { useState } from 'react';

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

interface FecharCaixaProps {
  caixaAtual: Caixa | null;
  isLoading: boolean;
  onFecharCaixa: (caixaId: number, dinheiroFinal: number, creditoConferido: number, debitoConferido: number, pixConferido: number, outrosConferido: number) => Promise<void>;
}

const FecharCaixa: React.FC<FecharCaixaProps> = ({ caixaAtual, isLoading, onFecharCaixa }) => {
  const [fechamentoForm, setFechamentoForm] = useState({
    dinheiro_final: '',
    credito_conferido: '',
    debito_conferido: '',
    pix_conferido: '',
    outros_conferido: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (caixaAtual && fechamentoForm.dinheiro_final) {
      await onFecharCaixa(
        caixaAtual.id,
        parseFloat(fechamentoForm.dinheiro_final),
        parseFloat(fechamentoForm.credito_conferido) || 0,
        parseFloat(fechamentoForm.debito_conferido) || 0,
        parseFloat(fechamentoForm.pix_conferido) || 0,
        parseFloat(fechamentoForm.outros_conferido) || 0
      );
      setFechamentoForm({
        dinheiro_final: '',
        credito_conferido: '',
        debito_conferido: '',
        pix_conferido: '',
        outros_conferido: ''
      });
    }
  };

  if (!caixaAtual) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-400 text-2xl">🔒</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum Caixa Aberto</h3>
        <p className="text-gray-500">Não há caixa aberto para fechar.</p>
      </div>
    );
  }

  // Cálculos para valores esperados
  const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const dinheiro_reg = toNumber(caixaAtual.dinheiro_registrado);
  const credito_reg = toNumber(caixaAtual.credito_registrado);
  const debito_reg = toNumber(caixaAtual.debito_registrado);
  const pix_reg = toNumber(caixaAtual.pix_registrado);
  const outros_reg = toNumber(caixaAtual.outros_registrado);
  const movManuais = toNumber(caixaAtual.total_manual);
  const caixaInicial = toNumber(caixaAtual.fundo_inicial);

  const valorEsperadoDinheiro = caixaInicial + dinheiro_reg + movManuais;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Aviso Importante */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-amber-600 text-lg">⚠️</span>
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-amber-800 mb-2">Atenção: Valores Irreversíveis</h3>
            <p className="text-sm text-amber-700 mb-3">
              Após fechar o caixa, <strong>não será possível editar</strong> os valores conferidos. 
              Por favor, confira cuidadosamente todos os valores antes de confirmar.
            </p>
            <div className="bg-amber-100 rounded-lg p-3">
              <p className="text-sm text-amber-800 font-medium">
                💡 <strong>Lembrete:</strong> Some os relatórios de <strong>todas as máquinas</strong> de pagamento 
                para obter os valores corretos de cada forma de pagamento.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de Fechamento */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-lg">🔒</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Fechar Caixa</h3>
            <p className="text-sm text-gray-600">Preencha os valores conferidos com carinho ❤️</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dinheiro Final */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-green-800 mb-2">
              💵 Dinheiro Final (Espécie no caixa)
            </label>
            <div className="mb-2">
              <span className="text-sm text-green-700">
                💡 Valor esperado: <strong>{formatCurrency(valorEsperadoDinheiro)}</strong>
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              value={fechamentoForm.dinheiro_final}
              onChange={(e) => setFechamentoForm({...fechamentoForm, dinheiro_final: e.target.value})}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-green-600 mt-1">
              Conte o dinheiro físico no caixa e digite o valor encontrado
            </p>
          </div>
          
          {/* Formas de Pagamento */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">💳 Valores Conferidos das Máquinas</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  💳 Crédito Conferido
                </label>
                <div className="mb-2">
                  <span className="text-sm text-blue-700">
                    💡 Valor esperado: <strong>{formatCurrency(credito_reg)}</strong>
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fechamentoForm.credito_conferido}
                  onChange={(e) => setFechamentoForm({...fechamentoForm, credito_conferido: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-blue-600 mt-1">
                  Soma dos relatórios de todas as máquinas de crédito
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-purple-800 mb-2">
                  💳 Débito Conferido
                </label>
                <div className="mb-2">
                  <span className="text-sm text-purple-700">
                    💡 Valor esperado: <strong>{formatCurrency(debito_reg)}</strong>
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fechamentoForm.debito_conferido}
                  onChange={(e) => setFechamentoForm({...fechamentoForm, debito_conferido: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-purple-600 mt-1">
                  Soma dos relatórios de todas as máquinas de débito
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-orange-800 mb-2">
                  📱 PIX Conferido
                </label>
                <div className="mb-2">
                  <span className="text-sm text-orange-700">
                    💡 Valor esperado: <strong>{formatCurrency(pix_reg)}</strong>
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fechamentoForm.pix_conferido}
                  onChange={(e) => setFechamentoForm({...fechamentoForm, pix_conferido: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-orange-600 mt-1">
                  Soma dos relatórios de todas as máquinas de PIX
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  🔀 Outros Conferido
                </label>
                <div className="mb-2">
                  <span className="text-sm text-gray-700">
                    💡 Valor esperado: <strong>{formatCurrency(outros_reg)}</strong>
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fechamentoForm.outros_conferido}
                  onChange={(e) => setFechamentoForm({...fechamentoForm, outros_conferido: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Soma dos relatórios de outras formas de pagamento
                </p>
              </div>
            </div>
          </div>

          {/* Resumo dos Valores Esperados */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-3">📊 Resumo dos Valores Esperados</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="text-center">
                <div className="text-gray-600">Dinheiro</div>
                <div className="font-medium text-green-600">{formatCurrency(valorEsperadoDinheiro)}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Crédito</div>
                <div className="font-medium text-blue-600">{formatCurrency(credito_reg)}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Débito</div>
                <div className="font-medium text-purple-600">{formatCurrency(debito_reg)}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">PIX</div>
                <div className="font-medium text-orange-600">{formatCurrency(pix_reg)}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Outros</div>
                <div className="font-medium text-gray-600">{formatCurrency(outros_reg)}</div>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !fechamentoForm.dinheiro_final}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 disabled:from-red-300 disabled:to-pink-300 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            {isLoading ? '⏳ Fechando caixa...' : '🔒 Fechar Caixa Definitivamente'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FecharCaixa;
