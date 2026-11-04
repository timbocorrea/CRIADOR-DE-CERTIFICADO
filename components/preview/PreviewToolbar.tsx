import React from 'react';
import { Student } from '../../types';
import { AppButton } from '../ui';

interface PreviewToolbarProps {
  totalStudents: number;
  currentStudentIdx: number;
  currentStudent: Student | null;
  previewPage: 1 | 2;
  zoom: number;
  zoomMode?: 'auto' | 'manual';
  onToggleZoomMode?: (mode: 'auto' | 'manual') => void;
  onSetCustomZoom?: (zoom: number) => void;
  isGenerating: boolean;
  onPrevStudent: () => void;
  onNextStudent: () => void;
  onSelectPage: (page: 1 | 2) => void;
  onZoomChange: (delta: number) => void;
  onResetZoom?: () => void;
  onOpenFullscreen?: () => void;
  onExportIndividual: () => void;
}

export const PreviewToolbar: React.FC<PreviewToolbarProps> = React.memo(({
  totalStudents,
  currentStudentIdx,
  currentStudent,
  previewPage,
  zoom,
  zoomMode = 'auto',
  onToggleZoomMode,
  onSetCustomZoom,
  isGenerating,
  onPrevStudent,
  onNextStudent,
  onSelectPage,
  onZoomChange,
  onResetZoom,
  onOpenFullscreen,
  onExportIndividual,
}) => {
  return (
    <div
      role="toolbar"
      aria-label="Controles de pré-visualização e navegação de certificados"
      className="w-full flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm shrink-0 no-print z-20 select-none"
    >
      {/* 1. Carrossel de Alunos */}
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700 ${
            totalStudents === 0 ? 'pointer-events-none' : ''
          }`}
        >
          <button
            type="button"
            disabled={currentStudentIdx === 0 || totalStudents === 0}
            onClick={onPrevStudent}
            className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-all text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            title="Aluno anterior"
            aria-label="Aluno anterior"
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
          </button>

          <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 px-1 sm:px-2 min-w-[70px] sm:min-w-[140px] text-center truncate">
            {totalStudents > 0 ? (
              <>
                <span className="hidden sm:inline text-slate-500 dark:text-slate-300">Aluno </span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{currentStudentIdx + 1}</span>{' '}
                <span className="text-slate-500 dark:text-slate-300">
                  <span className="hidden sm:inline">de </span>
                  <span className="sm:hidden">/ </span>
                  {totalStudents}
                </span>
              </>
            ) : (
              <span className="text-slate-500 dark:text-slate-300 italic">Sem alunos</span>
            )}
          </div>

          <button
            type="button"
            disabled={currentStudentIdx === totalStudents - 1 || totalStudents === 0}
            onClick={onNextStudent}
            className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-all text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            title="Próximo aluno"
            aria-label="Próximo aluno"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
          </button>
        </div>

        {currentStudent && (
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate max-w-[150px] hidden xl:inline-block">
            {currentStudent.name}
          </span>
        )}
      </div>

      {/* 2. Alternância Frente / Verso */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700/60" role="group" aria-label="Página de visualização">
        <button
          type="button"
          onClick={() => onSelectPage(1)}
          aria-pressed={previewPage === 1}
          className={`px-2.5 sm:px-4 py-1.5 min-h-[32px] rounded-lg text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
            previewPage === 1
              ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400 border border-slate-200/50 dark:border-slate-600'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <i className="fa-solid fa-file text-xs sm:mr-1.5" aria-hidden="true"></i>
          <span className="hidden sm:inline">Frente (Pág 1)</span>
          <span className="sm:hidden">Frente</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectPage(2)}
          aria-pressed={previewPage === 2}
          className={`px-2.5 sm:px-4 py-1.5 min-h-[32px] rounded-lg text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
            previewPage === 2
              ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400 border border-slate-200/50 dark:border-slate-600'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <i className="fa-solid fa-file-lines text-xs sm:mr-1.5" aria-hidden="true"></i>
          <span className="hidden sm:inline">Verso (Pág 2)</span>
          <span className="sm:hidden">Verso</span>
        </button>
      </div>

      {/* 3. Controles de Enquadramento e Zoom Proporcional (Auto Responsivo como Padrão) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1 border border-slate-200/60 dark:border-slate-700/60" role="group" aria-label="Controle de Escala e Enquadramento">
          {/* Botão de Enquadramento Automático Responsivo (Opção Padrão) */}
          <button
            type="button"
            onClick={() => (onToggleZoomMode ? onToggleZoomMode('auto') : onResetZoom?.())}
            aria-pressed={zoomMode === 'auto'}
            className={`px-2.5 sm:px-3 py-1.5 min-h-[32px] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              zoomMode === 'auto'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/80 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
            }`}
            title="Ajuste Responsivo Automático (Padrão) — Mantém o certificado inteiro sempre em foco na tela"
          >
            <i className="fa-solid fa-arrows-to-eye text-xs"></i>
            <span>Auto ({Math.round(zoom * 100)}%)</span>
          </button>

          {/* Menu Suspenso de Proporções Pré-definidas e Ajuste Manual */}
          <div className="relative flex items-center">
            <select
              value={zoomMode === 'auto' ? 'auto' : String(Math.round(zoom * 100))}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'auto') {
                  if (onToggleZoomMode) onToggleZoomMode('auto');
                  else onResetZoom?.();
                } else if (onSetCustomZoom) {
                  onSetCustomZoom(parseInt(val, 10) / 100);
                } else {
                  onZoomChange(0);
                }
              }}
              className={`py-1.5 pl-2 pr-6 text-xs font-semibold rounded-lg border transition-all cursor-pointer outline-none appearance-none ${
                zoomMode === 'manual'
                  ? 'bg-white dark:bg-slate-700 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-300 dark:ring-blue-700'
                  : 'bg-white/80 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-600'
              }`}
              title="Selecione uma proporção manual ou retorne ao ajuste automático"
            >
              <option value="auto">📐 Auto (Responsivo - Padrão)</option>
              <option value="35">35% (Visão Geral)</option>
              <option value="50">50% (Meia escala)</option>
              <option value="75">75% (Compacto)</option>
              <option value="100">100% (Tamanho Real)</option>
              <option value="125">125% (Ampliado)</option>
              <option value="150">150% (Zoom Detalhes)</option>
            </select>
            <div className="absolute right-2 pointer-events-none text-slate-400 text-[10px]">
              <i className="fa-solid fa-chevron-down"></i>
            </div>
          </div>

          {/* Botões de Ajuste Fino (+ e -) */}
          <button
            type="button"
            onClick={() => onZoomChange(-0.05)}
            className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            title="Reduzir proporção (-5%)"
            aria-label="Reduzir proporção"
          >
            <i className="fa-solid fa-minus" aria-hidden="true"></i>
          </button>

          <button
            type="button"
            onClick={() => onZoomChange(0.05)}
            className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            title="Aumentar proporção (+5%)"
            aria-label="Aumentar proporção"
          >
            <i className="fa-solid fa-plus" aria-hidden="true"></i>
          </button>
        </div>

        {onOpenFullscreen && (
          <AppButton
            type="button"
            size="sm"
            variant="secondary"
            icon="fa-solid fa-expand"
            onClick={onOpenFullscreen}
            title="Abrir pré-visualização completa em tela cheia"
            className="min-h-[32px] sm:min-h-[36px] px-2 sm:px-3 text-xs"
          >
            <span className="hidden sm:inline">Expandir</span>
          </AppButton>
        )}
      </div>
    </div>
  );
});

PreviewToolbar.displayName = 'PreviewToolbar';
