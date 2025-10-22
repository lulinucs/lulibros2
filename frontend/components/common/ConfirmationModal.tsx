import React, { useState } from 'react';
import { config, debugLog } from '../../config/env';
import { getToken } from '../../utils/auth';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  requirePassword?: boolean;
  adminUsername?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  requirePassword = false,
  adminUsername = ''
}) => {
  const [password, setPassword] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleConfirm = async () => {
    if (requirePassword) {
      if (!password.trim()) {
        setPasswordError('Senha é obrigatória');
        return;
      }

      setIsValidating(true);
      setPasswordError('');

      try {
        const token = getToken();
        if (!token) {
          throw new Error('Token de autenticação não encontrado');
        }

        debugLog('Validando senha do admin...');

        const response = await fetch(`${config.apiUrls.auth.validatePassword}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ senha: password })
        });

        const data = await response.json();
        debugLog('Resposta da validação:', data);

        if (response.ok) {
          onConfirm();
          handleClose();
        } else {
          setPasswordError(data.message || 'Senha incorreta');
        }
      } catch (error) {
        console.error('Erro ao validar senha:', error);
        setPasswordError('Erro ao validar senha');
      } finally {
        setIsValidating(false);
      }
    } else {
      onConfirm();
      handleClose();
    }
  };

  const handleClose = () => {
    setPassword('');
    setPasswordError('');
    onClose();
  };

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          borderColor: 'border-red-200'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          borderColor: 'border-blue-200'
        };
      default: // warning
        return {
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
          borderColor: 'border-yellow-200'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                <span className={`text-2xl ${styles.iconColor}`}>{styles.icon}</span>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 whitespace-pre-line">
                    {message}
                  </p>
                </div>

                {requirePassword && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirme sua senha para continuar:
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      placeholder={`Digite a senha do admin ${adminUsername}`}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        passwordError ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isValidating}
                    />
                    {passwordError && (
                      <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className={`bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t ${styles.borderColor}`}>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isValidating || (requirePassword && !password.trim())}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${styles.buttonBg} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isValidating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Validando...
                </>
              ) : (
                confirmText
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isValidating}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
