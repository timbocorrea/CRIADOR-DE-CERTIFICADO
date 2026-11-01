import React, { useState, useRef } from 'react';
import FormInput from '../FormInput';
import { CertificateData } from '../../types';
import { requestAIEnhanceText } from '../../services/aiService';
import { validateAITextResponse } from '../../utils/aiValidator';
import { WorkloadDivergenceInfo } from '../../utils/workloadCalculator';

interface CourseGeneralFormProps {
  data: CertificateData;
  workloadDivergence: WorkloadDivergenceInfo;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSetTotalHoursManual: (hours: string) => void;
  onToggleWorkloadMode: (mode: 'auto' | 'manual') => void;
  onUpdateBaseText: (text: string) => void;
}

export const CourseGeneralForm: React.FC<CourseGeneralFormProps> = ({
  data,
  workloadDivergence,
  onChange,
  onSetTotalHoursManual,
  onToggleWorkloadMode,
  onUpdateBaseText,
}) => {
  const [isEnhancingText, setIsEnhancingText] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const enhanceTextWithGemini = async () => {
    if (!data.baseText || !data.baseText.trim()) return;
    setIsEnhancingText(true);
    try {
      const result = await requestAIEnhanceText(data.baseText);
      if (!result.success || !result.enhancedText) {
        alert(result.message || 'Serviço de IA indisponível ou não configurado.');
        return;
      }

      const validation = validateAITextResponse(data.baseText, result.enhancedText);
      if (!validation.valid) {
        alert(validation.error || 'A resposta da IA não atendeu aos critérios de validação de variáveis.');
        return;
      }

      onUpdateBaseText(validation.sanitizedText || result.enhancedText!);
    } catch (error) {
      console.error('Erro ao aprimorar texto:', error);
      alert('Ocorreu um erro ao processar a resposta da IA.');
    } finally {
      setIsEnhancingText(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
        <i className="fa-solid fa-book"></i> Curso & Carga Horária
      </h2>

      <FormInput
        label="Nome do Curso"
        name="courseName"
        value={data.courseName}
        onChange={onChange}
      />

      <div className="grid grid-cols-2 gap-2">
        <FormInput
          label="Data Conclusão"
          name="courseDate"
          value={data.courseDate}
          onChange={onChange}
        />

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Carga Horária Total</label>
            <button
              type="button"
              onClick={() => onToggleWorkloadMode(data.workloadMode === 'auto' ? 'manual' : 'auto')}
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold border transition-all ${
                data.workloadMode === 'auto'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}
              title={data.workloadMode === 'auto' ? 'Calculado automaticamente da grade. Clique para modo manual.' : 'Valor manual informado. Clique para modo automático.'}
            >
              {data.workloadMode === 'auto' ? 'Auto (Soma)' : 'Manual'}
            </button>
          </div>
          <input
            type="text"
            name="totalHours"
            value={data.totalHours}
            onChange={(e) => onSetTotalHoursManual(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ex: 40"
          />
        </div>
      </div>

      {/* Alerta de Divergência de Carga Horária (CM-ALTO-005) */}
      {workloadDivergence.hasDivergence && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2 animate-fadeIn">
          <i className="fa-solid fa-triangle-exclamation mt-0.5 text-amber-600"></i>
          <div>
            <p className="font-bold">Aviso de Carga Horária:</p>
            <p>{workloadDivergence.message}</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Texto Base do Certificado</label>
        <textarea
          ref={textareaRef}
          name="baseText"
          value={data.baseText}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm h-36 text-xs font-mono bg-white outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={enhanceTextWithGemini}
          disabled={isEnhancingText}
          className="mt-1 flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          <i className="fa-solid fa-wand-magic-sparkles"></i>
          {isEnhancingText ? 'Aprimorando com IA...' : 'Polir com IA'}
        </button>
      </div>
    </div>
  );
};
