/**
 * CertificaMaster - Tipos do Motor de Exportação de PDF
 * Gate 03: Reconstrução do Motor de PDF, Duplex, Emissão Individual e Gerenciamento de Memória
 */

import { CertificateData, Student, CurriculumItem } from '../../types';

export type ExportMode = 'duplex' | 'individual' | 'frontOnly' | 'versoOnly';

export interface PageRenderTask {
  id: string;
  student: Student | null;
  pageType: 'front' | 'verso' | 'filler';
  pageNumber: number; // 1-based index in the final PDF document
  studentIndex?: number;
  versoPageNumber?: number;
  versoTotalPages?: number;
  curriculumSlice?: CurriculumItem[];
  label: string;
}

export interface PDFProgressInfo {
  currentStep: string;
  completedTasks: number;
  totalTasks: number;
  completedStudents: number;
  totalStudents: number;
  percent: number;
  isCancelled: boolean;
}

export interface PDFExportOptions {
  mode: ExportMode;
  data: CertificateData;
  students: Student[];
  selectedStudent?: Student | null;
  onProgress?: (progress: PDFProgressInfo) => void;
  signal?: AbortSignal;
}

export interface PDFExportResult {
  success: boolean;
  totalStudents: number;
  totalPages: number;
  fileName?: string;
  cancelled?: boolean;
  error?: string;
}

export interface CurriculumPagingConfig {
  maxItemsPerPage: number;
  compactThreshold: number;
}
