import QRCode from 'qrcode';
import { CertificateData, Student } from '../types';
import { formatRegistryForDisplay } from './professionalRegistry';

export interface SignedCertificatePayload {
  v: 1;
  code: string;
  n: string;   // Nome do aluno
  cpf: string; // CPF mascarado LGPD (***.123.456-**)
  c: string;   // Nome do curso
  h: string;   // Carga horária (horas)
  d: string;   // Data de conclusão
  o: string;   // Razão Social / Empresa Emissora
  j: string;   // CNPJ da Empresa Emissora
  tr: string;  // Responsável Técnico
  trr: string; // Registro do Responsável Técnico
  iat: string; // Data de emissão ISO
  sig: string; // Assinatura FNV-1a de integridade
}

const INTEGRITY_SALT = 'CERTIFICAMASTER_PUBLIC_REGISTRY_V1_2026';

/**
 * Hash determinístico rápido (FNV-1a 64-bit simulado em 2 blocos de 32-bit)
 * para gerar códigos únicos por aluno+curso e assinar o token do QR Code de forma síncrona.
 */
export function computeDeterministicHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + (i & 0xff);
    h2 = Math.imul(h2, 0x811c9dc5);
  }
  const part1 = (h1 >>> 0).toString(36).toUpperCase().padStart(6, '0');
  const part2 = (h2 >>> 0).toString(36).toUpperCase().padStart(6, '0');
  return `${part1}${part2}`;
}

export function maskStudentCpfForPublicRegistry(cpf?: string): string {
  const digits = (cpf || '').replace(/\D/g, '');
  if (digits.length === 11) {
    return `***.${digits.substring(3, 6)}.${digits.substring(6, 9)}-**`;
  }
  return '***.***.***-**';
}

/**
 * Gera um código de autenticidade determinístico para o aluno naquele curso/data
 * no formato CM-ANO-XXXXXX (ex: CM-2026-8F4K9A).
 */
export function generateStudentValidationCode(data: CertificateData, student: Student | null): string {
  const idPart = (student?.id || 'PREVIEW').trim().toUpperCase();
  const name = (student?.name || 'ALUNO DEMONSTRACAO').trim().toUpperCase();
  const cpfDigits = (student?.cpf || '00000000000').replace(/\D/g, '');
  const course = (data.courseName || 'CURSO PADRAO').trim().toUpperCase();
  const date = (data.courseDate || '').trim();
  const company = (data.companyName || '').trim().toUpperCase();

  const hash = computeDeterministicHash(`${idPart}|${name}|${cpfDigits}|${course}|${date}|${company}`);
  const yearMatch = date.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();

  return `CM-${year}-${hash.slice(0, 6)}`;
}

function computePayloadSignature(fields: Omit<SignedCertificatePayload, 'sig'>): string {
  const raw = [
    fields.v,
    fields.code,
    fields.n,
    fields.cpf,
    fields.c,
    fields.h,
    fields.d,
    fields.o,
    fields.j,
    fields.tr,
    fields.trr,
    INTEGRITY_SALT,
  ].join('||');
  return computeDeterministicHash(raw);
}

function encodeBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '==='.slice((base64.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Cria o token autocontido assinado com os dados do certificado do aluno.
 */
export function createSignedCertificateToken(data: CertificateData, student: Student | null): {
  validationCode: string;
  token: string;
  payload: SignedCertificatePayload;
} {
  const validationCode = generateStudentValidationCode(data, student);
  const baseFields: Omit<SignedCertificatePayload, 'sig'> = {
    v: 1,
    code: validationCode,
    n: (student?.name || '[NOME DO ALUNO]').trim(),
    cpf: maskStudentCpfForPublicRegistry(student?.cpf),
    c: (data.courseName || '[NOME DO CURSO]').trim(),
    h: (data.totalHours || '0').trim(),
    d: (data.courseDate || new Date().toLocaleDateString('pt-BR')).trim(),
    o: (data.companyName || data.providerName || 'Instituição Emissora').trim(),
    j: (data.companyCnpj || data.providerCnpj || '').trim(),
    tr: data.showTechResponsible ? (data.techResponsibleName || '').trim() : '',
    trr: data.showTechResponsible ? formatRegistryForDisplay(data.techResponsibleCompetencies) : '',
    iat: new Date().toISOString().slice(0, 10),
  };

  const sig = computePayloadSignature(baseFields);
  const payload: SignedCertificatePayload = { ...baseFields, sig };
  const token = encodeBase64Url(JSON.stringify(payload));

  return { validationCode, token, payload };
}

/**
 * Decodifica e verifica a assinatura de integridade de um token vindo da URL do QR Code.
 */
export function verifySignedCertificateToken(token: string): {
  isValid: boolean;
  payload?: SignedCertificatePayload;
  error?: string;
} {
  try {
    if (!token || !token.trim()) {
      return { isValid: false, error: 'Token de verificação ausente.' };
    }
    const jsonStr = decodeBase64Url(token.trim());
    const parsed = JSON.parse(jsonStr) as SignedCertificatePayload;
    if (!parsed || parsed.v !== 1 || !parsed.code || !parsed.sig) {
      return { isValid: false, error: 'Estrutura do QR Code inválida.' };
    }

    const { sig, ...rest } = parsed;
    const expectedSig = computePayloadSignature(rest);
    if (sig !== expectedSig) {
      return {
        isValid: false,
        error: 'Assinatura digital do QR Code inválida ou adulterada.',
      };
    }

    return { isValid: true, payload: parsed };
  } catch {
    return { isValid: false, error: 'Não foi possível decodificar os dados do QR Code.' };
  }
}

/**
 * Monta a URL pública completa embutida no QR Code do verso do certificado.
 * Quando qualquer pessoa ler o QR Code com a câmera do celular, abrirá o domínio
 * diretamente com os dados autenticados do aluno na tela.
 */
export function buildCertificateVerificationUrl(data: CertificateData, student: Student | null): {
  url: string;
  validationCode: string;
} {
  const { validationCode, token } = createSignedCertificateToken(data, student);
  const baseOrigin =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_APP_URL) ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://master-certificado.vercel.app');

  const cleanOrigin = String(baseOrigin).replace(/\/+$/, '');
  const url = `${cleanOrigin}/?validar=${encodeURIComponent(validationCode)}&cert=${encodeURIComponent(token)}`;
  return { url, validationCode };
}

/**
 * Gera um SVG inline nítido do QR Code de forma 100% síncrona.
 * Ideal para renderização imediata no Preview e captura de alta definição no PDF (html2canvas).
 */
export function generateQrCodeSvgMarkup(content: string): string {
  try {
    const qr = QRCode.create(content, {
      errorCorrectionLevel: 'M',
    });
    const modules = qr.modules;
    const size = modules.size;
    const margin = 1;
    const totalSize = size + margin * 2;

    let pathData = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (modules.get(r, c)) {
          const x = c + margin;
          const y = r + margin;
          pathData += `M${x},${y}h1v1h-1z `;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="100%" height="100%" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#ffffff"/><path d="${pathData.trim()}" fill="#0f172a"/></svg>`;
  } catch {
    return '';
  }
}

