import React, { useRef } from 'react';
import { AppBadge } from '../ui';

export type FunctionalArea = 'course_issuer' | 'participants' | 'curriculum' | 'design';

interface AppSidebarProps {
  activeArea: FunctionalArea;
  onSelectArea: (area: FunctionalArea) => void;
  studentsCount: number;
  curriculumCount: number;
  children: React.ReactNode;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeArea,
  onSelectArea,
  studentsCount,
  curriculumCount,
  children,
}) => {
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const areas = [
    {
      id: 'course_issuer' as FunctionalArea,
      label: 'Curso & Emissor',
      shortLabel: 'Curso',
      icon: 'fa-solid fa-graduation-cap',
    },
    {
      id: 'participants' as FunctionalArea,
      label: 'Participantes',
      shortLabel: 'Alunos',
      icon: 'fa-solid fa-users',
      badge: studentsCount > 0 ? (
        <span className="text-xs font-bold px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
          {studentsCount}
        </span>
      ) : null,
    },
    {
      id: 'curriculum' as FunctionalArea,
      label: 'Grade Curricular',
      shortLabel: 'Grade',
      icon: 'fa-solid fa-book-open',
      badge: curriculumCount > 0 ? (
        <span className="text-xs font-bold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          {curriculumCount}
        </span>
      ) : null,
    },
    {
      id: 'design' as FunctionalArea,
      label: 'Design',
      shortLabel: 'Design',
      icon: 'fa-solid fa-palette',
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      targetIndex = (index + 1) % areas.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      targetIndex = (index - 1 + areas.length) % areas.length;
    } else if (e.key === 'Home') {
      targetIndex = 0;
    } else if (e.key === 'End') {
      targetIndex = areas.length - 1;
    }

    if (targetIndex !== -1) {
      e.preventDefault();
      const nextArea = areas[targetIndex];
      onSelectArea(nextArea.id);
      tabButtonRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <aside className="w-full lg:w-[480px] xl:w-[500px] bg-slate-50 dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-full lg:h-[calc(100vh-4rem)] no-print z-20 shrink-0">
      {/* Barra de Navegação das 4 Áreas Funcionais com Semântica WAI-ARIA Tablist */}
      <nav
        className="p-2 sm:p-2.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shrink-0"
        aria-label="Áreas de Edição do Certificado"
      >
        <div
          role="tablist"
          aria-orientation="horizontal"
          aria-label="Navegação entre seções de edição"
          className="grid grid-cols-4 gap-1 sm:gap-1.5"
        >
          {areas.map((area, index) => {
            const isActive = activeArea === area.id;
            return (
              <button
                key={area.id}
                ref={(el) => {
                  tabButtonRefs.current[index] = el;
                }}
                id={`tab-${area.id}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={`panel-${area.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onSelectArea(area.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all select-none min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200/50 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-1">
                  <i className={`${area.icon} text-xs`} aria-hidden="true"></i>
                  {area.badge}
                </div>
                <span className="text-xs leading-tight text-center truncate max-w-full">
                  <span className="hidden sm:inline">{area.label}</span>
                  <span className="sm:hidden">{area.shortLabel}</span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Conteúdo Rolável da Seção Ativa */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {children}
      </div>
    </aside>
  );
};
