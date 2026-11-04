import React from 'react';
import { PDFProgressInfo, ExportMode } from '../../services/pdf';
import { AppButton } from '../ui';

interface ExportProgressDialogProps {
  isGenerating: boolean;
  exportProgress: PDFProgressInfo | null;
  selectedExportMode: ExportMode;
  onCancel: () => void;
}

export const ExportProgressDialog: React.FC<ExportProgressDialogProps> = ({
  isGenerating,
  exportProgress,
  selectedExportMode,
  onCancel,
}) => {
  if (!isGenerating || !exportProgress) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Processando Exportação de Certificados em PDF"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 dark:border-slate-800 flex flex-col gap-5 text-center animate-scaleUp">
        {/* Animated Icon */}
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-sm">
          <i className="fa-solid fa-file-pdf animate-pulse"></i>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Gerando Certificados em PDF
          </h3>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 truncate">
            {exportProgress.currentStep || 'Renderizando páginas...'}
          </p>
        </div>

        {/* Real Progress Bar */}
        <div className="space-y-1.5">
          <div
            className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-200/60 dark:border-slate-700"
            role="progressbar"
            aria-valuenow={exportProgress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="bg-blue-600 h-full transition-all duration-300 rounded-full shadow-sm"
              style={{ width: `${exportProgress.percent}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium px-1">
            <span>{exportProgress.percent}% concluído</span>
            <span>
              Página {exportProgress.completedTasks} de {exportProgress.totalTasks}
            </span>
          </div>
        </div>

        {/* Informações da Tarefa Atual */}
        {exportProgress.currentStudentName && (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 truncate">
            <span className="text-slate-400">Processando:</span>{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {exportProgress.currentStudentName}
            </span>
          </div>
        )}

        {/* Cancel Button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <AppButton
            type="button"
            variant="danger"
            size="sm"
            icon="fa-solid fa-stop"
            onClick={onCancel}
            className="w-full"
          >
            Cancelar Emissão
          </AppButton>
        </div>
      </div>
    </div>
  );
};
