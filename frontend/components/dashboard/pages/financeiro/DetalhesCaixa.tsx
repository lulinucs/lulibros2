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

interface DetalhesCaixaProps {
  caixaSelecionado: Caixa | null;
  onFechar: () => void;
}

const DetalhesCaixa: React.FC<DetalhesCaixaProps> = ({ caixaSelecionado, onFechar }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (!caixaSelecionado) {
    return null;
  }

  // Cálculos simplificados
  const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const dinheiro_reg = toNumber(caixaSelecionado.dinheiro_registrado);
  const pix_reg = toNumber(caixaSelecionado.pix_registrado);
  const debito_reg = toNumber(caixaSelecionado.debito_registrado);
  const credito_reg = toNumber(caixaSelecionado.credito_registrado);
  const outros_reg = toNumber(caixaSelecionado.outros_registrado);

  const registTotal = dinheiro_reg + pix_reg + debito_reg + credito_reg + outros_reg;

  const credito_conf = toNumber(caixaSelecionado.credito_conferido);
  const debito_conf = toNumber(caixaSelecionado.debito_conferido);
  const pix_conf = toNumber(caixaSelecionado.pix_conferido);
  const outros_conf = toNumber(caixaSelecionado.outros_conferido);

  const movManuais = toNumber(caixaSelecionado.total_manual);
  const caixaInicial = toNumber(caixaSelecionado.fundo_inicial);
  const caixaFinal = toNumber(caixaSelecionado.dinheiro_final);

  // Dinheiro conferido = Caixa Final - Caixa Inicial - Movimentações
  const dinheiro_conf = caixaSelecionado.status === 'fechado' && caixaSelecionado.dinheiro_final != null 
    ? caixaSelecionado.dinheiro_final - caixaInicial - movManuais 
    : 0;
  
  const conferidoTotal = dinheiro_conf + credito_conf + debito_conf + pix_conf + outros_conf;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            📊 Detalhes do Caixa #{caixaSelecionado.id}
          </h3>
          <button
            onClick={onFechar}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
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
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  caixaSelecionado.status === 'aberto' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {caixaSelecionado.status === 'aberto' ? '🟢 Aberto' : '🔒 Fechado'}
                </span>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-gray-100">
                <div className="text-sm font-medium text-gray-600 mb-2">Abertura</div>
                <div className="text-sm text-gray-900">
                  Aberto em <span className="font-medium">{formatDate(caixaSelecionado.data_abertura)}</span> por <span className="font-medium text-blue-600">{caixaSelecionado.admin_abertura}</span>
                </div>
              </div>
              
              {caixaSelecionado.data_fechamento && caixaSelecionado.admin_fechamento && (
                <div className="p-4 bg-white rounded-lg border border-gray-100">
                  <div className="text-sm font-medium text-gray-600 mb-2">Fechamento</div>
                  <div className="text-sm text-gray-900">
                    Fechado em <span className="font-medium">{formatDate(caixaSelecionado.data_fechamento)}</span> por <span className="font-medium text-blue-600">{caixaSelecionado.admin_fechamento}</span>
                  </div>
                </div>
              )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Caixa Inicial</div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(caixaInicial)}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Registrado</div>
                    <div className="text-lg font-bold text-green-700">
                      {formatCurrency(caixaSelecionado.dinheiro_registrado || 0)}
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
                    <div className="text-sm text-gray-600 mb-1">
                      {caixaSelecionado.status === 'aberto' ? 'Valor Esperado' : 'Caixa Final'}
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(caixaInicial + dinheiro_reg + movManuais)}
                    </div>
                    {caixaSelecionado.status === 'fechado' && caixaSelecionado.dinheiro_final != null && (
                      <div className="text-xs text-gray-500 mt-1">
                        Informado: {formatCurrency(caixaSelecionado.dinheiro_final)}
                      </div>
                    )}
                  </div>
                  
                  {caixaSelecionado.status === 'fechado' && caixaSelecionado.dinheiro_final != null && (
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Quebra</div>
                      {(() => {
                        const valorEsperado = caixaInicial + dinheiro_reg + movManuais;
                        const valorInformado = caixaSelecionado.dinheiro_final;
                        const quebra = valorInformado - valorEsperado;
                        const isRuim = quebra < 0; // Esperado > Informado = RUIM
                        const isPerfeito = quebra === 0; // Zero = PERFEITO
                        return (
                          <>
                            <div className={`text-lg font-bold ${
                              isRuim ? 'text-red-600' : 
                              isPerfeito ? 'text-green-600' : 
                              'text-yellow-600'
                            }`}>
                              {quebra >= 0 ? '+' : ''}{formatCurrency(quebra)}
                              {isPerfeito && ' 🎉'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {isRuim ? 'Falta no caixa' : isPerfeito ? 'Perfeito!' : 'Excedente no caixa'}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
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
                      {formatCurrency(caixaSelecionado.credito_registrado || 0)}
                    </div>
                  </div>
                  {caixaSelecionado.credito_conferido != null && (
                    <>
                      <div>
                        <div className="text-sm text-gray-600">Conferido</div>
                        <div className="text-lg font-bold text-blue-700">
                          {formatCurrency(caixaSelecionado.credito_conferido)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Diferença</div>
                      {(() => {
                        const registrado = caixaSelecionado.credito_registrado || 0;
                        const conferido = caixaSelecionado.credito_conferido;
                        const diferenca = conferido - registrado;
                        const isRuim = diferenca < 0; // Registrado > Conferido = RUIM
                        const isPerfeito = diferenca === 0; // Zero = PERFEITO
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
                    </>
                  )}
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
                      {formatCurrency(caixaSelecionado.debito_registrado || 0)}
                    </div>
                  </div>
                  {caixaSelecionado.debito_conferido != null && (
                    <>
                      <div>
                        <div className="text-sm text-gray-600">Conferido</div>
                        <div className="text-lg font-bold text-purple-700">
                          {formatCurrency(caixaSelecionado.debito_conferido)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Diferença</div>
                      {(() => {
                        const registrado = caixaSelecionado.debito_registrado || 0;
                        const conferido = caixaSelecionado.debito_conferido;
                        const diferenca = conferido - registrado;
                        const isRuim = diferenca < 0; // Registrado > Conferido = RUIM
                        const isPerfeito = diferenca === 0; // Zero = PERFEITO
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
                    </>
                  )}
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
                      {formatCurrency(caixaSelecionado.pix_registrado || 0)}
                    </div>
                  </div>
                  {caixaSelecionado.pix_conferido != null && (
                    <>
                      <div>
                        <div className="text-sm text-gray-600">Conferido</div>
                        <div className="text-lg font-bold text-orange-700">
                          {formatCurrency(caixaSelecionado.pix_conferido)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Diferença</div>
                      {(() => {
                        const registrado = caixaSelecionado.pix_registrado || 0;
                        const conferido = caixaSelecionado.pix_conferido;
                        const diferenca = conferido - registrado;
                        const isRuim = diferenca < 0; // Registrado > Conferido = RUIM
                        const isPerfeito = diferenca === 0; // Zero = PERFEITO
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
                    </>
                  )}
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
                      {formatCurrency(caixaSelecionado.outros_registrado || 0)}
                    </div>
                  </div>
                  {caixaSelecionado.outros_conferido != null && (
                    <>
                      <div>
                        <div className="text-sm text-gray-600">Conferido</div>
                        <div className="text-lg font-bold text-gray-700">
                          {formatCurrency(caixaSelecionado.outros_conferido)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Diferença</div>
                      {(() => {
                        const registrado = caixaSelecionado.outros_registrado || 0;
                        const conferido = caixaSelecionado.outros_conferido;
                        const diferenca = conferido - registrado;
                        const isRuim = diferenca < 0; // Registrado > Conferido = RUIM
                        const isPerfeito = diferenca === 0; // Zero = PERFEITO
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
                    </>
                  )}
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
                  <div className="text-sm text-gray-600 mb-2">Total Conferido</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(conferidoTotal)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Dinheiro + Maquininhas
                  </div>
                  {caixaSelecionado.status === 'fechado' && (
                    <div className="text-xs text-gray-400 mt-1">
                      Dinheiro: {formatCurrency(dinheiro_conf)} | Maquininhas: {formatCurrency(conferidoTotal - dinheiro_conf)}
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Diferença Total</div>
                  {(() => {
                    const diferencaTotal = conferidoTotal - registTotal;
                    const isRuim = diferencaTotal < 0; // Conferido < Registrado = RUIM
                    const isPerfeito = diferencaTotal === 0; // Zero = PERFEITO
                    return (
                      <>
                        <div className={`text-2xl font-bold ${
                          isRuim ? 'text-red-600' : 
                          isPerfeito ? 'text-green-600' : 
                          'text-yellow-600'
                        }`}>
                          {diferencaTotal >= 0 ? '+' : ''}{formatCurrency(diferencaTotal)}
                          {isPerfeito && ' 🎉'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {isRuim ? '⚠️ Sistema registrou mais (RUIM)' : 
                           isPerfeito ? '🎉 Perfeito! (ZERO)' : 
                           '✅ Conferido maior (ACEITÁVEL)'}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="text-xs text-gray-500 text-center mb-2">
                  💡 Diferença = Total Conferido (Maquininhas) - Total Registrado (Sistema)
                </div>
                <div className="text-xs text-center space-y-1">
                  <div className="text-red-600 font-medium">🔴 VERMELHO = RUIM: Sistema registrou mais que entrou dinheiro</div>
                  <div className="text-yellow-600 font-medium">🟡 AMARELO = ACEITÁVEL: Conferido maior (esqueceram de registrar vendas)</div>
                  <div className="text-green-600 font-medium">🟢 VERDE = PERFEITO: Zero diferença 🎉</div>
                </div>
              </div>
            </div>
          </div>

          {/* Movimentações */}
          {caixaSelecionado.movimentacoes && caixaSelecionado.movimentacoes.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">
                💸 Movimentações ({caixaSelecionado.movimentacoes.length})
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {caixaSelecionado.movimentacoes.map((mov) => (
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
      </div>
    </div>
  );
};

export default DetalhesCaixa;
