/**
 * CertificaMaster - Roteador Unificado de IA (Unified AI Gateway)
 * Suporte a múltiplos provedores com Fallback em Cascata:
 * 1. Google Gemini Flash (Vision)
 * 2. Groq Cloud (Llama 3.2 Vision)
 * 3. OpenRouter (Modelos Visuais Gratuitos)
 * 
 * Armazenamento 100% seguro no localStorage do operador.
 */

import { AISettings, AIProviderId, AIExtractionResult, ExtractedStudentCandidate } from '../types';
import { formatCPF, cleanCPF, validateCPF } from '../utils/security';

const STORAGE_KEY = 'certificamaster_ai_settings';

export const DEFAULT_AI_SETTINGS: AISettings = {
  geminiApiKey: '',
  groqApiKey: '',
  openrouterApiKey: '',
  preferredProvider: 'auto',
};

// Cache em memória para resiliência contínua na sessão caso haja restrição de storage
let memoryCache: AISettings | null = null;

export function loadAISettings(): AISettings {
  try {
    let raw: string | null = null;
    if (typeof localStorage !== 'undefined') {
      try {
        raw = localStorage.getItem(STORAGE_KEY);
      } catch {
        // Fallback se localStorage for restrito pelo navegador
      }
    }
    if (!raw && typeof sessionStorage !== 'undefined') {
      try {
        raw = sessionStorage.getItem(STORAGE_KEY);
      } catch {
        // Fallback
      }
    }
    if (!raw && memoryCache) {
      return { ...memoryCache };
    }
    if (!raw) return { ...DEFAULT_AI_SETTINGS };
    const parsed = JSON.parse(raw);
    const loaded: AISettings = {
      geminiApiKey: parsed.geminiApiKey || '',
      groqApiKey: parsed.groqApiKey || '',
      openrouterApiKey: parsed.openrouterApiKey || '',
      preferredProvider: parsed.preferredProvider || 'auto',
    };
    memoryCache = loaded;
    return loaded;
  } catch {
    return memoryCache ? { ...memoryCache } : { ...DEFAULT_AI_SETTINGS };
  }
}

export function saveAISettings(settings: AISettings): void {
  try {
    memoryCache = { ...settings };
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (err) {
        console.warn('Falha ao gravar no localStorage:', err);
      }
    }
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (err) {
        console.warn('Falha ao gravar no sessionStorage:', err);
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('certificamaster_ai_settings_changed', { detail: settings })
      );
    }
  } catch (err) {
    console.error('Erro ao salvar configurações de IA:', err);
  }
}

export function clearAISettings(): void {
  try {
    memoryCache = { ...DEFAULT_AI_SETTINGS };
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('certificamaster_ai_settings_changed', { detail: DEFAULT_AI_SETTINGS })
      );
    }
  } catch {}
}

const VISION_SYSTEM_PROMPT = `Você é um assistente especialista em OCR e extração estruturada de participantes para emissão de certificados acadêmicos e profissionais.
Você analisará a imagem fornecida (que pode ser um print de WhatsApp, foto de lista impressa, ficha ou documento).

Sua tarefa é extrair exclusivamente os nomes completos dos alunos/participantes e seus respectivos CPFs.
Instruções obrigatórias:
1. Ignore saudações (ex: "olá", "bom dia"), horários de mensagens ("14:20"), nomes de remetentes no topo da conversa, balões e rodapés.
2. Identifique nomes e CPFs mesmo que estejam em formatos variados (ex: "Carlos da Silva - 12345678900", "Maria Souza CPF: 987.654.321-11").
3. Retorne estritamente um objeto JSON com a propriedade "students" contendo um array de participantes.
Formato exato esperado:
{
  "students": [
    { "name": "Nome Completo do Aluno", "cpf": "000.000.000-00" }
  ]
}
Não inclua nenhuma explicação antes ou depois do JSON.`;

/**
 * Extrai e normaliza o array de alunos a partir de uma string de resposta de IA (mesmo com markdown).
 */
export function parseStudentsFromJson(text: string): ExtractedStudentCandidate[] {
  if (!text) return [];

  // Remove blocos de código markdown ```json ... ``` se presentes
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  }

  let candidates: any[] = [];

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      candidates = parsed;
    } else if (parsed && Array.isArray(parsed.students)) {
      candidates = parsed.students;
    } else if (parsed && Array.isArray(parsed.alunos)) {
      candidates = parsed.alunos;
    } else if (parsed && Array.isArray(parsed.participantes)) {
      candidates = parsed.participantes;
    }
  } catch {
    // Fallback: tentar localizar o primeiro array [ ... ] no texto
    const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      try {
        candidates = JSON.parse(arrayMatch[0]);
      } catch {
        candidates = [];
      }
    }
  }

  return candidates
    .filter((c) => c && typeof c.name === 'string' && c.name.trim().length > 0)
    .map((c) => {
      const rawCpf = String(c.cpf || '').trim();
      const cleanedDigits = cleanCPF(rawCpf);
      const isClean11 = cleanedDigits.length === 11;
      const formatted = isClean11 ? formatCPF(cleanedDigits) : rawCpf;

      return {
        name: String(c.name).trim(),
        cpf: formatted,
        confidence: isClean11 && validateCPF(cleanedDigits) ? 'high' : 'medium',
      };
    });
}

/**
 * Lista de modelos Gemini suportados em ordem de preferência.
 * Garante que contas antigas e novas funcionem sem erro 404 de modelo.
 */
export const GEMINI_CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-2.5-pro',
];

/**
 * 1. Provedor Google Gemini Flash
 */
export async function callGeminiVision(
  apiKey: string,
  base64Data: string,
  mimeType: string = 'image/png'
): Promise<AIExtractionResult> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, students: [], error: 'Chave do Google Gemini não configurada.' };
  }

  const cleanKey = apiKey.trim();
  const payload = {
    contents: [
      {
        parts: [
          { text: VISION_SYSTEM_PROMPT },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  let lastError: Error | null = null;

  for (const model of GEMINI_CANDIDATE_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': cleanKey,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 404) {
        console.warn(`[Gemini] Modelo ${model} retornou 404. Tentando próximo modelo...`);
        lastError = new Error(`Modelo ${model} indisponível (404).`);
        continue;
      }

      if (response.status === 429) {
        throw new Error('Limite de requisições do Gemini atingido (429 Rate Limit).');
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Falha no Google Gemini (${response.status}): ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const students = parseStudentsFromJson(textContent);

      return {
        success: true,
        students,
        providerUsed: 'gemini',
        modelUsed: model,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('429 Rate Limit')) {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Nenhum modelo Gemini compatível pôde ser acessado.');
}

/**
 * 2. Provedor Groq Cloud (Llama 3.2 Vision)
 */
export async function callGroqVision(
  apiKey: string,
  base64Data: string,
  mimeType: string = 'image/png'
): Promise<AIExtractionResult> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, students: [], error: 'Chave do Groq Cloud não configurada.' };
  }

  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  const payload = {
    model: 'llama-3.2-11b-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: VISION_SYSTEM_PROMPT },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Data}`,
            },
          },
        ],
      },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    if (response.status === 429) {
      throw new Error('Limite de requisições do Groq atingido (429 Rate Limit).');
    }
    throw new Error(`Falha no Groq (${response.status}): ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();
  const textContent = data.choices?.[0]?.message?.content || '';
  const students = parseStudentsFromJson(textContent);

  return {
    success: true,
    students,
    providerUsed: 'groq',
    modelUsed: 'llama-3.2-11b-vision-preview',
  };
}

/**
 * 3. Provedor OpenRouter
 */
export async function callOpenRouterVision(
  apiKey: string,
  base64Data: string,
  mimeType: string = 'image/png'
): Promise<AIExtractionResult> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, students: [], error: 'Chave do OpenRouter não configurada.' };
  }

  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

  const payload = {
    model: 'qwen/qwen-2.5-vl-72b-instruct:free',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: VISION_SYSTEM_PROMPT },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Data}`,
            },
          },
        ],
      },
    ],
    temperature: 0.1,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://certificamaster.local',
      'X-Title': 'CertificaMaster',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    if (response.status === 429) {
      throw new Error('Limite de requisições do OpenRouter atingido (429 Rate Limit).');
    }
    throw new Error(`Falha no OpenRouter (${response.status}): ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();
  const textContent = data.choices?.[0]?.message?.content || '';
  const students = parseStudentsFromJson(textContent);

  return {
    success: true,
    students,
    providerUsed: 'openrouter',
    modelUsed: 'qwen-2.5-vl-72b-instruct:free',
  };
}

/**
 * Orquestrador Unificado com Cascata de Fallback Inteligente
 */
export async function extractStudentsFromImage(
  base64Data: string,
  mimeType: string = 'image/png',
  customSettings?: AISettings
): Promise<AIExtractionResult> {
  const settings = customSettings || loadAISettings();

  // Define a fila de provedores em ordem de prioridade
  const queue: AIProviderId[] = [];
  if (settings.preferredProvider === 'gemini') {
    queue.push('gemini', 'groq', 'openrouter');
  } else if (settings.preferredProvider === 'groq') {
    queue.push('groq', 'gemini', 'openrouter');
  } else if (settings.preferredProvider === 'openrouter') {
    queue.push('openrouter', 'gemini', 'groq');
  } else {
    // 'auto': Gemini -> Groq -> OpenRouter
    queue.push('gemini', 'groq', 'openrouter');
  }

  // Filtra apenas os provedores com chave configurada
  const availableProviders = queue.filter((p) => {
    if (p === 'gemini') return !!settings.geminiApiKey?.trim();
    if (p === 'groq') return !!settings.groqApiKey?.trim();
    if (p === 'openrouter') return !!settings.openrouterApiKey?.trim();
    return false;
  });

  if (availableProviders.length === 0) {
    return {
      success: false,
      students: [],
      error: 'NO_KEY_CONFIGURED',
      message: 'Nenhuma chave de IA configurada. Clique no botão de Configurações de IA para adicionar uma chave gratuita do Google Gemini, Groq ou OpenRouter.',
    };
  }

  const errors: string[] = [];

  for (const provider of availableProviders) {
    try {
      if (provider === 'gemini') {
        const res = await callGeminiVision(settings.geminiApiKey, base64Data, mimeType);
        if (res.success && res.students.length > 0) return res;
        errors.push('Gemini não identificou nomes no documento.');
      } else if (provider === 'groq') {
        const res = await callGroqVision(settings.groqApiKey, base64Data, mimeType);
        if (res.success && res.students.length > 0) return res;
        errors.push('Groq não identificou nomes no documento.');
      } else if (provider === 'openrouter') {
        const res = await callOpenRouterVision(settings.openrouterApiKey, base64Data, mimeType);
        if (res.success && res.students.length > 0) return res;
        errors.push('OpenRouter não identificou nomes no documento.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI Fallback] Falha no provedor ${provider}: ${msg}. Tentando próximo provedor...`);
      errors.push(`${provider}: ${msg}`);
    }
  }

  return {
    success: false,
    students: [],
    error: 'ALL_PROVIDERS_FAILED',
    message: `Não foi possível extrair os alunos. Detalhes: ${errors.join(' | ')}`,
  };
}

/**
 * Testa a conexão de um provedor específico para validação rápida na interface
 */
export async function testProviderConnection(provider: AIProviderId, apiKey: string): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'Chave não informada.' };
  }

  const cleanKey = apiKey.trim();

  try {
    if (provider === 'gemini') {
      // Validação oficial pela API de modelos do Google (não consome cota de geração e é compatível com qualquer modelo)
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
      const res = await fetch(endpoint, {
        headers: {
          'x-goog-api-key': cleanKey,
        },
      });

      if (res.ok) {
        return { success: true, message: 'Google Gemini conectado com sucesso!' };
      }

      const errJson = await res.json().catch(() => null);
      const errorMsg = errJson?.error?.message || `Erro Gemini (${res.status})`;
      return { success: false, message: `${errorMsg}` };
    }

    if (provider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${cleanKey}` },
      });
      if (res.ok) return { success: true, message: 'Groq Cloud conectado com sucesso!' };
      const errJson = await res.json().catch(() => null);
      const errorMsg = errJson?.error?.message || `Erro Groq (${res.status})`;
      return { success: false, message: `${errorMsg}` };
    }

    if (provider === 'openrouter') {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${cleanKey}` },
      });
      if (res.ok) return { success: true, message: 'OpenRouter conectado com sucesso!' };
      const errJson = await res.json().catch(() => null);
      const errorMsg = errJson?.error?.message || `Erro OpenRouter (${res.status})`;
      return { success: false, message: `${errorMsg}` };
    }

    return { success: false, message: 'Provedor desconhecido.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Falha de rede ou timeout: ${msg}` };
  }
}

/**
 * Prompt de sistema para redação formal e preservação estrita de variáveis
 */
export const TEXT_ENHANCE_SYSTEM_PROMPT = `Você é um redator jurídico e pedagógico especialista em redação de certificados e diplomas oficiais no Brasil.
Sua missão é aprimorar a redação do texto base de certificado fornecido pelo usuário, tornando-o formal, polido, elegante e gramaticalmente impecável.

REGRAS ESTRITAS E INEGOCIÁVEIS:
1. Preserve RIGOROSAMENTE todas as tags dinâmicas existentes no texto original (como {{NOME}}, {{CPF}}, {{CURSO}}, {{DATA}}, {{CARGA_HORARIA}}, {{RAZAO_SOCIAL}}, {{CNPJ}}, {{ENDERECO}}).
2. NUNCA altere os nomes das tags, nem remova nenhuma delas, nem invente tags novas.
3. Não inclua saudações, cabeçalhos, introduções ("Aqui está o texto:"), notas de rodapé ou explicações.
4. Retorne EXCLUSIVAMENTE o texto final do certificado pronto para emissão, sem aspas extras.`;

/**
 * Remove markdown, quebras excessivas e aspas envolventes de respostas de texto da IA
 */
export function cleanAIGeneratedText(content: string): string {
  if (!content) return '';
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  }
  if (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length >= 2) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  return cleaned;
}

export async function callGeminiTextEnhance(apiKey: string, text: string): Promise<string> {
  const cleanKey = apiKey.trim();
  const payload = {
    contents: [
      {
        parts: [
          { text: `${TEXT_ENHANCE_SYSTEM_PROMPT}\n\nTexto original para aprimorar:\n${text}` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
    },
  };

  let lastError: Error | null = null;
  for (const model of GEMINI_CANDIDATE_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': cleanKey,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 404) {
        continue;
      }
      if (response.status === 429) {
        throw new Error('Limite de requisições do Gemini atingido (429 Rate Limit).');
      }
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Falha no Gemini (${response.status}): ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return cleanAIGeneratedText(content);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('429 Rate Limit')) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Nenhum modelo Gemini compatível pôde gerar o texto.');
}

export async function callGroqTextEnhance(apiKey: string, text: string): Promise<string> {
  const cleanKey = apiKey.trim();
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

  let lastError: Error | null = null;
  for (const model of models) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: TEXT_ENHANCE_SYSTEM_PROMPT },
            { role: 'user', content: `Texto original:\n${text}` },
          ],
          temperature: 0.2,
        }),
      });

      if (response.status === 429) {
        throw new Error('Limite de requisições do Groq atingido (429 Rate Limit).');
      }
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Falha no Groq (${response.status}): ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      return cleanAIGeneratedText(content);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('429 Rate Limit')) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Nenhum modelo Groq compatível pôde gerar o texto.');
}

export async function callOpenRouterTextEnhance(apiKey: string, text: string): Promise<string> {
  const cleanKey = apiKey.trim();
  const models = ['meta-llama/llama-3.3-70b-instruct:free', 'google/gemini-2.0-flash-lite-preview:free', 'qwen/qwen-2.5-72b-instruct:free'];

  let lastError: Error | null = null;
  for (const model of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://certificamaster.local',
          'X-Title': 'CertificaMaster',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: TEXT_ENHANCE_SYSTEM_PROMPT },
            { role: 'user', content: `Texto original:\n${text}` },
          ],
          temperature: 0.2,
        }),
      });

      if (response.status === 429) {
        throw new Error('Limite de requisições do OpenRouter atingido (429 Rate Limit).');
      }
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Falha no OpenRouter (${response.status}): ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      return cleanAIGeneratedText(content);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('429 Rate Limit')) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Nenhum modelo OpenRouter compatível pôde gerar o texto.');
}

/**
 * Aprimora o texto do certificado utilizando a Central de IA com fallback em cascata
 */
export async function enhanceCertificateText(
  text: string,
  customSettings?: AISettings
): Promise<{ success: boolean; enhancedText?: string; error?: string; message?: string; providerUsed?: string }> {
  if (!text || text.trim() === '') {
    return {
      success: false,
      error: 'EMPTY_TEXT',
      message: 'O texto base do certificado não pode estar vazio.',
    };
  }

  if (text.length > 2500) {
    return {
      success: false,
      error: 'PAYLOAD_TOO_LARGE',
      message: 'O texto base excede o limite máximo permitido de 2.500 caracteres.',
    };
  }

  const settings = customSettings || loadAISettings();

  const queue: AIProviderId[] = [];
  if (settings.preferredProvider === 'gemini') {
    queue.push('gemini', 'groq', 'openrouter');
  } else if (settings.preferredProvider === 'groq') {
    queue.push('groq', 'gemini', 'openrouter');
  } else if (settings.preferredProvider === 'openrouter') {
    queue.push('openrouter', 'gemini', 'groq');
  } else {
    queue.push('gemini', 'groq', 'openrouter');
  }

  const availableProviders = queue.filter((p) => {
    if (p === 'gemini') return !!settings.geminiApiKey?.trim();
    if (p === 'groq') return !!settings.groqApiKey?.trim();
    if (p === 'openrouter') return !!settings.openrouterApiKey?.trim();
    return false;
  });

  if (availableProviders.length === 0) {
    return {
      success: false,
      error: 'NO_KEY_CONFIGURED',
      message: 'Nenhuma chave de IA configurada. Clique no ícone do microchip na barra superior para adicionar uma chave gratuita do Google Gemini, Groq ou OpenRouter.',
    };
  }

  const errors: string[] = [];

  for (const provider of availableProviders) {
    try {
      let candidateText = '';
      if (provider === 'gemini') {
        candidateText = await callGeminiTextEnhance(settings.geminiApiKey, text);
      } else if (provider === 'groq') {
        candidateText = await callGroqTextEnhance(settings.groqApiKey, text);
      } else if (provider === 'openrouter') {
        candidateText = await callOpenRouterTextEnhance(settings.openrouterApiKey, text);
      }

      if (candidateText && candidateText.trim().length > 0) {
        return {
          success: true,
          enhancedText: candidateText.trim(),
          providerUsed: provider,
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI Text Fallback] Falha no provedor ${provider}: ${msg}. Tentando próximo provedor...`);
      errors.push(`${provider}: ${msg}`);
    }
  }

  return {
    success: false,
    error: 'ALL_PROVIDERS_FAILED',
    message: `Falha ao aprimorar texto com IA: ${errors.join(' | ')}`,
  };
}
