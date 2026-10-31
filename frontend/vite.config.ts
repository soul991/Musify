import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function rewriteAppMiddleware(): Plugin {
  const handleRewrite = (req: any, _res: any, next: () => void) => {
    if (req.url === '/app' || req.url?.startsWith('/app/') || req.url?.startsWith('/app?')) {
      req.url = '/app.html';
    }
    next();
  };

  return {
    name: 'rewrite-app-middleware',
    configureServer(server) {
      server.middlewares.use(handleRewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleRewrite);
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), rewriteAppMiddleware()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'app.html'),
        landing: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('framer-motion')) {
            return 'vendor-framer';
          }
          if (id.includes('react-dom') || id.includes('/react/')) {
            return 'vendor-react';
          }
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true, // Allow network access for testing on local mobile devices
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
