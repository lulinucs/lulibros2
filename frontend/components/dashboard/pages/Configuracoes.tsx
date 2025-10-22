import React, { useState, useEffect } from 'react';

const Configuracoes: React.FC = () => {
  const [descontoPadrao, setDescontoPadrao] = useState<number>(0);
  const [tipoEstoquePadrao, setTipoEstoquePadrao] = useState<string>('novo');
  const [formaPagamentoPadrao, setFormaPagamentoPadrao] = useState<string>('dinheiro');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Carregar configurações do localStorage
  useEffect(() => {
    try {
      const configSalva = localStorage.getItem('lulibros_configuracoes');
      if (configSalva) {
        const config = JSON.parse(configSalva);
        setDescontoPadrao(config.descontoPadrao || 0);
        setTipoEstoquePadrao(config.tipoEstoquePadrao || 'novo');
        setFormaPagamentoPadrao(config.formaPagamentoPadrao || 'dinheiro');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }, []);

  // Salvar configurações no localStorage
  const salvarConfiguracoes = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Validar desconto padrão
      if (descontoPadrao < 0 || descontoPadrao > 100) {
        setMessage({
          type: 'error',
          text: 'Desconto padrão deve estar entre 0% e 100%'
        });
        return;
      }


      // Salvar no localStorage
      const config = { 
        descontoPadrao,
        tipoEstoquePadrao,
        formaPagamentoPadrao
      };
      localStorage.setItem('lulibros_configuracoes', JSON.stringify(config));
      
      setMessage({
        type: 'success',
        text: 'Configurações salvas com sucesso!'
      });

      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setMessage(null);
      }, 3000);

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setMessage({
        type: 'error',
        text: 'Erro ao salvar configurações'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">⚙️ Configurações</h1>
        <p className="text-gray-600 mt-2">Gerencie as configurações gerais do sistema</p>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <span className="text-lg mr-2">
              {message.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Formulário de Configurações */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          
          {/* Desconto Padrão */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">💰</span>
              <h3 className="text-lg font-semibold text-gray-900">Desconto Padrão</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="descontoPadrao" className="block text-sm font-medium text-gray-700 mb-2">
                  Percentual de desconto padrão (%)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    id="descontoPadrao"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={descontoPadrao}
                    onChange={(e) => setDescontoPadrao(parseFloat(e.target.value) || 0)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Valor entre 0% e 100%. Será aplicado automaticamente em vendas.
                </p>
              </div>

              {/* Preview do desconto */}
              {descontoPadrao > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Preview do Desconto:</h4>
                  <div className="text-sm text-blue-800">
                    <p>• Livro de R$ 50,00 → <span className="font-semibold">R$ {((50 * (100 - descontoPadrao)) / 100).toFixed(2)}</span></p>
                    <p>• Livro de R$ 100,00 → <span className="font-semibold">R$ {((100 * (100 - descontoPadrao)) / 100).toFixed(2)}</span></p>
                    <p>• Livro de R$ 200,00 → <span className="font-semibold">R$ {((200 * (100 - descontoPadrao)) / 100).toFixed(2)}</span></p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tipo de Estoque Padrão */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">📦</span>
              <h3 className="text-lg font-semibold text-gray-900">Tipo de Estoque Padrão</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Defina se livros escaneados na venda aparecerão como "Novo" ou "Saldo" por padrão.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Estoque Novo */}
                <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  tipoEstoquePadrao === 'novo' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="tipoEstoque"
                    value="novo"
                    checked={tipoEstoquePadrao === 'novo'}
                    onChange={(e) => setTipoEstoquePadrao(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🟢</span>
                    <div>
                      <div className="font-medium text-gray-900">Novo</div>
                      <div className="text-sm text-gray-500">Livros novos por padrão</div>
                    </div>
                  </div>
                </label>

                {/* Estoque Saldo */}
                <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  tipoEstoquePadrao === 'saldo' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="tipoEstoque"
                    value="saldo"
                    checked={tipoEstoquePadrao === 'saldo'}
                    onChange={(e) => setTipoEstoquePadrao(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🟠</span>
                    <div>
                      <div className="font-medium text-gray-900">Saldo</div>
                      <div className="text-sm text-gray-500">Livros de saldo por padrão</div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Preview do Tipo de Estoque */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Tipo de Estoque Selecionado:</h4>
                <div className="text-sm text-blue-800">
                  <p>• <span className="font-semibold">Padrão:</span> {
                    tipoEstoquePadrao === 'novo' ? '🟢 Novo' : '🟠 Saldo'
                  }</p>
                  <p>• <span className="font-semibold">Aplicação:</span> Livros escaneados na venda aparecerão como "{tipoEstoquePadrao === 'novo' ? 'Novo' : 'Saldo'}" por padrão</p>
                </div>
              </div>
            </div>
          </div>

          {/* Forma de Pagamento Padrão */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">💳</span>
              <h3 className="text-lg font-semibold text-gray-900">Forma de Pagamento Padrão</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Selecione a forma de pagamento que será selecionada por padrão em novas vendas.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Dinheiro */}
                <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formaPagamentoPadrao === 'dinheiro' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="formaPagamento"
                    value="dinheiro"
                    checked={formaPagamentoPadrao === 'dinheiro'}
                    onChange={(e) => setFormaPagamentoPadrao(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💵</span>
                    <div>
                      <div className="font-medium text-gray-900">Dinheiro</div>
                      <div className="text-sm text-gray-500">Pagamento em espécie</div>
                    </div>
                  </div>
                </label>

                {/* PIX */}
                <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formaPagamentoPadrao === 'pix' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="formaPagamento"
                    value="pix"
                    checked={formaPagamentoPadrao === 'pix'}
                    onChange={(e) => setFormaPagamentoPadrao(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📱</span>
                    <div>
                      <div className="font-medium text-gray-900">PIX</div>
                      <div className="text-sm text-gray-500">Transferência instantânea</div>
                    </div>
                  </div>
                </label>

                {/* Débito */}
                <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formaPagamentoPadrao === 'debito' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="formaPagamento"
                    value="debito"
                    checked={formaPagamentoPadrao === 'debito'}
                    onChange={(e) => setFormaPagamentoPadrao(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💳</span>
                    <div>
                      <div className="font-medium text-gray-900">Débito</div>
                      <div className="text-sm text-gray-500">Cartão de débito</div>
                    </div>
                  </div>
                </label>

                {/* Crédito */}
                <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formaPagamentoPadrao === 'credito' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="formaPagamento"
                    value="credito"
                    checked={formaPagamentoPadrao === 'credito'}
                    onChange={(e) => setFormaPagamentoPadrao(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💎</span>
                    <div>
                      <div className="font-medium text-gray-900">Crédito</div>
                      <div className="text-sm text-gray-500">Cartão de crédito</div>
                    </div>
                  </div>
                </label>

                {/* Outros */}
                <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formaPagamentoPadrao === 'outros' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="formaPagamento"
                    value="outros"
                    checked={formaPagamentoPadrao === 'outros'}
                    onChange={(e) => setFormaPagamentoPadrao(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🔧</span>
                    <div>
                      <div className="font-medium text-gray-900">Outros</div>
                      <div className="text-sm text-gray-500">Outras formas</div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Preview da Forma de Pagamento */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Forma de Pagamento Selecionada:</h4>
                <div className="text-sm text-blue-800">
                  <p>• <span className="font-semibold">Padrão:</span> {
                    formaPagamentoPadrao === 'dinheiro' ? '💵 Dinheiro' :
                    formaPagamentoPadrao === 'pix' ? '📱 PIX' :
                    formaPagamentoPadrao === 'debito' ? '💳 Débito' :
                    formaPagamentoPadrao === 'credito' ? '💎 Crédito' :
                    '🔧 Outros'
                  }</p>
                  <p>• <span className="font-semibold">Aplicação:</span> Será selecionada automaticamente em novas vendas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end">
            <button
              onClick={salvarConfiguracoes}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <span className="mr-2">💾</span>
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Informações</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>As configurações são salvas localmente no seu navegador</span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>O desconto padrão será aplicado automaticamente em futuras vendas</span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>O tipo de estoque padrão será aplicado automaticamente em livros escaneados na venda</span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>A forma de pagamento padrão será selecionada automaticamente em novas vendas</span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Você pode alterar as configurações a qualquer momento</span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Para limpar as configurações, defina os valores como 0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;