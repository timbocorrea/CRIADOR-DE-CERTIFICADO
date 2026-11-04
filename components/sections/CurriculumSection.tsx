import React, { useState, useRef, useEffect } from 'react';
import CurriculumTable from '../CurriculumTable';
import { CertificateData, CurriculumItem } from '../../types';
import {
  AppCard,
  AppButton,
  AppBadge,
} from '../ui';

interface CurriculumSectionProps {
  data: CertificateData;
  calculatedHours: number;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddCurriculumItem: (item: CurriculumItem) => void;
  onRemoveCurriculumItem: (id: string) => void;
  onUpdateCurriculumItem: (id: string, updatedItem: Partial<CurriculumItem>) => void;
  onSetTotalHoursManual: (hours: string) => void;
  onToggleWorkloadMode: (mode: 'auto' | 'manual') => void;
  onOpenAISettings?: () => void;
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const CurriculumSection: React.FC<CurriculumSectionProps> = ({
  data,
  calculatedHours,
  onCheckboxChange,
  onSliderChange,
  onAddCurriculumItem,
  onRemoveCurriculumItem,
  onUpdateCurriculumItem,
  onSetTotalHoursManual,
  onToggleWorkloadMode,
  onOpenAISettings,
  onNotify,
}) => {
  const declaredHoursNum = parseFloat(data.totalHours || '0') || 0;
  const isDivergent =
    data.workloadMode === 'manual' &&
    calculatedHours > 0 &&
    declaredHoursNum !== calculatedHours;

  const handleSyncHours = () => {
    onToggleWorkloadMode('auto');
    if (onNotify) {
      onNotify('success', 'Horas Sincronizadas', `Carga horária atualizada para ${calculatedHours}h conforme a soma da grade.`);
    }
  };

  // Submenu suspenso (exibe apenas 1 opção por vez em telas mobile, como na aba Curso)
  type CurriculumSubSection = 'disciplines' | 'workload' | 'formatting';
  const [mobileSubSection, setMobileSubSection] = useState<CurriculumSubSection>('disciplines');
  const [isMobileSubMenuOpen, setIsMobileSubMenuOpen] = useState<boolean>(false);
  const mobileSubMenuRef = useRef<HTMLDivElement>(null);

  const curriculumSubSections: { id: CurriculumSubSection; label: string; description: string; icon: string }[] = [
    {
      id: 'disciplines',
      label: `Disciplinas & Conteúdo Programático (${data.curriculum.length} iten${data.curriculum.length === 1 ? 'm' : 's'})`,
      description: 'Módulos formativos e carga horária impressos no verso',
      icon: 'fa-solid fa-book-open',
    },
    {
      id: 'workload',
      label: `Apuração de Carga Horária (${calculatedHours}h)`,
      description: 'Controle e soma automática das disciplinas ministradas',
      icon: 'fa-solid fa-calculator',
    },
    {
      id: 'formatting',
      label: 'Formatação Visual da Tabela',
      description: 'Fonte, espaçamento de linhas e largura da coluna de horas',
      icon: 'fa-solid fa-table-columns',
    },
  ];

  const activeMobileSubInfo =
    curriculumSubSections.find((s) => s.id === mobileSubSection) || curriculumSubSections[0];

  const [desktopExpanded, setDesktopExpanded] = useState<Record<CurriculumSubSection, boolean>>({
    workload: true,
    disciplines: true,
    formatting: false,
  });
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobileViewport(window.innerWidth < 1024);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (mobileSubMenuRef.current && !mobileSubMenuRef.current.contains(event.target as Node)) {
        setIsMobileSubMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
      {/* Seletor de Submenu Mobile (< lg): Permite selecionar uma opção e exibir apenas o campo dela na tela */}
      <div ref={mobileSubMenuRef} className="lg:hidden relative">
        <button
          type="button"
          onClick={() => setIsMobileSubMenuOpen((prev) => !prev)}
          aria-expanded={isMobileSubMenuOpen}
          aria-haspopup="listbox"
          className="w-full p-3 rounded-xl bg-white dark:bg-slate-800/95 border-2 border-blue-500/70 dark:border-blue-600/80 shadow-sm flex items-center justify-between gap-3 text-left transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm shrink-0 shadow-xs">
              <i className={activeMobileSubInfo.icon} aria-hidden="true"></i>
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Selecionar Opção da Grade (Toque para trocar)
              </span>
              <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {activeMobileSubInfo.label}
              </span>
            </div>
          </div>

          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center shrink-0">
            <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 ${isMobileSubMenuOpen ? 'rotate-180' : ''}`}></i>
          </div>
        </button>

        {isMobileSubMenuOpen && (
          <div
            role="listbox"
            aria-label="Opções da Grade Curricular"
            className="absolute left-0 right-0 mt-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 z-30 space-y-1 animate-fadeIn"
          >
            {curriculumSubSections.map((section) => {
              const isSelected = mobileSubSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setMobileSubSection(section.id);
                    setIsMobileSubMenuOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-lg flex items-center gap-2.5 text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    <i className={section.icon} aria-hidden="true"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{section.label}</p>
                    <p className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {section.description}
                    </p>
                  </div>
                  {isSelected && <i className="fa-solid fa-check text-xs shrink-0" aria-hidden="true"></i>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 1. Banner de Carga Horária e Totalizadores */}
      <div className={mobileSubSection === 'workload' ? 'block' : 'hidden lg:block'}>
      <AppCard
        title="Apuração de Carga Horária"
        description="Controle e soma automática das disciplinas ministradas"
        icon="fa-solid fa-calculator"
        headerClassName="max-lg:hidden"
        contentClassName="p-3.5 sm:p-5"
        badge={
          <AppBadge variant={data.workloadMode === 'manual' ? 'warning' : 'default'} size="sm">
            {data.workloadMode === 'manual' ? 'Manual' : 'Automático'}
          </AppBadge>
        }
        isCollapsible={true}
        isExpanded={isMobileViewport ? true : desktopExpanded.workload}
        onToggleExpand={(exp) => setDesktopExpanded((prev) => ({ ...prev, workload: exp }))}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-blue-50/60 dark:bg-slate-900/60 rounded-xl border border-blue-100 dark:border-blue-950 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                  Soma da Grade Curricular
                </p>
                <p className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-0.5">
                  {calculatedHours} <span className="text-xs font-normal">horas</span>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400/80 mt-0.5">
                  {data.curriculum.length} disciplina(s) cadastrada(s)
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
                <i className="fa-solid fa-list-check" aria-hidden="true"></i>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDivergent
                ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
            }`}>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Total Declarado no Certificado
                  </p>
                </div>
                <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5">
                  {data.totalHours || '0'} <span className="text-xs font-normal">horas</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Modo: {data.workloadMode === 'manual' ? 'Definido manualmente' : 'Sincronizado'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <AppButton
                  type="button"
                  size="xs"
                  variant={data.workloadMode === 'manual' ? 'outline' : 'secondary'}
                  onClick={() => onToggleWorkloadMode(data.workloadMode === 'manual' ? 'auto' : 'manual')}
                  title="Alternar entre modo automático e manual"
                  className="min-h-[28px]"
                >
                  {data.workloadMode === 'manual' ? 'Mudar p/ Auto' : 'Mudar p/ Manual'}
                </AppButton>
              </div>
            </div>
          </div>

          {/* Alerta de Divergência se houver */}
          {isDivergent && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center text-sm shrink-0">
                  <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                </div>
                <div>
                  <p className="font-semibold">A soma da grade ({calculatedHours}h) difere do declarado ({data.totalHours}h)</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    O verso do certificado imprimirá as horas de cada disciplina, enquanto o anverso exibirá o total declarado.
                  </p>
                </div>
              </div>
              <AppButton
                type="button"
                size="xs"
                variant="primary"
                onClick={handleSyncHours}
                className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white min-h-[28px]"
              >
                Sincronizar
              </AppButton>
            </div>
          )}
        </div>
      </AppCard>
      </div>

      {/* 2. Tabela de Disciplinas */}
      <div className={mobileSubSection === 'disciplines' ? 'block' : 'hidden lg:block'}>
      <AppCard
        title="Disciplinas & Conteúdo Programático"
        description="Módulos formativos e carga horária impressos no verso do certificado"
        icon="fa-solid fa-book-open"
        headerClassName="max-lg:hidden"
        contentClassName="p-3.5 sm:p-5"
        badge={
          <AppBadge variant="default" size="sm">
            {data.curriculum.length} itens
          </AppBadge>
        }
        isCollapsible={true}
        isExpanded={isMobileViewport ? true : desktopExpanded.disciplines}
        onToggleExpand={(exp) => setDesktopExpanded((prev) => ({ ...prev, disciplines: exp }))}
      >
        <CurriculumTable
          items={data.curriculum}
          totalHours={data.totalHours}
          showHoursColumn={data.showHoursColumn}
          workloadMode={data.workloadMode}
          calculatedHours={calculatedHours}
          onToggleWorkloadMode={onToggleWorkloadMode}
          onAdd={onAddCurriculumItem}
          onRemove={onRemoveCurriculumItem}
          onUpdate={onUpdateCurriculumItem}
          onUpdateTotal={onSetTotalHoursManual}
          onOpenAISettings={onOpenAISettings}
          onNotify={onNotify}
        />
      </AppCard>
      </div>

      {/* 3. Opções de Apresentação e Tipografia da Grade */}
      <div className={mobileSubSection === 'formatting' ? 'block' : 'hidden lg:block'}>
      <AppCard
        title="Formatação Visual da Tabela"
        description="Ajuste de tipografia, espaçamento e largura da coluna de horas no verso"
        icon="fa-solid fa-table-columns"
        headerClassName="max-lg:hidden"
        contentClassName="p-3.5 sm:p-5"
        isCollapsible={true}
        isExpanded={isMobileViewport ? true : desktopExpanded.formatting}
        onToggleExpand={(exp) => setDesktopExpanded((prev) => ({ ...prev, formatting: exp }))}
      >
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200 select-none">
            <input
              type="checkbox"
              id="showHoursColumn"
              name="showHoursColumn"
              checked={data.showHoursColumn}
              onChange={onCheckboxChange}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span>Exibir coluna de horas das disciplinas</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Largura da Coluna (Horas)</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.hoursColumnWidth || 80}px</span>
              </div>
              <input
                type="range"
                name="hoursColumnWidth"
                min="50"
                max="180"
                value={data.hoursColumnWidth || 80}
                onChange={onSliderChange}
                disabled={!data.showHoursColumn}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Tamanho da Fonte</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.versoCurriculumFontSize}px</span>
              </div>
              <input
                type="range"
                name="versoCurriculumFontSize"
                min="8"
                max="20"
                value={data.versoCurriculumFontSize}
                onChange={onSliderChange}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Espaçamento de Linhas</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.versoRowPadding}px</span>
              </div>
              <input
                type="range"
                name="versoRowPadding"
                min="2"
                max="30"
                value={data.versoRowPadding}
                onChange={onSliderChange}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
              />
            </div>
          </div>
        </div>
      </AppCard>
      </div>
    </div>
  );
};
