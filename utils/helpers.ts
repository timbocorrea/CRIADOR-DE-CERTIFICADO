import { CertificateData, Student } from '../types';
import { formatCPF, escapeHtml, validateCPF, cleanCPF, isDuplicateCPF } from './security';
import { normalizeVariableKey } from './aiValidator';
import { resolveVariableValues, renderSafeCertificateText } from './textRenderer';

export { formatCPF, validateCPF, cleanCPF, isDuplicateCPF, escapeHtml };
export { renderSafeCertificateText, resolveVariableValues };

/**
 * Interpolação segura de variáveis para saídas em formato string.
 * Todos os valores dinâmicos passam por escapeHtml antes de serem envoltos em <strong>.
 */
export const replaceVariables = (text: string, data: CertificateData, student: Student | null): string => {
  if (!text) return '';

  const resolvedMap = resolveVariableValues(data, student);
  const tokens = text.split(/(\{\{[^{}]+\}\})/g);

  return tokens
    .map(token => {
      if (/^\{\{[^{}]+\}\}$/.test(token)) {
        const canonical = normalizeVariableKey(token);
        if (Object.prototype.hasOwnProperty.call(resolvedMap, canonical)) {
          const rawValue = resolvedMap[canonical];
          const escaped = escapeHtml(rawValue);
          const isBold = data.boldVariables.some(bv => normalizeVariableKey(bv) === canonical);
          return isBold ? `<strong>${escaped}</strong>` : escaped;
        }
        return escapeHtml(token);
      }
      return escapeHtml(token);
    })
    .join('');
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Geração de identificadores únicos criptograficamente seguros (CM-BAIXO-003).
 * Utiliza crypto.randomUUID() com fallback seguro.
 */
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback seguro baseado em crypto.getRandomValues ou timestamp pseudo-aleatório
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  return 'id-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
};
