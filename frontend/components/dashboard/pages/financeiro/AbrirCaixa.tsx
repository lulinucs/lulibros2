import React, { useState } from 'react';

interface AbrirCaixaProps {
  isLoading: boolean;
  onAbrirCaixa: (fundoInicial: number) => Promise<void>;
}

const AbrirCaixa: React.FC<AbrirCaixaProps> = ({ isLoading, onAbrirCaixa }) => {
  const [fundoInicial, setFundoInicial] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fundoInicial) {
      await onAbrirCaixa(parseFloat(fundoInicial));
      setFundoInicial('');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-800 mb-4">🔓 Abrir Novo Caixa</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fundo Inicial (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={fundoInicial}
              onChange={(e) => setFundoInicial(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !fundoInicial}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Abrindo...' : 'Abrir Caixa'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AbrirCaixa;
