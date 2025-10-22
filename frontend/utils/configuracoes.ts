export interface ConfiguracoesData {
  descontoPadrao: number;
}

const CONFIGURACOES_KEY = 'lulibros_configuracoes';

// Configurações padrão
const DEFAULT_CONFIGURACOES: ConfiguracoesData = {
  descontoPadrao: 0
};

// Carregar configurações do localStorage
export const carregarConfiguracoes = (): ConfiguracoesData => {
  try {
    const configSalva = localStorage.getItem(CONFIGURACOES_KEY);
    if (configSalva) {
      const config = JSON.parse(configSalva);
      return {
        descontoPadrao: config.descontoPadrao || 0
      };
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
  }
  
  return DEFAULT_CONFIGURACOES;
};

// Salvar configurações no localStorage
export const salvarConfiguracoes = (configuracoes: ConfiguracoesData): void => {
  try {
    localStorage.setItem(CONFIGURACOES_KEY, JSON.stringify(configuracoes));
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    throw new Error('Erro ao salvar configurações');
  }
};

// Obter desconto padrão
export const getDescontoPadrao = (): number => {
  const config = carregarConfiguracoes();
  return config.descontoPadrao;
};

// Aplicar desconto a um valor
export const aplicarDesconto = (valor: number, desconto?: number): number => {
  const descontoPadrao = desconto !== undefined ? desconto : getDescontoPadrao();
  if (descontoPadrao <= 0) return valor;
  
  return (valor * (100 - descontoPadrao)) / 100;
};

// Calcular valor com desconto
export const calcularValorComDesconto = (valor: number, desconto?: number): {
  valorOriginal: number;
  descontoAplicado: number;
  valorFinal: number;
} => {
  const descontoPadrao = desconto !== undefined ? desconto : getDescontoPadrao();
  const valorFinal = aplicarDesconto(valor, descontoPadrao);
  
  return {
    valorOriginal: valor,
    descontoAplicado: descontoPadrao,
    valorFinal: valorFinal
  };
};

// Validar configurações
export const validarConfiguracoes = (configuracoes: ConfiguracoesData): string[] => {
  const erros: string[] = [];
  
  if (configuracoes.descontoPadrao < 0) {
    erros.push('Desconto padrão não pode ser negativo');
  }
  
  if (configuracoes.descontoPadrao > 100) {
    erros.push('Desconto padrão não pode ser maior que 100%');
  }
  
  return erros;
};
