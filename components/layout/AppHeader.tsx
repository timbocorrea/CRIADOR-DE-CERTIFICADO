import React from 'react';
import {
  AppButton,
  AppBadge,
} from '../ui';

interface AppHeaderProps {
  courseName?: string;
  studentsCount: number;
  autoSaveStatus: 'saved' | 'saving' | 'error' | 'idle';
  lastSavedTime: Date | null;
  onOpenProjectModal: () => void;
  onOpenExportModal: () => void;
  onExportIndividual: () => void;
  onOpenAISettings?: () => void;
  onOpenValidation?: () => void;
  currentStudentName?: string;
  isGenerating?: boolean;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  courseName,
  studentsCount,
  autoSaveStatus,
  lastSavedTime,
  onOpenProjectModal,
  onOpenExportModal,
  onExportIndividual,
  onOpenAISettings,
  onOpenValidation,
  currentStudentName,
  isGenerating = false,
  theme = 'light',
  onToggleTheme,
}) => {
  return (
    <header className="h-16 bg-slate-900 text-white px-3 sm:px-5 flex items-center justify-between border-b border-slate-800 shrink-0 select-none no-print z-30">
      {/* Brand Identity & Project info */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 pr-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm sm:text-base shadow-sm shrink-0">
            <i className="fa-solid fa-graduation-cap" aria-hidden="true"></i>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
                CertificaMaster
              </h1>
              <span className="hidden xs:inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/80 shrink-0">
                Corporativo
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[120px] xs:max-w-[180px] sm:max-w-xs">
              {courseName || 'Novo Projeto de Certificado'}
            </p>
          </div>
        </div>

        {/* Persistence Status Badge */}
        <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs shrink-0">
          {autoSaveStatus === 'saved' ? (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs" title="Layout não-sensível salvo localmente">
              <i className="fa-solid fa-circle-check text-xs" aria-hidden="true"></i>
              <span>Layout Salvo</span>
            </div>
          ) : autoSaveStatus === 'saving' ? (
            <div className="flex items-center gap-1.5 text-blue-400 text-xs">
              <i className="fa-solid fa-circle-notch fa-spin text-xs" aria-hidden="true"></i>
              <span>Salvando preferências...</span>
            </div>
          ) : null}

          {studentsCount > 0 && (
            <AppBadge variant="info" size="sm" icon="fa-solid fa-shield-halved">
              {studentsCount} aluno(s) em memória
            </AppBadge>
          )}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Alternador de Modo Claro / Escuro */}
        {onToggleTheme && (
          <button
            type="button"
            data-testid="theme-toggle"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {theme === 'dark' ? (
              <i className="fa-solid fa-sun text-amber-400 text-sm" aria-hidden="true"></i>
            ) : (
              <i className="fa-solid fa-moon text-slate-300 text-sm" aria-hidden="true"></i>
            )}
          </button>
        )}

        {/* Central de Inteligência Artificial & OCR */}
        {onOpenAISettings && (
          <button
            type="button"
            data-testid="ai-settings-toggle"
            onClick={onOpenAISettings}
            aria-label="Central de Inteligência Artificial & OCR"
            title="Configurar IAs Gratuitas (Gemini, Groq, OpenRouter)"
            className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <i className="fa-solid fa-microchip text-blue-400 text-sm" aria-hidden="true"></i>
          </button>
        )}

        {/* Portal de Autenticidade & Validação de Certificados */}
        {onOpenValidation && (
          <button
            type="button"
            onClick={onOpenValidation}
            aria-label="Validar Autenticidade de Certificado"
            title="Validar Certificado (QR Code / Código Único)"
            className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <i className="fa-solid fa-stamp text-emerald-400 text-sm" aria-hidden="true"></i>
          </button>
        )}

        {/* Project Management Modal Button */}
        <AppButton
          type="button"
          size="sm"
          variant="secondary"
          icon="fa-solid fa-floppy-disk"
          onClick={onOpenProjectModal}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-white min-h-[36px]"
          title="Salvar projeto completo (.certproj) ou carregar arquivo"
        >
          <span>Projeto</span>
        </AppButton>

        {/* Emitir Individual (Aluno Ativo) */}
        {studentsCount > 0 && (
          <AppButton
            type="button"
            size="sm"
            variant="outline"
            icon="fa-solid fa-user-check"
            onClick={onExportIndividual}
            disabled={isGenerating}
            className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white hidden md:inline-flex min-h-[36px]"
            title={`Emitir certificado individual para ${currentStudentName || 'o aluno selecionado'}`}
          >
            <span>Emitir Individual</span>
          </AppButton>
        )}

        {/* Exportar Lote Completo */}
        <AppButton
          type="button"
          size="sm"
          variant="primary"
          icon="fa-solid fa-print"
          onClick={onOpenExportModal}
          isLoading={isGenerating}
          className="bg-blue-600 hover:bg-blue-500 shadow-md min-h-[36px]"
          title="Exportar certificados em PDF duplex ou individual"
        >
          <span>Exportar PDF</span>
        </AppButton>
      </div>
    </header>
  );
};
