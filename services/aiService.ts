/**
 * CertificaMaster - Serviço de Inteligência Artificial para Polimento Textual
 * Integração direta com a Central Unificada de IA (Gemini, Groq, OpenRouter)
 * com Fallback Automático e Preservação de Variáveis Dinâmicas.
 */

import { enhanceCertificateText } from './unifiedAIService';

export interface EnhanceTextRequest {
  text: string;
}

export interface EnhanceTextResult {
  success: boolean;
  enhancedText?: string;
  error?: string;
  message?: string;
  providerUsed?: string;
}

/**
 * Solicita o aprimoramento e polimento formal do texto base do certificado.
 * Utiliza as chaves configuradas na Central de IA com fallback em cascata.
 */
export const requestAIEnhanceText = async (text: string): Promise<EnhanceTextResult> => {
  return enhanceCertificateText(text);
};
