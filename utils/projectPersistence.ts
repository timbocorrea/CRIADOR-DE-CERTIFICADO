import { CertificateData } from '../types';

export const CONFIG_STORAGE_KEY = 'certificamaster_non_sensitive_v1';
export const CURRENT_SCHEMA_VERSION = 1;

export const getStorage = (): Storage | null => {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return null;
};

export const getCrypto = (): Crypto => {
  if (typeof window !== 'undefined' && window.crypto) return window.crypto;
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto) return (globalThis as any).crypto;
  throw new Error('Web Crypto API não disponível no ambiente.');
};

/**
 * Interface estrita das configurações não sensíveis salvas automaticamente.
 * Nomes de alunos, CPFs, assinaturas e selos NÃO constam nesta estrutura.
 */
export interface NonSensitiveConfig {
  schemaVersion: number;
  savedAt: string;
  courseName: string;
  courseDate: string;
  totalHours: string;
  workloadMode?: 'auto' | 'manual';
  companyName: string;
  companyCnpj: string;
  address: string;
  providerName: string;
  providerCnpj: string;
  techResponsibleName: string;
  techResponsibleCompetencies: string;
  showTechResponsible: boolean;
  baseText: string;
  showHoursColumn: boolean;
  versoSplitRatio: number;
  hoursColumnWidth: number;
  versoRowPadding: number;
  versoCurriculumFontSize: number;
  versoHeaderFontSize: number;
  footerFontSize: number;
  versoInstitutionVerticalOffset: number;
  versoCurriculumVerticalOffset: number;
  mainTextVerticalOffset: number;
  titleVerticalOffset: number;
  titleFontSize: number;
  subtitleFontSize: number;
  titleSpacing: number;
  bodyVerticalOffset: number;
  highlightNameVerticalOffset: number;
  highlightNameFontSize: number;
  frontSidePadding: number;
  signaturesVerticalOffset: number;
  signaturesHorizontalPadding: number;
  signatureFontSize: number;
  frontTextAlign: 'left' | 'center' | 'right' | 'justify';
  boldVariables: string[];
  frontHeaderPadding: number;
  frontFooterPadding: number;
  versoHeaderPadding: number;
  versoFooterPadding: number;
  frontBorderWidth: number;
}

/**
 * Salva automaticamente apenas configurações e layout não sensíveis.
 * Garante que CPFs, alunos e imagens nunca sejam gravados em localStorage.
 */
export function saveNonSensitiveConfig(data: CertificateData): boolean {
  try {
    const storage = getStorage();
    if (!storage) return false;

    const payload: NonSensitiveConfig = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      courseName: data.courseName || '',
      courseDate: data.courseDate || '',
      totalHours: data.totalHours || '0',
      workloadMode: data.workloadMode || 'auto',
      companyName: data.companyName || '',
      companyCnpj: data.companyCnpj || '',
      address: data.address || '',
      providerName: data.providerName || '',
      providerCnpj: data.providerCnpj || '',
      techResponsibleName: data.techResponsibleName || '',
      techResponsibleCompetencies: data.techResponsibleCompetencies || '',
      showTechResponsible: Boolean(data.showTechResponsible),
      baseText: data.baseText || '',
      showHoursColumn: Boolean(data.showHoursColumn),
      versoSplitRatio: data.versoSplitRatio,
      hoursColumnWidth: data.hoursColumnWidth,
      versoRowPadding: data.versoRowPadding,
      versoCurriculumFontSize: data.versoCurriculumFontSize,
      versoHeaderFontSize: data.versoHeaderFontSize,
      footerFontSize: data.footerFontSize,
      versoInstitutionVerticalOffset: data.versoInstitutionVerticalOffset,
      versoCurriculumVerticalOffset: data.versoCurriculumVerticalOffset,
      mainTextVerticalOffset: data.mainTextVerticalOffset,
      titleVerticalOffset: data.titleVerticalOffset,
      titleFontSize: data.titleFontSize,
      subtitleFontSize: data.subtitleFontSize,
      titleSpacing: data.titleSpacing,
      bodyVerticalOffset: data.bodyVerticalOffset,
      highlightNameVerticalOffset: data.highlightNameVerticalOffset,
      highlightNameFontSize: data.highlightNameFontSize,
      frontSidePadding: data.frontSidePadding,
      signaturesVerticalOffset: data.signaturesVerticalOffset,
      signaturesHorizontalPadding: data.signaturesHorizontalPadding,
      signatureFontSize: data.signatureFontSize,
      frontTextAlign: data.frontTextAlign,
      boldVariables: data.boldVariables || [],
      frontHeaderPadding: data.frontHeaderPadding,
      frontFooterPadding: data.frontFooterPadding,
      versoHeaderPadding: data.versoHeaderPadding,
      versoFooterPadding: data.versoFooterPadding,
      frontBorderWidth: data.frontBorderWidth
    };

    storage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('Falha ao salvar configurações não sensíveis no localStorage:', err);
    return false;
  }
}

/**
 * Carrega configurações salvas automaticamente sem restaurar dados sensíveis.
 */
export function loadNonSensitiveConfig(): Partial<CertificateData> | null {
  try {
    const storage = getStorage();
    if (!storage) return null;
    const raw = storage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return null;

    const parsed: NonSensitiveConfig = JSON.parse(raw);
    if (!parsed || parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      return null;
    }

    // Retorna apenas propriedades de configuração
    const { schemaVersion, savedAt, ...config } = parsed;
    return config;
  } catch (err) {
    console.warn('Falha ao carregar configurações do localStorage:', err);
    return null;
  }
}

/**
 * Remove o rascunho de configurações do localStorage.
 */
export function clearSavedConfig(): void {
  try {
    const storage = getStorage();
    if (storage) {
      storage.removeItem(CONFIG_STORAGE_KEY);
    }
  } catch {}
}

/* ========================================================================= */
/* PERSISTÊNCIA EXPLÍCITA DE PROJETO COMPLETO COM CRIPTOGRAFIA WEB CRYPTO    */
/* ========================================================================= */

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string; // Base64
  salt: string; // Base64
}

export interface ProjectPackage {
  magic: 'CERTIFICAMASTER_PROJECT';
  schemaVersion: number;
  exportedAt: string;
  isEncrypted: boolean;
  data?: CertificateData;
  encryptedPayload?: EncryptedPayload;
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const cryptoObj = getCrypto();
  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Exporta o projeto completo para formato JSON versionado, opcionalmente criptografado com senha do operador.
 */
export async function exportProjectPackage(
  data: CertificateData,
  password?: string
): Promise<string> {
  const isEncrypted = Boolean(password && password.trim());
  const exportedAt = new Date().toISOString();

  if (!isEncrypted) {
    const pkg: ProjectPackage = {
      magic: 'CERTIFICAMASTER_PROJECT',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt,
      isEncrypted: false,
      data
    };
    return JSON.stringify(pkg, null, 2);
  }

  // Criptografia AES-GCM com chave derivada via PBKDF2 (Web Crypto API)
  const cryptoObj = getCrypto();
  const salt = cryptoObj.getRandomValues(new Uint8Array(16));
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password!.trim(), salt);

  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(data));

  const ciphertext = await cryptoObj.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  const pkg: ProjectPackage = {
    magic: 'CERTIFICAMASTER_PROJECT',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt,
    isEncrypted: true,
    encryptedPayload: {
      ciphertext: bufferToBase64(ciphertext),
      iv: bufferToBase64(iv),
      salt: bufferToBase64(salt)
    }
  };

  return JSON.stringify(pkg, null, 2);
}

export interface ImportProjectResult {
  success: boolean;
  data?: CertificateData;
  requiresPassword?: boolean;
  error?: string;
}

/**
 * Importa e valida um arquivo de projeto completo, descriptografando se necessário.
 */
export async function importProjectPackage(
  jsonText: string,
  password?: string
): Promise<ImportProjectResult> {
  try {
    if (!jsonText || !jsonText.trim()) {
      return { success: false, error: 'O arquivo está vazio.' };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return { success: false, error: 'O arquivo contém JSON corrompido ou inválido.' };
    }

    if (!parsed || parsed.magic !== 'CERTIFICAMASTER_PROJECT') {
      return {
        success: false,
        error: 'Arquivo inválido. O documento não é um arquivo de projeto do CertificaMaster.'
      };
    }

    if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
      return {
        success: false,
        error: `Versão do projeto (${parsed.schemaVersion}) incompatível com este aplicativo (v${CURRENT_SCHEMA_VERSION}).`
      };
    }

    if (!parsed.isEncrypted) {
      if (!parsed.data || typeof parsed.data !== 'object') {
        return { success: false, error: 'Estrutura de dados ausente no projeto.' };
      }
      return { success: true, data: parsed.data as CertificateData };
    }

    // Projeto protegido por senha
    if (!password || !password.trim()) {
      return {
        success: false,
        requiresPassword: true,
        error: 'Este projeto está protegido por senha. Forneça a senha para importá-lo.'
      };
    }

    if (!parsed.encryptedPayload || !parsed.encryptedPayload.ciphertext) {
      return { success: false, error: 'Carga de dados criptografada ausente ou corrompida.' };
    }

    const { ciphertext, iv, salt } = parsed.encryptedPayload;
    const saltBuffer = base64ToBuffer(salt);
    const ivBuffer = base64ToBuffer(iv);
    const cipherBuffer = base64ToBuffer(ciphertext);

    const key = await deriveKey(password.trim(), saltBuffer);

    let decryptedBuffer: ArrayBuffer;
    try {
      const cryptoObj = getCrypto();
      decryptedBuffer = await cryptoObj.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBuffer },
        key,
        cipherBuffer
      );
    } catch {
      return {
        success: false,
        requiresPassword: true,
        error: 'Senha incorreta ou integridade dos dados violada.'
      };
    }

    const dec = new TextDecoder();
    const decryptedJson = dec.decode(decryptedBuffer);
    const recoveredData = JSON.parse(decryptedJson) as CertificateData;

    return { success: true, data: recoveredData };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Falha ao importar projeto: ${msg}` };
  }
}
