import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

function localDataEditorPlugin() {
  return {
    name: 'local-data-editor',
    configureServer(server) {
      server.middlewares.use('/api/save-tools', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              fs.writeFileSync(path.resolve('./src/data/tools.json'), JSON.stringify(data, null, 2));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          next();
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/AI_Tools/',
  plugins: [
    tailwindcss(),
    react(),
    localDataEditorPlugin()
  ],
})
