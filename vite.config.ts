import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { GoogleGenAI } from '@google/genai';

function aiServerPlugin(apiKey: string): Plugin {
  return {
    name: 'certificamaster-ai-server-middleware',
    configureServer(server) {
      server.middlewares.use('/api/ai/enhance-text', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'METHOD_NOT_ALLOWED' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
          if (body.length > 20000) {
            req.destroy();
          }
        });

        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');

          if (!apiKey || apiKey.trim() === '') {
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: false,
              error: 'AI_SERVICE_UNCONFIGURED',
              message: 'A chave da API Gemini não está configurada no ambiente do servidor.'
            }));
            return;
          }

          try {
            const parsed = JSON.parse(body);
            const text = parsed.text;

            if (!text || typeof text !== 'string') {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'INVALID_PAYLOAD' }));
              return;
            }

            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Reescreva o seguinte texto de certificado para ser mais formal e elegante em português. Mantenha obrigatoriamente as variáveis {{NOME}}, {{CPF}}, {{CURSO}}, {{DATA}}, {{CARGA_HORARIA}}, {{CNPJ}}, {{ENDERECO}} e {{RAZAO_SOCIAL}}. Texto atual: ${text}`,
            });

            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              enhancedText: response.text || text
            }));
          } catch (err) {
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: false,
              error: 'AI_PROCESSING_ERROR',
              message: 'Erro durante o processamento da resposta pelo modelo de IA.'
            }));
          }
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

    return {
      server: {
        port: 5173,
        strictPort: false,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        aiServerPlugin(geminiKey)
      ],
      // Nenhuma chave privada é exposta no define do bundle client
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
                return 'vendor-pdf';
              }
              if (id.includes('node_modules/@google/genai')) {
                return 'vendor-ai';
              }
              if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
                return 'vendor-react';
              }
            }
          }
        }
      }
    };
});
