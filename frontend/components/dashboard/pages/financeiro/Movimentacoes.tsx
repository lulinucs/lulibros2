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

interface MovimentacoesProps {
  caixaAtual: Caixa | null;
  isLoading: boolean;
  onCriarMovimentacao: (tipo: 'insercao' | 'retirada', valor: number, motivo: string) => Promise<void>;
}

const Movimentacoes: React.FC<MovimentacoesProps> = ({ caixaAtual, isLoading, onCriarMovimentacao }) => {
  const [movimentacaoForm, setMovimentacaoForm] = useState({
    tipo: 'insercao' as 'insercao' | 'retirada',
    valor: '',
    motivo: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (movimentacaoForm.valor && movimentacaoForm.motivo) {
      await onCriarMovimentacao(
        movimentacaoForm.tipo,
        parseFloat(movimentacaoForm.valor),
        movimentacaoForm.motivo
      );
      setMovimentacaoForm({ tipo: 'insercao', valor: '', motivo: '' });
    }
  };

  if (!caixaAtual) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-400 text-2xl">🔒</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Caixa Fechado</h3>
        <p className="text-gray-500">Abra um caixa para fazer movimentações.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-yellow-800 mb-4">💸 Nova Movimentação</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Movimentação
            </label>
            <select
              value={movimentacaoForm.tipo}
              onChange={(e) => setMovimentacaoForm({...movimentacaoForm, tipo: e.target.value as 'insercao' | 'retirada'})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="insercao">➕ Inserção (Adicionar dinheiro)</option>
              <option value="retirada">➖ Retirada (Remover dinheiro)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={movimentacaoForm.valor}
              onChange={(e) => setMovimentacaoForm({...movimentacaoForm, valor: e.target.value})}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo
            </label>
            <input
              type="text"
              value={movimentacaoForm.motivo}
              onChange={(e) => setMovimentacaoForm({...movimentacaoForm, motivo: e.target.value})}
              placeholder="Ex: Sangria para banco, Reforço de caixa..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !movimentacaoForm.valor || !movimentacaoForm.motivo}
            className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-yellow-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Registrando...' : 'Registrar Movimentação'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Movimentacoes;
