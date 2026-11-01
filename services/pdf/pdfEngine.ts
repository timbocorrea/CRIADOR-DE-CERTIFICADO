/**
 * CertificaMaster - Motor de PDF (jsPDF Wrapper)
 * Gate 03: Integração atualizada com jspdf@4.2.1 e descarte de memória
 */

import { jsPDF } from 'jspdf';

export interface PDFEngineConfig {
  orientation?: 'landscape' | 'portrait';
  unit?: 'mm' | 'px' | 'pt';
  format?: string | [number, number];
  compress?: boolean;
}

export class PDFEngine {
  private doc: jsPDF;
  private pageCount: number = 0;

  constructor(config?: PDFEngineConfig) {
    this.doc = new jsPDF({
      orientation: config?.orientation || 'landscape',
      unit: config?.unit || 'mm',
      format: config?.format || 'a4',
      compress: config?.compress !== undefined ? config.compress : true,
    });
  }

  /**
   * Adiciona uma página rasterizada a partir de um HTMLCanvasElement ao documento PDF.
   * Reduz o uso de memória liberando a referência ao canvas imediatamente após a inserção.
   */
  public addCanvasPage(canvas: HTMLCanvasElement): void {
    if (this.pageCount > 0) {
      this.doc.addPage('a4', 'landscape');
    }

    // A4 Paisagem oficial: 297mm x 210mm
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    this.doc.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
    this.pageCount++;

    // Descarte imediato do buffer de pixels do canvas para evitar canvas leaks
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      canvas.width = 0;
      canvas.height = 0;
    } catch {
      // Ignora falhas de cleanup em ambientes virtuais/headless
    }
  }

  /**
   * Retorna a quantidade de páginas atualmente anexadas ao documento.
   */
  public getPageCount(): number {
    return this.pageCount;
  }

  /**
   * Salva o documento no disco do cliente (download no navegador).
   */
  public save(fileName: string): void {
    this.doc.save(fileName);
  }

  /**
   * Retorna o documento em formato Blob (útil para testes ou preview).
   */
  public outputBlob(): Blob {
    return this.doc.output('blob');
  }

  /**
   * Libera recursos internos da instância.
   */
  public dispose(): void {
    // Permite que o Garbage Collector colete a instância
    (this as unknown as { doc: unknown }).doc = null;
  }
}
