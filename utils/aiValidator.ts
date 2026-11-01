/**
 * CertificaMaster - Módulo de Validação e Integridade de Respostas da IA
 * Gate 02: Validação estrita de variáveis obrigatórias e prevenção de corrupção de templates
 */

// Mapeamento de tags canônicas e aliases aceitos
export const VARIABLE_ALIASES: Record<string, string> = {
  'NOME': 'NOME',
  'CPF': 'CPF',
  'CURSO': 'CURSO',
  'DATA': 'DATA',
  'CARGA_HORARIA': 'CARGA_HORARIA',
  'CARGA HORARIA': 'CARGA_HORARIA',
  'CARGA_HORÁRIA': 'CARGA_HORARIA',
  'CARGA HORÁRIA': 'CARGA_HORARIA',
  'RAZAO_SOCIAL': 'RAZAO_SOCIAL',
  'RAZÃO_SOCIAL': 'RAZAO_SOCIAL',
  'RAZÃO SOCIAL': 'RAZAO_SOCIAL',
  'EMPRESA': 'RAZAO_SOCIAL',
  'CNPJ': 'CNPJ',
  'ENDERECO': 'ENDERECO',
  'ENDEREÇO': 'ENDERECO',
  'INSTRUTORES': 'INSTRUTORES',
  'PROVEDORA_NOME': 'PROVEDORA_NOME',
  'PROVEDORA_CNPJ': 'PROVEDORA_CNPJ',
};

// Variáveis obrigatórias que jamais podem ser omitidas se existiam no texto original
export const MANDATORY_VARIABLES = [
  'NOME',
  'CPF',
  'CURSO',
  'DATA',
  'CARGA_HORARIA',
  'RAZAO_SOCIAL',
  'CNPJ',
  'ENDERECO',
];

/**
 * Normaliza uma chave de variável removendo chaves, espaços e acentos para a forma canônica.
 * Exemplo: "{{CARGA HORÁRIA}}" -> "CARGA_HORARIA"
 */
export const normalizeVariableKey = (raw: string): string => {
  if (!raw) return '';
  const cleaned = raw
    .replace(/^\{\{|\}\}$/g, '')
    .trim()
    .toUpperCase();
  return VARIABLE_ALIASES[cleaned] || cleaned;
};

/**
 * Extrai todas as variáveis no formato {{VARIAVEL}} presentes em uma string de texto.
 */
export const extractVariables = (text: string): string[] => {
  if (!text) return [];
  const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
  return Array.from(new Set(matches.map(m => normalizeVariableKey(m))));
};

export interface AIValidationResult {
  valid: boolean;
  error?: string;
  missingVariables?: string[];
  unknownVariables?: string[];
  sanitizedText?: string;
}

/**
 * Validação rigorosa do texto gerado ou modificado por Inteligência Artificial.
 * Regras:
 * 1. O texto não pode ser vazio ou conter apenas espaços em branco.
 * 2. Todas as variáveis originais obrigatórias devem permanecer no texto retornado.
 * 3. Variáveis desconhecidas ou inventadas pela IA são rejeitadas.
 * 4. O texto não pode conter elementos executáveis de script ou tags HTML maliciosas.
 */
export const validateAITextResponse = (originalText: string, aiText: string): AIValidationResult => {
  if (!aiText || typeof aiText !== 'string' || aiText.trim() === '') {
    return {
      valid: false,
      error: 'A resposta da IA veio vazia ou em formato inválido.',
    };
  }

  // Detecta se a IA injetou tags HTML de script ou executáveis
  if (/<(script|iframe|object|embed|svg|img)[^>]*>/i.test(aiText)) {
    return {
      valid: false,
      error: 'A resposta da IA contém código HTML não permitido ou potencialmente malicioso.',
    };
  }

  const originalVars = extractVariables(originalText);
  const aiVars = extractVariables(aiText);

  // 1. Verifica se alguma variável que estava no original foi omitida
  const missing: string[] = [];
  originalVars.forEach(origVar => {
    if (!aiVars.includes(origVar)) {
      missing.push(`{{${origVar}}}`);
    }
  });

  if (missing.length > 0) {
    return {
      valid: false,
      error: `A IA omitiu variáveis essenciais do certificado: ${missing.join(', ')}. O texto original foi preservado.`,
      missingVariables: missing,
    };
  }

  // 2. Verifica se a IA inventou variáveis desconhecidas não suportadas pelo sistema
  const knownKeys = new Set(Object.values(VARIABLE_ALIASES));
  const unknown: string[] = [];
  aiVars.forEach(aiVar => {
    if (!knownKeys.has(aiVar)) {
      unknown.push(`{{${aiVar}}}`);
    }
  });

  if (unknown.length > 0) {
    return {
      valid: false,
      error: `A IA introduziu variáveis desconhecidas pelo sistema: ${unknown.join(', ')}. O texto original foi preservado.`,
      unknownVariables: unknown,
    };
  }

  return {
    valid: true,
    sanitizedText: aiText.trim(),
  };
};
