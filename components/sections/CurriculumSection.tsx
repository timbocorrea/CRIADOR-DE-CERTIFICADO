import React from 'react';
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

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Banner de Carga Horária e Totalizadores */}
      <AppCard
        title="Apuração de Carga Horária"
        description="Controle e soma automática das disciplinas ministradas"
        icon="fa-solid fa-calculator"
        badge={
          <AppBadge variant={data.workloadMode === 'manual' ? 'warning' : 'default'} size="sm">
            {data.workloadMode === 'manual' ? 'Manual' : 'Automático'}
          </AppBadge>
        }
        defaultExpanded={true}
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

      {/* 2. Tabela de Disciplinas */}
      <AppCard
        title="Disciplinas & Conteúdo Programático"
        description="Módulos formativos e carga horária impressos no verso do certificado"
        icon="fa-solid fa-book-open"
        badge={
          <AppBadge variant="default" size="sm">
            {data.curriculum.length} itens
          </AppBadge>
        }
        defaultExpanded={true}
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
        />
      </AppCard>

      {/* 3. Opções de Apresentação e Tipografia da Grade */}
      <AppCard
        title="Formatação Visual da Tabela"
        description="Ajuste de tipografia, espaçamento e largura da coluna de horas no verso"
        icon="fa-solid fa-table-columns"
        isCollapsible={true}
        defaultExpanded={false}
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
  );
};
