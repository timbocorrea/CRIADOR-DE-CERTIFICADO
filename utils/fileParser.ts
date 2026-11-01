/**
 * CertificaMaster - Leitor e Processador Inteligente de Arquivos Locais
 * Suporta arquivos de texto (.csv, .tsv, .txt), planilhas e conversão de imagens para base64.
 */

import { Student } from '../types';
import { parseStudentsBulkInput, ImportParseResult } from './importParser';

export interface ProcessedFileResult {
  kind: 'image' | 'text' | 'unsupported';
  base64Data?: string;
  mimeType?: string;
  textContent?: string;
  parseResult?: ImportParseResult;
  fileName: string;
  fileSize: number;
  error?: string;
}

/**
 * Converte um arquivo de imagem para Base64 pura (sem o prefixo data:image/...)
 * Compatível com navegadores e ambientes de teste Node/Vitest.
 */
export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const match = result.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          resolve({
            mimeType: match[1],
            base64: match[2],
          });
        } else {
          resolve({
            mimeType: file.type || 'image/png',
            base64: result,
          });
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // Fallback para Node / Vitest
  if (typeof (file as any).arrayBuffer === 'function') {
    const arrayBuffer = await (file as any).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return {
      base64: buffer.toString('base64'),
      mimeType: file.type || 'image/png',
    };
  }

  return { base64: '', mimeType: file.type || 'image/png' };
}

/**
 * Lê o conteúdo textual de arquivos .csv, .txt, .tsv
 * Suporta API moderna Blob.text() e fallback FileReader/Buffer.
 */
export async function fileToText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return await file.text();
  }

  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = (err) => reject(err);
      reader.readAsText(file, 'utf-8');
    });
  }

  if (typeof (file as any).arrayBuffer === 'function') {
    const arrayBuffer = await (file as any).arrayBuffer();
    return new TextDecoder('utf-8').decode(arrayBuffer);
  }

  return '';
}

/**
 * Processa qualquer arquivo carregado pelo operador
 */
export async function processUploadedFile(file: File, existingStudents: Student[] = []): Promise<ProcessedFileResult> {
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif)$/i.test(file.name);
  const isTextual = file.type.startsWith('text/') || /\.(csv|tsv|txt)$/i.test(file.name);

  if (isImage) {
    try {
      const { base64, mimeType } = await fileToBase64(file);
      return {
        kind: 'image',
        base64Data: base64,
        mimeType,
        fileName: file.name,
        fileSize: file.size,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        kind: 'unsupported',
        fileName: file.name,
        fileSize: file.size,
        error: `Erro ao ler imagem: ${msg}`,
      };
    }
  }

  if (isTextual) {
    try {
      const text = await fileToText(file);
      const parseResult = parseStudentsBulkInput(text, existingStudents);
      return {
        kind: 'text',
        textContent: text,
        parseResult,
        fileName: file.name,
        fileSize: file.size,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        kind: 'unsupported',
        fileName: file.name,
        fileSize: file.size,
        error: `Erro ao ler arquivo de texto: ${msg}`,
      };
    }
  }

  return {
    kind: 'unsupported',
    fileName: file.name,
    fileSize: file.size,
    error: 'Formato não suportado diretamente. Utilize imagens (.png, .jpg), planilhas (.csv) ou arquivos de texto (.txt).',
  };
}
