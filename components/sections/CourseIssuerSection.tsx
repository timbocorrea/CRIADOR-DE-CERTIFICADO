import React, { useState, useRef } from 'react';
import { CertificateData, Instructor } from '../../types';
import { WorkloadDivergenceInfo } from '../../utils/workloadCalculator';
import { requestAIEnhanceText } from '../../services/aiService';
import { validateAITextResponse } from '../../utils/aiValidator';
import { MAX_INSTRUCTORS } from '../../hooks/useCertificateData';
import {
  AppCard,
  AppInput,
  AppTextarea,
  AppButton,
  AppBadge,
} from '../ui';

interface CourseIssuerSectionProps {
  data: CertificateData;
  workloadDivergence: WorkloadDivergenceInfo;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetTotalHoursManual: (hours: string) => void;
  onToggleWorkloadMode: (mode: 'auto' | 'manual') => void;
  onUpdateBaseText: (text: string) => void;
  onAddInstructor: (name: string, competencies: string) => { success: boolean; error?: string };
  onRemoveInstructor: (id: string) => void;
  onOpenAISettings?: () => void;
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const CourseIssuerSection: React.FC<CourseIssuerSectionProps> = ({
  data,
  workloadDivergence,
  onChange,
  onCheckboxChange,
  onSetTotalHoursManual,
  onToggleWorkloadMode,
  onUpdateBaseText,
  onAddInstructor,
  onRemoveInstructor,
  onOpenAISettings,
  onNotify,
}) => {
  // Estado para IA
  const [isEnhancingText, setIsEnhancingText] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Estado para novo instrutor
  const [newInstructorName, setNewInstructorName] = useState('');
  const [newInstructorCompetencies, setNewInstructorCompetencies] = useState('');
  const [instructorError, setInstructorError] = useState<string | null>(null);

  // Tags disponíveis para interpolação
  const availableTags = [
    { label: 'Nome', tag: '{{NOME}}' },
    { label: 'CPF', tag: '{{CPF}}' },
    { label: 'Curso', tag: '{{CURSO}}' },
    { label: 'Data', tag: '{{DATA}}' },
    { label: 'Horas', tag: '{{CARGA_HORARIA}}' },
    { label: 'Empresa', tag: '{{RAZAO_SOCIAL}}' },
    { label: 'CNPJ', tag: '{{CNPJ}}' },
    { label: 'Endereço', tag: '{{ENDERECO}}' },
  ];

  const handleInsertTag = (tag: string) => {
    if (!textareaRef.current) {
      onUpdateBaseText(`${data.baseText || ''} ${tag}`);
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const current = data.baseText || '';
    const updated = current.substring(0, start) + tag + current.substring(end);
    onUpdateBaseText(updated);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  const handleEnhanceWithAI = async () => {
    if (!data.baseText || !data.baseText.trim()) {
      if (onNotify) onNotify('warning', 'Texto vazio', 'Digite um texto base antes de solicitar o polimento.');
      return;
    }

    setIsEnhancingText(true);
    try {
      const result = await requestAIEnhanceText(data.baseText);
      if (!result.success || !result.enhancedText) {
        if (result.error === 'NO_KEY_CONFIGURED' && onOpenAISettings) {
          onOpenAISettings();
        }
        if (onNotify) {
          onNotify('error', 'Falha na IA', result.message || 'Serviço de IA indisponível ou chave não configurada.');
        }
        return;
      }

      const validation = validateAITextResponse(data.baseText, result.enhancedText);
      if (!validation.valid) {
        if (onNotify) {
          onNotify('error', 'Resposta Rejeitada', validation.error || 'O texto gerado pela IA foi considerado inválido.');
        }
        return;
      }

      onUpdateBaseText(result.enhancedText);
      if (onNotify) {
        onNotify('success', 'Texto Aprimorado', 'O texto do certificado foi polido com sucesso pela IA.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (onNotify) onNotify('error', 'Erro inesperado na IA', msg);
    } finally {
      setIsEnhancingText(false);
    }
  };

  const handleAddInstructorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInstructorError(null);

    if (!newInstructorName.trim()) {
      setInstructorError('Informe o nome do instrutor.');
      return;
    }

    const res = onAddInstructor(newInstructorName.trim(), newInstructorCompetencies.trim());
    if (res.success) {
      setNewInstructorName('');
      setNewInstructorCompetencies('');
      if (onNotify) onNotify('success', 'Instrutor Adicionado', 'Novo instrutor registrado com sucesso.');
    } else {
      setInstructorError(res.error || 'Erro ao adicionar instrutor.');
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Dados Gerais do Curso */}
      <AppCard
        title="Dados Gerais do Curso"
        description="Identificação do treinamento e carga horária"
        icon="fa-solid fa-graduation-cap"
        defaultExpanded={true}
      >
        <div className="space-y-3">
          <AppInput
            id="courseName"
            name="courseName"
            label="Nome do Curso"
            placeholder="Ex: NR-35 Trabalho em Altura"
            value={data.courseName}
            onChange={onChange}
            required
            icon="fa-solid fa-book"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            {/* Coluna 1: Data de Conclusão */}
            <div className="flex flex-col gap-1.5">
              <div className="h-6 flex items-center justify-between">
                <label htmlFor="courseDate" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Data de Conclusão / Período
                </label>
              </div>
              <AppInput
                id="courseDate"
                name="courseDate"
                placeholder="Ex: 30 de Outubro de 2026"
                value={data.courseDate}
                onChange={onChange}
                icon="fa-solid fa-calendar"
              />
            </div>

            {/* Coluna 2: Carga Horária com alinhamento pixel-perfect */}
            <div className="flex flex-col gap-1.5">
              <div className="h-6 flex items-center justify-between">
                <label htmlFor="totalHours" className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate pr-1">
                  Carga Horária (Horas)
                </label>
                <button
                  type="button"
                  onClick={() => onToggleWorkloadMode(data.workloadMode === 'manual' ? 'auto' : 'manual')}
                  className={`shrink-0 h-5 px-1.5 text-[10px] font-bold rounded-md flex items-center gap-1 transition-all border whitespace-nowrap ${
                    data.workloadMode === 'manual'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/60'
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/60'
                  }`}
                  title={
                    data.workloadMode === 'manual'
                      ? 'Modo manual ativo: o valor não muda com a grade.'
                      : 'Modo automático: soma das horas da grade curricular.'
                  }
                >
                  <i className={`fa-solid ${data.workloadMode === 'manual' ? 'fa-lock' : 'fa-calculator'} text-[9px]`}></i>
                  <span>{data.workloadMode === 'manual' ? 'Manual' : 'Soma Auto'}</span>
                </button>
              </div>

              <AppInput
                id="totalHours"
                name="totalHours"
                type="text"
                placeholder="Ex: 40"
                value={data.totalHours}
                onChange={(e) => {
                  onSetTotalHoursManual(e.target.value);
                }}
                icon="fa-solid fa-clock"
                className={data.workloadMode === 'manual' ? 'border-amber-300 dark:border-amber-600' : ''}
              />
            </div>
          </div>

          {/* Aviso de Divergência de Carga Horária */}
          {workloadDivergence.isDivergent && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-start justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 animate-fadeIn">
              <div className="flex items-start gap-2">
                <i className="fa-solid fa-triangle-exclamation text-amber-600 dark:text-amber-400 mt-0.5"></i>
                <div>
                  <p className="font-semibold">Carga horária declarada difere da grade</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                    Declarado: <strong>{data.totalHours}h</strong> | Soma da grade: <strong>{workloadDivergence.calculatedHours}h</strong>
                  </p>
                </div>
              </div>
              <AppButton
                type="button"
                size="xs"
                variant="outline"
                onClick={() => onToggleWorkloadMode('auto')}
                className="shrink-0 text-amber-800 dark:text-amber-200 border-amber-400 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/60"
              >
                Sincronizar
              </AppButton>
            </div>
          )}
        </div>
      </AppCard>

      {/* 2. Texto Base do Certificado & IA (Recolhível com Menu Suspenso por padrão) */}
      <AppCard
        title="Texto Base do Certificado"
        description="Fórmula de certificação impressa no anverso"
        icon="fa-solid fa-paragraph"
        isCollapsible={true}
        defaultExpanded={false}
        badge={
          <AppBadge variant="info" size="sm" icon="fa-solid fa-wand-magic-sparkles">
            Automático
          </AppBadge>
        }
      >
        <div className="space-y-3">
          <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 rounded-xl text-xs text-blue-900 dark:text-blue-300 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-circle-info text-blue-600 dark:text-blue-400"></i>
              <span>Preenchimento dinâmico automático com as variáveis do aluno e curso.</span>
            </span>
            <AppButton
              type="button"
              size="xs"
              variant="outline"
              icon="fa-solid fa-wand-magic-sparkles"
              isLoading={isEnhancingText}
              onClick={handleEnhanceWithAI}
              title="Aprimorar redação com IA Gemini"
            >
              Polir com IA
            </AppButton>
          </div>

          <AppTextarea
            id="baseText"
            name="baseText"
            ref={textareaRef}
            rows={4}
            value={data.baseText}
            onChange={onChange}
            placeholder="Certificamos que {{NOME}}, inscrito no CPF sob o nº {{CPF}}..."
            helperText="Utilize as variáveis abaixo para preencher os dados dos participantes dinamicamente."
          />

          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Variáveis Disponíveis (Clique para Inserir)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => handleInsertTag(item.tag)}
                  className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-700 dark:hover:text-blue-300 text-slate-700 dark:text-slate-200 font-mono rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                >
                  {item.tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </AppCard>

      {/* 3. Instrutores (1 a 4) */}
      <AppCard
        title="Instrutores e Assinaturas"
        description={`Profissionais responsáveis pelo treinamento (${data.instructors.length} de ${MAX_INSTRUCTORS})`}
        icon="fa-solid fa-chalkboard-user"
        badge={
          <AppBadge variant={data.instructors.length >= MAX_INSTRUCTORS ? 'warning' : 'neutral'} size="sm">
            {data.instructors.length} / {MAX_INSTRUCTORS}
          </AppBadge>
        }
        defaultExpanded={true}
      >
        <div className="space-y-4">
          {/* Lista de Instrutores Cadastrados */}
          {data.instructors.length === 0 ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
              Nenhum instrutor cadastrado. Adicione pelo menos um instrutor para as assinaturas do certificado.
            </div>
          ) : (
            <div className="space-y-2">
              {data.instructors.map((inst, idx) => (
                <div
                  key={inst.id}
                  className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {idx + 1}. {inst.name}
                    </p>
                    {inst.competencies && (
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate mt-0.5">
                        {inst.competencies}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveInstructor(inst.id)}
                    className="w-7 h-7 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center transition-colors"
                    title="Remover instrutor"
                    aria-label={`Remover ${inst.name}`}
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Formulário para Novo Instrutor */}
          {data.instructors.length < MAX_INSTRUCTORS && (
            <div className="p-3 bg-blue-50/50 dark:bg-slate-900/60 rounded-xl border border-blue-100 dark:border-slate-800 space-y-2.5">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <i className="fa-solid fa-user-plus text-blue-600 dark:text-blue-400"></i>
                Adicionar Instrutor
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <AppInput
                  placeholder="Nome Completo do Instrutor"
                  value={newInstructorName}
                  onChange={(e) => setNewInstructorName(e.target.value)}
                />
                <AppInput
                  placeholder="Competências / Qualificação"
                  value={newInstructorCompetencies}
                  onChange={(e) => setNewInstructorCompetencies(e.target.value)}
                />
              </div>

              {instructorError && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {instructorError}
                </p>
              )}

              <div className="flex justify-end pt-1">
                <AppButton
                  type="button"
                  size="sm"
                  variant="primary"
                  icon="fa-solid fa-plus"
                  onClick={handleAddInstructorSubmit}
                >
                  Incluir Instrutor
                </AppButton>
              </div>
            </div>
          )}
        </div>
      </AppCard>

      {/* 4. Empresa Emissora e Responsável Técnico */}
      <AppCard
        title="Instituição & Responsável Técnico"
        description="Identificação jurídica e registro profissional do emissor"
        icon="fa-solid fa-building"
        isCollapsible={true}
        defaultExpanded={false}
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-800/80 space-y-3">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Empresa Emissora (Frente do Certificado)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AppInput
                id="companyName"
                name="companyName"
                label="Razão Social"
                placeholder="Ex: Treinamentos Corporativos S/A"
                value={data.companyName}
                onChange={onChange}
              />
              <AppInput
                id="companyCnpj"
                name="companyCnpj"
                label="CNPJ"
                placeholder="00.000.000/0000-00"
                value={data.companyCnpj}
                onChange={onChange}
              />
            </div>
            <AppInput
              id="address"
              name="address"
              label="Endereço Completo"
              placeholder="Rua, Número, Bairro, Cidade - UF"
              value={data.address}
              onChange={onChange}
            />
          </div>

          <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-800/80 space-y-3">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Empresa Prestadora / Parceira (Verso)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AppInput
                id="providerName"
                name="providerName"
                label="Nome da Prestadora"
                value={data.providerName}
                onChange={onChange}
              />
              <AppInput
                id="providerCnpj"
                name="providerCnpj"
                label="CNPJ da Prestadora"
                value={data.providerCnpj}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between h-6">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Responsável Técnico
              </p>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-200 select-none">
                <input
                  type="checkbox"
                  name="showTechResponsible"
                  checked={data.showTechResponsible}
                  onChange={onCheckboxChange}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span>Exibir no Verso</span>
              </label>
            </div>

            {data.showTechResponsible && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex flex-col gap-1.5">
                  <div className="h-6 flex items-center">
                    <label htmlFor="techResponsibleName" className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                      Nome do Responsável Técnico
                    </label>
                  </div>
                  <AppInput
                    id="techResponsibleName"
                    name="techResponsibleName"
                    placeholder="Ex: Eng. Roberto Santos"
                    value={data.techResponsibleName}
                    onChange={onChange}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="h-6 flex items-center">
                    <label htmlFor="techResponsibleCompetencies" className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                      Registro Profissional / CREA
                    </label>
                  </div>
                  <AppInput
                    id="techResponsibleCompetencies"
                    name="techResponsibleCompetencies"
                    placeholder="Ex: CREA 12345/D"
                    value={data.techResponsibleCompetencies}
                    onChange={onChange}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </AppCard>
    </div>
  );
};
