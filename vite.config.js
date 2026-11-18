import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { tmdbRequest } from './api/tmdb.js';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), {
      name: 'local-tmdb-api',
      configureServer(server) {
        server.middlewares.use('/api/tmdb', async (req, res) => {
          const result = await tmdbRequest(new URL(req.url, 'http://localhost'), env.TMDB_API_KEY);
          res.statusCode = result.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result.body));
        });
      },
    }],
  };
});
