import { useState, useRef, useCallback } from 'react';
import { CertificateData, Student } from '../types';
import {
  executePDFExport,
  captureElementToCanvas,
  ExportMode,
  PDFProgressInfo,
  PageRenderTask
} from '../services/pdf';

export interface PDFExportProcessCallbacks {
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export function usePDFExportProcess(
  data: CertificateData,
  currentStudent: Student | null,
  callbacks?: PDFExportProcessCallbacks
) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedExportMode, setSelectedExportMode] = useState<ExportMode>('duplex');
  const [exportProgress, setExportProgress] = useState<PDFProgressInfo | null>(null);
  const [activeRenderTask, setActiveRenderTask] = useState<PageRenderTask | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const notifyError = useCallback((msg: string) => {
    if (callbacks?.onError) {
      callbacks.onError(msg);
    } else {
      alert(msg);
    }
  }, [callbacks]);

  const notifySuccess = useCallback((msg: string) => {
    if (callbacks?.onSuccess) {
      callbacks.onSuccess(msg);
    }
  }, [callbacks]);

  const startExport = useCallback(async (mode: ExportMode) => {
    if (mode !== 'individual' && data.students.length === 0) {
      notifyError('Adicione pelo menos um aluno para exportação.');
      return;
    }
    if (mode === 'individual' && !currentStudent && data.students.length === 0) {
      notifyError('Selecione um aluno para emitir o certificado individual.');
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsGenerating(true);
    setIsExportModalOpen(false);

    try {
      const result = await executePDFExport(
        {
          mode,
          data,
          students: data.students,
          selectedStudent: currentStudent || (data.students.length > 0 ? data.students[0] : null),
          signal: controller.signal,
          onProgress: (prog) => {
            setExportProgress(prog);
          },
        },
        async (task: PageRenderTask, signal?: AbortSignal) => {
          if (signal?.aborted) {
            throw new Error('CANCELLED');
          }

          setActiveRenderTask(task);
          // Aguarda ciclo do React para montagem e estabilização do DOM
          await new Promise(resolve => setTimeout(resolve, 40));

          const elementId = task.pageType === 'front'
            ? 'certificate-page-1-export-slot'
            : 'certificate-page-2-export-slot';

          const element = document.getElementById(elementId);
          if (!element) {
            throw new Error(`Falha ao localizar elemento ${elementId} para captura.`);
          }

          const canvas = await captureElementToCanvas(element);
          setActiveRenderTask(null);
          return canvas;
        }
      );

      if (result.success) {
        notifySuccess('Certificados gerados com sucesso!');
      } else if (result.cancelled) {
        // Cancelado amigavelmente
      } else if (result.error) {
        notifyError(`Erro na exportação: ${result.error}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'CANCELLED') {
        // Cancelado amigavelmente
      } else {
        console.error('Falha na geração do PDF:', err);
        notifyError('Ocorreu um erro durante a geração do PDF.');
      }
    } finally {
      setIsGenerating(false);
      setActiveRenderTask(null);
      setExportProgress(null);
      abortControllerRef.current = null;
    }
  }, [data, currentStudent, notifyError, notifySuccess]);

  const cancelExport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    isExportModalOpen,
    setIsExportModalOpen,
    selectedExportMode,
    setSelectedExportMode,
    exportProgress,
    activeRenderTask,
    isGenerating,
    startExport,
    cancelExport,
  };
}
