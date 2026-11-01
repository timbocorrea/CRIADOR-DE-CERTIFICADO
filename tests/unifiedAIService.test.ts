import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  parseStudentsFromJson,
  loadAISettings,
  saveAISettings,
  clearAISettings,
  extractStudentsFromImage,
  DEFAULT_AI_SETTINGS,
} from '../services/unifiedAIService';
import { AISettings } from '../types';

class MockStorage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] ?? null; }
  key(index: number) { return Object.keys(this.store)[index] ?? null; }
  removeItem(key: string) { delete this.store[key]; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
}

if (!(globalThis as any).localStorage) {
  (globalThis as any).localStorage = new MockStorage();
}

describe('Unified AI Service & Fallback Gateway', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('parseStudentsFromJson', () => {
    it('deve extrair array de alunos de JSON puro', () => {
      const json = JSON.stringify({
        students: [
          { name: 'João Silva', cpf: '12345678909' },
          { name: 'Maria Souza', cpf: '987.654.321-98' },
        ],
      });
      const result = parseStudentsFromJson(json);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('João Silva');
      expect(result[0].cpf).toBe('123.456.789-09');
      expect(result[1].name).toBe('Maria Souza');
    });

    it('deve limpar delimitadores markdown de código ```json ... ```', () => {
      const markdown = "```json\n{\n  \"students\": [\n    { \"name\": \"Carlos Pereira\", \"cpf\": \"111.444.777-35\" }\n  ]\n}\n```";
      const result = parseStudentsFromJson(markdown);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Carlos Pereira');
      expect(result[0].cpf).toBe('111.444.777-35');
    });

    it('deve reconhecer chaves alternativas como "alunos" ou array na raiz', () => {
      const directArray = JSON.stringify([
        { name: 'Ana Beatriz', cpf: '555.666.777-88' },
      ]);
      const result = parseStudentsFromJson(directArray);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Ana Beatriz');
    });

    it('deve ignorar entradas sem nome ou com nome vazio', () => {
      const corrupted = JSON.stringify({
        students: [
          { name: '', cpf: '12345678909' },
          { name: '   ', cpf: '99999999999' },
          { name: 'Aluno Válido', cpf: '123.456.789-09' },
        ],
      });
      const result = parseStudentsFromJson(corrupted);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Aluno Válido');
    });

    it('deve retornar array vazio para texto inválido ou vazio', () => {
      expect(parseStudentsFromJson('')).toEqual([]);
      expect(parseStudentsFromJson('Não encontrei nenhum participante.')).toEqual([]);
    });
  });

  describe('Gerenciamento de Configurações (localStorage)', () => {
    it('deve retornar padrões seguros quando o localStorage estiver vazio', () => {
      const settings = loadAISettings();
      expect(settings).toEqual(DEFAULT_AI_SETTINGS);
      expect(settings.preferredProvider).toBe('auto');
    });

    it('deve persistir e carregar chaves salvas', () => {
      const newSettings: AISettings = {
        geminiApiKey: 'AIzaSyTest123',
        groqApiKey: 'gsk_test456',
        openrouterApiKey: 'sk-or-v1-789',
        preferredProvider: 'groq',
      };
      saveAISettings(newSettings);

      const loaded = loadAISettings();
      expect(loaded.geminiApiKey).toBe('AIzaSyTest123');
      expect(loaded.groqApiKey).toBe('gsk_test456');
      expect(loaded.openrouterApiKey).toBe('sk-or-v1-789');
      expect(loaded.preferredProvider).toBe('groq');
    });

    it('clearAISettings deve remover todas as chaves e restaurar padrões', () => {
      const testSettings: AISettings = {
        geminiApiKey: 'AIzaSyKeyParaLimpar',
        groqApiKey: 'gsk_limpar',
        openrouterApiKey: 'sk-limpar',
        preferredProvider: 'gemini',
      };
      saveAISettings(testSettings);
      expect(loadAISettings().geminiApiKey).toBe('AIzaSyKeyParaLimpar');

      clearAISettings();
      const reset = loadAISettings();
      expect(reset.geminiApiKey).toBe('');
      expect(reset.groqApiKey).toBe('');
      expect(reset.openrouterApiKey).toBe('');
      expect(reset.preferredProvider).toBe('auto');
    });
  });

  describe('Orquestrador Multi-Provedor extractStudentsFromImage', () => {
    it('deve retornar erro claro se nenhuma chave estiver configurada', async () => {
      const result = await extractStudentsFromImage('base64fakestring', 'image/png', {
        geminiApiKey: '',
        groqApiKey: '',
        openrouterApiKey: '',
        preferredProvider: 'auto',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('NO_KEY_CONFIGURED');
      expect(result.students).toEqual([]);
    });

    it('deve acionar Gemini e retornar participantes com sucesso', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      students: [{ name: 'Participante Gemini', cpf: '123.456.789-09' }],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      });
      global.fetch = mockFetch;

      const result = await extractStudentsFromImage('base64img', 'image/png', {
        geminiApiKey: 'gemini-key',
        groqApiKey: '',
        openrouterApiKey: '',
        preferredProvider: 'gemini',
      });

      expect(result.success).toBe(true);
      expect(result.providerUsed).toBe('gemini');
      expect(result.students).toHaveLength(1);
      expect(result.students[0].name).toBe('Participante Gemini');
    });

    it('deve realizar fallback para Groq quando Gemini falhar (ex: 429)', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => 'Rate limit exceeded',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    students: [{ name: 'Aluno Resgatado pelo Groq', cpf: '987.654.321-98' }],
                  }),
                },
              },
            ],
          }),
        });
      global.fetch = mockFetch;

      const result = await extractStudentsFromImage('base64img', 'image/png', {
        geminiApiKey: 'gemini-key',
        groqApiKey: 'groq-key',
        openrouterApiKey: '',
        preferredProvider: 'auto',
      });

      expect(result.success).toBe(true);
      expect(result.providerUsed).toBe('groq');
      expect(result.students[0].name).toBe('Aluno Resgatado pelo Groq');
    });

    it('deve tentar o próximo modelo Gemini se o primeiro retornar 404', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Model not found',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        students: [{ name: 'Aluno Gemini Fallback Model', cpf: '529.982.247-25' }],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        });
      global.fetch = mockFetch;

      const result = await extractStudentsFromImage('base64img', 'image/png', {
        geminiApiKey: 'gemini-key',
        groqApiKey: '',
        openrouterApiKey: '',
        preferredProvider: 'gemini',
      });

      expect(result.success).toBe(true);
      expect(result.providerUsed).toBe('gemini');
      expect(result.students[0].name).toBe('Aluno Gemini Fallback Model');
    });
  });

  describe('testProviderConnection', () => {
    it('deve validar conexão do Gemini com sucesso usando o endpoint de modelos', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ models: [{ name: 'models/gemini-2.0-flash' }] }),
      });
      global.fetch = mockFetch;

      const res = await (await import('../services/unifiedAIService')).testProviderConnection('gemini', 'valid-key');
      expect(res.success).toBe(true);
      expect(res.message).toContain('conectado com sucesso');
    });

    it('deve reportar mensagem descritiva quando a chave for inválida', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: 400,
            message: 'API key not valid. Please pass a valid API key.',
          },
        }),
      });
      global.fetch = mockFetch;

      const res = await (await import('../services/unifiedAIService')).testProviderConnection('gemini', 'bad-key');
      expect(res.success).toBe(false);
      expect(res.message).toContain('API key not valid');
    });
  });

  describe('enhanceCertificateText (Polimento de Texto)', () => {
    it('deve rejeitar texto vazio', async () => {
      const { enhanceCertificateText } = await import('../services/unifiedAIService');
      const res = await enhanceCertificateText('');
      expect(res.success).toBe(false);
      expect(res.error).toBe('EMPTY_TEXT');
    });

    it('deve rejeitar solicitação quando nenhuma chave estiver configurada', async () => {
      const { enhanceCertificateText } = await import('../services/unifiedAIService');
      const res = await enhanceCertificateText('Certificamos que {{NOME}}...', {
        geminiApiKey: '',
        groqApiKey: '',
        openrouterApiKey: '',
        preferredProvider: 'auto',
      });
      expect(res.success).toBe(false);
      expect(res.error).toBe('NO_KEY_CONFIGURED');
    });

    it('deve aprimorar texto com Gemini preservando variáveis dinâmicas', async () => {
      const { enhanceCertificateText } = await import('../services/unifiedAIService');
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Certificamos com honras que {{NOME}}, inscrito no CPF {{CPF}}, concluiu com louvor o curso de {{CURSO}}.',
                  },
                ],
              },
            },
          ],
        }),
      });
      global.fetch = mockFetch;

      const res = await enhanceCertificateText('Certificamos que {{NOME}}, CPF {{CPF}}, concluiu {{CURSO}}.', {
        geminiApiKey: 'valid-gemini-key',
        groqApiKey: '',
        openrouterApiKey: '',
        preferredProvider: 'gemini',
      });

      expect(res.success).toBe(true);
      expect(res.providerUsed).toBe('gemini');
      expect(res.enhancedText).toContain('{{NOME}}');
      expect(res.enhancedText).toContain('{{CPF}}');
      expect(res.enhancedText).toContain('{{CURSO}}');
    });

    it('deve realizar fallback para Groq quando Gemini falhar', async () => {
      const { enhanceCertificateText } = await import('../services/unifiedAIService');
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => 'Rate limit',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: 'Texto polido pelo Groq para {{NOME}} no curso {{CURSO}}.',
                },
              },
            ],
          }),
        });
      global.fetch = mockFetch;

      const res = await enhanceCertificateText('Certificamos {{NOME}} no {{CURSO}}.', {
        geminiApiKey: 'bad-gemini-key',
        groqApiKey: 'valid-groq-key',
        openrouterApiKey: '',
        preferredProvider: 'auto',
      });

      expect(res.success).toBe(true);
      expect(res.providerUsed).toBe('groq');
      expect(res.enhancedText).toContain('{{NOME}}');
    });
  });
});
