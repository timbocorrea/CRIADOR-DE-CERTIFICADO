/**
 * CertificaMaster - Orquestrador Central de Exportação de PDF
 * Gate 03: Controle de fluxo, cancelamento, progresso e liberação de memória
 */

import { PDFExportOptions, PDFExportResult, PageRenderTask, PDFProgressInfo } from './types';
import { planPDFExport, generatePDFFileName } from './exportPlanner';
import { PDFEngine } from './pdfEngine';

export type TaskCaptureHandler = (task: PageRenderTask, signal?: AbortSignal) => Promise<HTMLCanvasElement>;

/**
 * Executa a exportação completa de certificados de acordo com as opções configuradas.
 */
export const executePDFExport = async (
  options: PDFExportOptions,
  captureHandler: TaskCaptureHandler
): Promise<PDFExportResult> => {
  const { mode, data, students, selectedStudent, onProgress, signal } = options;

  if (signal?.aborted) {
    return {
      success: false,
      totalStudents: 0,
      totalPages: 0,
      cancelled: true,
      error: 'Operação cancelada pelo usuário antes do início.',
    };
  }

  // 1. Planejamento determinístico de páginas
  let tasks: PageRenderTask[];
  try {
    tasks = planPDFExport(mode, data, students, selectedStudent);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao planejar páginas do PDF.';
    return {
      success: false,
      totalStudents: 0,
      totalPages: 0,
      error: message,
    };
  }

  if (tasks.length === 0) {
    return {
      success: false,
      totalStudents: 0,
      totalPages: 0,
      error: 'Nenhuma página a ser gerada para as opções informadas.',
    };
  }

  const pdfEngine = new PDFEngine();
  const totalTasks = tasks.length;
  const uniqueStudents = new Set<string>();
  let completedTasks = 0;

  const notify = (stepText: string) => {
    if (!onProgress) return;
    const progress: PDFProgressInfo = {
      currentStep: stepText,
      completedTasks,
      totalTasks,
      completedStudents: uniqueStudents.size,
      totalStudents: mode === 'individual' ? 1 : students.length,
      percent: Math.min(100, Math.round((completedTasks / totalTasks) * 100)),
      isCancelled: !!signal?.aborted,
    };
    onProgress(progress);
  };

  notify('Iniciando geração de documentos...');

  try {
    for (let i = 0; i < tasks.length; i++) {
      if (signal?.aborted) {
        pdfEngine.dispose();
        notify('Operação cancelada pelo usuário.');
        return {
          success: false,
          totalStudents: uniqueStudents.size,
          totalPages: completedTasks,
          cancelled: true,
          error: 'Exportação cancelada pelo usuário.',
        };
      }

      const task = tasks[i];
      notify(`Processando ${task.label} (${i + 1}/${totalTasks})...`);

      // Captura da página via handler sob demanda
      const canvas = await captureHandler(task, signal);

      if (!canvas) {
        throw new Error(`Falha ao renderizar a página ${task.pageNumber} (${task.label}).`);
      }

      // Adiciona página ao PDF e limpa os pixels do canvas imediatamente
      pdfEngine.addCanvasPage(canvas);

      if (task.student) {
        uniqueStudents.add(task.student.id);
      }
      completedTasks++;

      notify(`Concluída página ${task.pageNumber} de ${totalTasks}`);

      // Pausa de 20ms entre páginas para descarte de GC e responsividade da interface
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    notify('Finalizando e compilando arquivo PDF...');

    const fileName = generatePDFFileName(
      data.courseName,
      mode,
      mode === 'individual' ? selectedStudent || students[0] : null
    );

    // Salva o arquivo no disco do usuário
    pdfEngine.save(fileName);

    notify('Exportação concluída com sucesso!');

    const result: PDFExportResult = {
      success: true,
      totalStudents: mode === 'individual' ? 1 : uniqueStudents.size,
      totalPages: completedTasks,
      fileName,
    };

    pdfEngine.dispose();
    return result;
  } catch (err: unknown) {
    pdfEngine.dispose();
    const errorMsg = err instanceof Error ? err.message : 'Erro inesperado durante a geração do PDF.';
    notify(`Erro: ${errorMsg}`);
    return {
      success: false,
      totalStudents: uniqueStudents.size,
      totalPages: completedTasks,
      error: errorMsg,
    };
  }
};
