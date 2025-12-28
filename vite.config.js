import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'trailing-slash-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Redirect /english-learning to /english-learning/
          if (req.url === '/english-learning') {
            res.writeHead(301, { Location: '/english-learning/' });
            res.end();
            return;
          }
          next();
        });
      }
    }
  ],
  base: '/english-learning/', // GitHub repo name
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
