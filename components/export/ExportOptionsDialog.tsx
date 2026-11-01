import React from 'react';
import { ExportMode } from '../../services/pdf';
import { Student } from '../../types';
import {
  AppDialog,
  AppButton,
  AppBadge,
} from '../ui';

interface ExportOptionsDialogProps {
  isOpen: boolean;
  selectedExportMode: ExportMode;
  currentStudent: Student | null;
  onSelectMode: (mode: ExportMode) => void;
  onClose: () => void;
  onStartExport: (mode: ExportMode) => void;
}

export const ExportOptionsDialog: React.FC<ExportOptionsDialogProps> = ({
  isOpen,
  selectedExportMode,
  currentStudent,
  onSelectMode,
  onClose,
  onStartExport,
}) => {
  const options = [
    {
      mode: 'duplex' as ExportMode,
      title: 'Lote Completo Duplex (Frente e Verso)',
      badge: 'Recomendado para Gráfica',
      description: 'Gera um PDF único com páginas intercaladas: Frente do Aluno 1, Verso do Aluno 1, Frente do Aluno 2, etc. Pronto para impressão frente e verso.',
      icon: 'fa-solid fa-copy',
    },
    {
      mode: 'individual' as ExportMode,
      title: 'Certificado Individual (Aluno Atual)',
      badge: currentStudent ? currentStudent.name : 'Nenhum selecionado',
      description: `Gera o PDF apenas para o aluno atualmente selecionado (${currentStudent?.name || 'sem aluno'}). Contém a frente e o verso correspondente.`,
      icon: 'fa-solid fa-user-check',
      disabled: !currentStudent,
    },
    {
      mode: 'frontOnly' as ExportMode,
      title: 'Somente Frentes da Turma',
      badge: 'Anverso',
      description: 'Gera um PDF contendo unicamente as páginas de frente de todos os alunos cadastrados na turma.',
      icon: 'fa-solid fa-file',
    },
    {
      mode: 'versoOnly' as ExportMode,
      title: 'Somente Versos da Turma',
      badge: 'Verso',
      description: 'Gera um PDF contendo unicamente as páginas de verso e grade curricular para todos os alunos cadastrados.',
      icon: 'fa-solid fa-file-lines',
    },
  ];

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Opções de Exportação em PDF"
      description="Selecione o modo de emissão documental desejado"
      icon="fa-solid fa-file-pdf"
      maxWidth="lg"
      footer={
        <>
          <AppButton type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </AppButton>
          <AppButton
            type="button"
            variant="primary"
            icon="fa-solid fa-download"
            onClick={() => {
              onStartExport(selectedExportMode);
            }}
          >
            Iniciar Exportação
          </AppButton>
        </>
      }
    >
      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = selectedExportMode === opt.mode;
          return (
            <div
              key={opt.mode}
              data-mode={opt.mode}
              onClick={() => !opt.disabled && onSelectMode(opt.mode)}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                opt.disabled
                  ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50'
                  : isSelected
                  ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="pt-0.5">
                <input
                  type="radio"
                  name="exportMode"
                  checked={isSelected}
                  onChange={() => !opt.disabled && onSelectMode(opt.mode)}
                  disabled={opt.disabled}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs text-slate-800">
                    {opt.title}
                  </span>
                  {opt.badge && (
                    <AppBadge
                      variant={isSelected ? 'default' : 'neutral'}
                      size="sm"
                    >
                      {opt.badge}
                    </AppBadge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {opt.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </AppDialog>
  );
};
