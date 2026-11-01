import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Auditoria de Segurança de Credenciais e Bundles (Gate 02 - CM-CRIT-003)', () => {
  it('não deve conter define de process.env.API_KEY ou GEMINI_API_KEY no vite.config.ts', () => {
    const viteConfigPath = path.resolve(__dirname, '../vite.config.ts');
    const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8');

    // Assegura que o define público de chaves foi eliminado
    expect(viteConfigContent).not.toMatch(/'process\.env\.API_KEY'\s*:/);
    expect(viteConfigContent).not.toMatch(/'process\.env\.GEMINI_API_KEY'\s*:/);
  });

  it('não deve conter chaves de API Gemini em arquivos estáticos de produção na pasta dist/', () => {
    const distPath = path.resolve(__dirname, '../dist');
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(path.join(distPath, 'assets'));
      const jsFiles = files.filter(f => f.endsWith('.js'));

      jsFiles.forEach(file => {
        const content = fs.readFileSync(path.join(distPath, 'assets', file), 'utf-8');
        // Padrão de chaves da Google API
        expect(content).not.toMatch(/AIzaSy[A-Za-z0-9_-]{33}/);
      });
    }
  });

  it('o arquivo App.tsx não deve importar o SDK @google/genai diretamente no cliente', () => {
    const appPath = path.resolve(__dirname, '../App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    // A chamada à IA foi movida exclusivamente para o backend seguro
    expect(appContent).not.toContain("import { GoogleGenAI } from '@google/genai'");
    expect(appContent).not.toContain("new GoogleGenAI");
  });
});
