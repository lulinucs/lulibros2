import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Variáveis de ambiente para a API
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
        'import.meta.env.VITE_API_TIMEOUT': JSON.stringify(env.VITE_API_TIMEOUT),
        'import.meta.env.VITE_APP_ENV': JSON.stringify(env.VITE_APP_ENV),
        'import.meta.env.VITE_APP_NAME': JSON.stringify(env.VITE_APP_NAME),
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION),
        'import.meta.env.VITE_DEBUG': JSON.stringify(env.VITE_DEBUG)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
