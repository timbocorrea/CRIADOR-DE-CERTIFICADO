import React, { useState, useRef, useEffect } from 'react';
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
  mobileView?: 'split' | 'editor' | 'preview';
  onSelectMobileView?: (view: 'split' | 'editor' | 'preview') => void;
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
  mobileView = 'split',
  onSelectMobileView,
}) => {
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Fecha menus ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
        setIsViewMenuOpen(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsViewMenuOpen(false);
        setIsActionMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
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

      {/* 2. Grupo de Controles Mobile (< lg): Dois Menus na Mesma Linha do Cabeçalho */}
      <div className="flex lg:hidden items-center gap-1.5 shrink-0">
        {/* Menu de Visualização (Dividido / Edição / Preview) */}
        {onSelectMobileView && (
          <div ref={viewMenuRef} className="relative">
            <button
              type="button"
              id="mobile-view-menu-trigger"
              aria-haspopup="true"
              aria-expanded={isViewMenuOpen}
              aria-label="Selecionar modo de visualização"
              onClick={() => {
                setIsViewMenuOpen(!isViewMenuOpen);
                setIsActionMenuOpen(false);
              }}
              className="h-9 px-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 flex items-center gap-1.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-xs"
            >
              <i
                className={`text-xs ${
                  mobileView === 'split'
                    ? 'fa-solid fa-table-columns text-blue-400'
                    : mobileView === 'editor'
                    ? 'fa-solid fa-sliders text-amber-400'
                    : 'fa-solid fa-eye text-emerald-400'
                }`}
                aria-hidden="true"
              ></i>
              <span className="capitalize">
                {mobileView === 'split' ? 'Dividido' : mobileView === 'editor' ? 'Edição' : 'Preview'}
              </span>
              <i className="fa-solid fa-chevron-down text-[10px] text-slate-400" aria-hidden="true"></i>
            </button>

            {/* Dropdown Menu de Visualização */}
            {isViewMenuOpen && (
              <div
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="mobile-view-menu-trigger"
                className="absolute right-0 mt-1.5 w-56 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                  Modo de Exibição
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSelectMobileView('split');
                    setIsViewMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors ${
                    mobileView === 'split'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <i className="fa-solid fa-table-columns text-xs text-blue-400" aria-hidden="true"></i>
                  <div className="flex-1 min-w-0">
                    <div className="leading-snug">Dividido (Ao Vivo)</div>
                    <div className={`text-[10px] ${mobileView === 'split' ? 'text-blue-100' : 'text-slate-400'}`}>
                      Preview topo + Edição embaixo
                    </div>
                  </div>
                  {mobileView === 'split' && <i className="fa-solid fa-check text-xs ml-auto" aria-hidden="true"></i>}
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSelectMobileView('editor');
                    setIsViewMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors ${
                    mobileView === 'editor'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <i className="fa-solid fa-sliders text-xs text-amber-400" aria-hidden="true"></i>
                  <div className="flex-1 min-w-0">
                    <div className="leading-snug">Foco em Edição</div>
                    <div className={`text-[10px] ${mobileView === 'editor' ? 'text-blue-100' : 'text-slate-400'}`}>
                      Formulário em tela cheia
                    </div>
                  </div>
                  {mobileView === 'editor' && <i className="fa-solid fa-check text-xs ml-auto" aria-hidden="true"></i>}
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSelectMobileView('preview');
                    setIsViewMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors ${
                    mobileView === 'preview'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <i className="fa-solid fa-eye text-xs text-emerald-400" aria-hidden="true"></i>
                  <div className="flex-1 min-w-0">
                    <div className="leading-snug">Foco no Certificado</div>
                    <div className={`text-[10px] ${mobileView === 'preview' ? 'text-blue-100' : 'text-slate-400'}`}>
                      Visualização ampliada do A4
                    </div>
                  </div>
                  {mobileView === 'preview' && <i className="fa-solid fa-check text-xs ml-auto" aria-hidden="true"></i>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Menu Geral de Ações do Sistema */}
        <div ref={actionMenuRef} className="relative">
          <button
            type="button"
            id="mobile-action-menu-trigger"
            aria-haspopup="true"
            aria-expanded={isActionMenuOpen}
            aria-label="Abrir menu de ações e configurações"
            onClick={() => {
              setIsActionMenuOpen(!isActionMenuOpen);
              setIsViewMenuOpen(false);
            }}
            className="h-9 px-2.5 rounded-lg border border-slate-700 bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 shadow-md"
          >
            <i className="fa-solid fa-bars text-xs" aria-hidden="true"></i>
            <span>Menu</span>
            <i className="fa-solid fa-chevron-down text-[10px] text-blue-200" aria-hidden="true"></i>
          </button>

          {/* Dropdown Menu de Ações */}
          {isActionMenuOpen && (
            <div
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="mobile-action-menu-trigger"
              className="absolute right-0 mt-1.5 w-60 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-800"
            >
              {/* Seção 1: Exportação Principal */}
              <div className="p-1 space-y-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    onOpenExportModal();
                  }}
                  disabled={isGenerating}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-2.5 transition-colors shadow-sm"
                >
                  <i className="fa-solid fa-print text-xs" aria-hidden="true"></i>
                  <span>Exportar PDF Completo</span>
                </button>

                {studentsCount > 0 && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsActionMenuOpen(false);
                      onExportIndividual();
                    }}
                    disabled={isGenerating}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                  >
                    <i className="fa-solid fa-user-check text-xs text-blue-400" aria-hidden="true"></i>
                    <span className="truncate">Emitir Individual ({currentStudentName || 'Aluno Atual'})</span>
                  </button>
                )}
              </div>

              {/* Seção 2: Ferramentas do Projeto */}
              <div className="p-1 space-y-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    onOpenProjectModal();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                >
                  <i className="fa-solid fa-floppy-disk text-xs text-slate-400" aria-hidden="true"></i>
                  <span>Gerenciar Projeto (.certproj)</span>
                </button>

                {onOpenAISettings && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsActionMenuOpen(false);
                      onOpenAISettings();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                  >
                    <i className="fa-solid fa-microchip text-xs text-blue-400" aria-hidden="true"></i>
                    <span>Central de Inteligência Artificial</span>
                  </button>
                )}

                {onOpenValidation && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsActionMenuOpen(false);
                      onOpenValidation();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                  >
                    <i className="fa-solid fa-stamp text-xs text-emerald-400" aria-hidden="true"></i>
                    <span>Validar Autenticidade (QR Code)</span>
                  </button>
                )}
              </div>

              {/* Seção 3: Preferências de Tema */}
              {onToggleTheme && (
                <div className="p-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsActionMenuOpen(false);
                      onToggleTheme();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {theme === 'dark' ? (
                        <i className="fa-solid fa-sun text-xs text-amber-400" aria-hidden="true"></i>
                      ) : (
                        <i className="fa-solid fa-moon text-xs text-slate-300" aria-hidden="true"></i>
                      )}
                      <span>Tema: {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                      Alternar
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Grupo de Ações Desktop (>= lg) */}
      <div className="hidden lg:flex items-center gap-1.5 sm:gap-2 shrink-0">
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
          <span className="hidden sm:inline">Projeto</span>
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
          <span className="hidden xs:inline">Exportar PDF</span>
          <span className="xs:hidden">PDF</span>
        </AppButton>
      </div>
    </header>
  );
};
