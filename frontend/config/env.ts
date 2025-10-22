// Declarações de tipo para Vite
declare global {
  interface ImportMeta {
    env: {
      VITE_API_BASE_URL?: string;
      VITE_API_TIMEOUT?: string;
      VITE_APP_NAME?: string;
      VITE_APP_VERSION?: string;
      VITE_APP_ENV?: string;
      VITE_DEBUG?: string;
    };
  }
}

// Configurações de ambiente para o frontend
export const config = {
  // URL base da API - será substituída pelas variáveis de ambiente
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  
  // Timeout para requisições
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  
  // Configurações da aplicação
  appName: import.meta.env.VITE_APP_NAME || 'Lulibros',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
  
  // Debug
  debug: import.meta.env.VITE_DEBUG === 'true' || import.meta.env.VITE_APP_ENV === 'development',
  
  // URLs completas da API
  get apiUrls() {
    return {
      auth: {
        login: `${this.apiBaseUrl}/auth/login`,
        register: `${this.apiBaseUrl}/auth/register`,
        verify: `${this.apiBaseUrl}/auth/verify`,
        validatePassword: `${this.apiBaseUrl}/auth/validate-password`,
      },
        produtos: {
          listar: `${this.apiBaseUrl}/produtos`,
          obter: (id: number) => `${this.apiBaseUrl}/produtos/${id}`,
          atualizar: (id: number) => `${this.apiBaseUrl}/produtos/${id}`,
          uploadLivros: `${this.apiBaseUrl}/produtos/upload-livros`,
          uploadPrecos: `${this.apiBaseUrl}/produtos/upload-precos`,
          uploadEstoque: `${this.apiBaseUrl}/produtos/upload-estoque`,
          updatePreco: `${this.apiBaseUrl}/produtos/update-preco`,
          updateEstoque: `${this.apiBaseUrl}/produtos/update-estoque`,
        },
        financeiro: {
          caixa: {
            abrir: `${this.apiBaseUrl}/financeiro/caixa/abrir`,
            fechar: `${this.apiBaseUrl}/financeiro/caixa/fechar`,
            status: `${this.apiBaseUrl}/financeiro/caixa/status`,
            listar: `${this.apiBaseUrl}/financeiro/caixa`,
            obter: `${this.apiBaseUrl}/financeiro/caixa`,
          },
          movimentacoes: {
            criar: `${this.apiBaseUrl}/financeiro/movimentacoes`,
            listar: `${this.apiBaseUrl}/financeiro/movimentacoes`,
          },
          estatisticas: `${this.apiBaseUrl}/financeiro/estatisticas`,
          relatorio: `${this.apiBaseUrl}/financeiro/relatorio`,
          exportarRelatorio: `${this.apiBaseUrl}/financeiro/relatorio/exportar`,
        },
        clientes: {
          criar: `${this.apiBaseUrl}/clientes`,
          listar: `${this.apiBaseUrl}/clientes`,
          obter: `${this.apiBaseUrl}/clientes`,
          atualizar: `${this.apiBaseUrl}/clientes`,
          deletar: `${this.apiBaseUrl}/clientes`,
          buscarPorCpf: `${this.apiBaseUrl}/clientes/cpf`,
          estatisticas: `${this.apiBaseUrl}/clientes/estatisticas`,
        },
        vendas: {
          buscarLivroPorIsbn: (isbn: string) => `${this.apiBaseUrl}/vendas/produtos/isbn/${isbn}`,
          verificarEstoque: (id: number) => `${this.apiBaseUrl}/vendas/produtos/${id}/estoque`,
          finalizar: `${this.apiBaseUrl}/vendas`,
          listar: `${this.apiBaseUrl}/vendas`,
          obter: (id: number) => `${this.apiBaseUrl}/vendas/${id}`,
          estatisticas: `${this.apiBaseUrl}/vendas/estatisticas`,
          relatorios: `${this.apiBaseUrl}/vendas/relatorios`,
          exportarRelatorios: `${this.apiBaseUrl}/vendas/relatorios/exportar`,
        }
    };
  }
};

// Função para log de debug (só funciona em desenvolvimento)
export const debugLog = (...args: any[]) => {
  if (config.debug) {
    console.log('[Lulibros Debug]', ...args);
  }
};

// Função para validar configuração
export const validateConfig = () => {
  const required = ['apiBaseUrl'];
  const missing = required.filter(key => !config[key as keyof typeof config]);
  
  if (missing.length > 0) {
    console.error('Configuração inválida. Variáveis faltando:', missing);
    return false;
  }
  
  debugLog('Configuração carregada:', config);
  return true;
};

// Validar configuração ao carregar
validateConfig();
