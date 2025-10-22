// Utilitários para autenticação
import { config, debugLog } from '../config/env';

export interface Admin {
  id: number;
  usuario: string;
  criado_em: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  admin: Admin;
}

// Chaves para localStorage
const TOKEN_KEY = 'token';
const ADMIN_KEY = 'admin';

// Função para fazer login
export const login = async (usuario: string, senha: string): Promise<AuthResponse> => {
  debugLog('Tentando login para usuário:', usuario);
  
  const response = await fetch(config.apiUrls.auth.login, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ usuario, senha })
  });

  const data = await response.json();
  debugLog('Resposta do login:', { status: response.status, data });

  if (!response.ok) {
    throw new Error(data.message || 'Erro na autenticação');
  }

  return data;
};

// Função para verificar se o usuário está logado
export const isAuthenticated = (): boolean => {
  const token = getToken();
  const admin = getAdmin();
  
  // Verifica se tem token E dados do admin
  if (!token || !admin) {
    // Se não tem dados completos, limpa o localStorage
    logout();
    return false;
  }
  
  return true;
};

// Função para obter o token
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Função para obter dados do admin
export const getAdmin = (): Admin | null => {
  const adminStr = localStorage.getItem(ADMIN_KEY);
  if (adminStr) {
    try {
      return JSON.parse(adminStr);
    } catch {
      return null;
    }
  }
  return null;
};

// Função para fazer logout
export const logout = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
};

// Função para verificar token com o servidor
export const verifyToken = async (): Promise<boolean> => {
  const token = getToken();
  if (!token) return false;

  try {
    debugLog('Verificando token...');
    const response = await fetch(config.apiUrls.auth.verify, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    debugLog('Verificação de token:', { status: response.status });
    return response.ok;
  } catch (error) {
    debugLog('Erro na verificação de token:', error);
    return false;
  }
};

// Função para criar um novo admin (registro)
export const registerAdmin = async (usuario: string, senha: string): Promise<void> => {
  debugLog('Registrando novo admin:', usuario);
  
  const response = await fetch(config.apiUrls.auth.register, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ usuario, senha })
  });

  const data = await response.json();
  debugLog('Resposta do registro:', { status: response.status, data });

  if (!response.ok) {
    throw new Error(data.message || 'Erro no registro');
  }
};
