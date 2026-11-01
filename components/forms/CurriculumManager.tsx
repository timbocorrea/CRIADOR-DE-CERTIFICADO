import React from 'react';
import CurriculumTable from '../CurriculumTable';
import { CertificateData, CurriculumItem } from '../../types';

interface CurriculumManagerProps {
  data: CertificateData;
  calculatedHours: number;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddCurriculumItem: (item: CurriculumItem) => void;
  onRemoveCurriculumItem: (id: string) => void;
  onUpdateCurriculumItem: (id: string, updatedItem: Partial<CurriculumItem>) => void;
  onSetTotalHoursManual: (hours: string) => void;
  onToggleWorkloadMode: (mode: 'auto' | 'manual') => void;
}

export const CurriculumManager: React.FC<CurriculumManagerProps> = ({
  data,
  calculatedHours,
  onCheckboxChange,
  onSliderChange,
  onAddCurriculumItem,
  onRemoveCurriculumItem,
  onUpdateCurriculumItem,
  onSetTotalHoursManual,
  onToggleWorkloadMode,
}) => {
  return (
    <div className="space-y-6">
      <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-xs font-bold text-gray-600 uppercase mb-4 flex items-center gap-2">
          <i className="fa-solid fa-sliders"></i> Configurações da Grade Curricular
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="showHoursColumn"
              name="showHoursColumn"
              checked={data.showHoursColumn}
              onChange={onCheckboxChange}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
            <label htmlFor="showHoursColumn" className="text-sm font-medium text-gray-800 cursor-pointer">
              Exibir coluna de horas
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Tam. Fonte Conteúdo</label>
                <span className="text-xs font-mono font-bold text-blue-600">{data.versoCurriculumFontSize}px</span>
              </div>
              <input
                type="range"
                name="versoCurriculumFontSize"
                min="8"
                max="24"
                value={data.versoCurriculumFontSize}
                onChange={onSliderChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Espaçamento Linhas</label>
                <span className="text-xs font-mono font-bold text-blue-600">{data.versoRowPadding}px</span>
              </div>
              <input
                type="range"
                name="versoRowPadding"
                min="2"
                max="40"
                value={data.versoRowPadding}
                onChange={onSliderChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>
      </section>

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
    </div>
  );
};
