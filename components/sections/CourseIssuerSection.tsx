import React, { useState, useRef, useEffect } from 'react';
import { CertificateData, Instructor } from '../../types';
import { WorkloadDivergenceInfo } from '../../utils/workloadCalculator';
import { requestAIEnhanceText } from '../../services/aiService';
import { validateAITextResponse } from '../../utils/aiValidator';
import { MAX_INSTRUCTORS } from '../../hooks/useCertificateData';
import {
  REGISTRY_TYPES,
  parseRegistry,
  buildRegistry,
  formatRegistryForDisplay,
} from '../../utils/professionalRegistry';
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

  // Estado do submenu mobile na aba Curso & Emissor (exibe apenas 1 opção por vez em telas mobile)
  type CourseSubSection = 'general' | 'basetext' | 'instructors' | 'institution';
  const [mobileSubSection, setMobileSubSection] = useState<CourseSubSection>('general');
  const [isMobileSubMenuOpen, setIsMobileSubMenuOpen] = useState<boolean>(false);
  const mobileSubMenuRef = useRef<HTMLDivElement>(null);

  const courseSubSections: { id: CourseSubSection; label: string; description: string; icon: string }[] = [
    {
      id: 'general',
      label: 'Dados Gerais do Curso',
      description: 'Nome do curso, data e carga horária',
      icon: 'fa-solid fa-graduation-cap',
    },
    {
      id: 'basetext',
      label: 'Texto Base do Certificado',
      description: 'Fórmula de certificação impressa no anverso',
      icon: 'fa-solid fa-paragraph',
    },
    {
      id: 'instructors',
      label: `Instrutores e Assinaturas (${data.instructors.length}/${MAX_INSTRUCTORS})`,
      description: 'Profissionais responsáveis pelo treinamento',
      icon: 'fa-solid fa-chalkboard-user',
    },
    {
      id: 'institution',
      label: 'Instituição & Responsável Técnico',
      description: 'Empresa emissora, parceira e registro profissional',
      icon: 'fa-solid fa-building',
    },
  ];

  const activeMobileSubInfo = courseSubSections.find((s) => s.id === mobileSubSection) || courseSubSections[0];

  // Controle de expansão dos 4 cards no desktop (recolhidos por padrão) e no mobile (aberto ao selecionar no menu)
  const [desktopExpanded, setDesktopExpanded] = useState<Record<CourseSubSection, boolean>>({
    general: false,
    basetext: false,
    instructors: false,
    institution: false,
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

  // Estado para novo instrutor
  const [newInstructorName, setNewInstructorName] = useState('');
  const [newInstructorCompetencies, setNewInstructorCompetencies] = useState('');
  const [instructorError, setInstructorError] = useState<string | null>(null);

  // Registro profissional do Responsável Técnico (CREA, CRM, CRO, ...)
  const registry = parseRegistry(data.techResponsibleCompetencies);
  const [useCustomRegistry, setUseCustomRegistry] = useState<boolean>(
    () => !REGISTRY_TYPES.some((t) => t.value === parseRegistry(data.techResponsibleCompetencies).type)
  );
  const [customRegistryType, setCustomRegistryType] = useState<string>(() => {
    const initial = parseRegistry(data.techResponsibleCompetencies).type;
    return REGISTRY_TYPES.some((t) => t.value === initial) ? '' : initial;
  });
  const isKnownRegistryType = !useCustomRegistry && REGISTRY_TYPES.some((t) => t.value === registry.type);
  const registryPreview = formatRegistryForDisplay(data.techResponsibleCompetencies);

  const updateRegistry = (type: string, number: string) => {
    const value = type ? buildRegistry(type, number) : number;
    onChange({
      target: { name: 'techResponsibleCompetencies', value },
    } as unknown as React.ChangeEvent<HTMLInputElement>);
  };

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
                Selecionar Opção de Curso (Toque para trocar)
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
            aria-label="Opções de Curso e Emissor"
            className="absolute left-0 right-0 mt-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 z-30 space-y-1 animate-fadeIn"
          >
            {courseSubSections.map((section) => {
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

      {/* 1. Dados Gerais do Curso */}
      <div className={mobileSubSection === 'general' ? 'block' : 'hidden lg:block'}>
      <AppCard
        title="Dados Gerais do Curso"
        description="Identificação do treinamento e carga horária"
        icon="fa-solid fa-graduation-cap"
        headerClassName="max-lg:hidden"
        contentClassName="p-3.5 sm:p-5"
        isCollapsible={true}
        isExpanded={isMobileViewport ? true : desktopExpanded.general}
        onToggleExpand={(exp) => setDesktopExpanded((prev) => ({ ...prev, general: exp }))}
      >
        <div className="space-y-3">
          {/* Campos Separados para Título e Subtítulo do Certificado */}
          <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                <i className="fa-solid fa-heading text-[11px]" aria-hidden="true"></i>
                Cabeçalho do Certificado (Campos Separados)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <AppInput
                id="certificateTitle"
                name="certificateTitle"
                label="Título Principal"
                placeholder="Ex: CERTIFICADO"
                value={data.certificateTitle ?? 'CERTIFICADO'}
                onChange={onChange}
                icon="fa-solid fa-font"
              />

              <AppInput
                id="certificateSubtitle"
                name="certificateSubtitle"
                label="Subtítulo / Finalidade"
                placeholder="Ex: DE PARTICIPAÇÃO ou DE CONCLUSÃO"
                value={data.certificateSubtitle ?? 'DE PARTICIPAÇÃO'}
                onChange={onChange}
                icon="fa-solid fa-tag"
              />
            </div>

            {/* Atalhos rápidos para o Subtítulo */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
                Sugestões rápidas:
              </span>
              {['DE PARTICIPAÇÃO', 'DE CONCLUSÃO', 'DE CAPACITAÇÃO', 'DE TREINAMENTO', 'DE QUALIFICAÇÃO'].map((preset) => {
                const isSelected = (data.certificateSubtitle ?? 'DE PARTICIPAÇÃO').trim().toUpperCase() === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      const syntheticEvent = {
                        target: { name: 'certificateSubtitle', value: preset },
                      } as React.ChangeEvent<HTMLInputElement>;
                      onChange(syntheticEvent);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

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
      </div>

      {/* 2. Texto Base do Certificado & IA (Recolhível com Menu Suspenso por padrão) */}
      <div className={mobileSubSection === 'basetext' ? 'block' : 'hidden lg:block'}>
      <AppCard
        title="Texto Base do Certificado"
        description="Fórmula de certificação impressa no anverso"
        icon="fa-solid fa-paragraph"
        headerClassName="max-lg:hidden"
        contentClassName="p-3.5 sm:p-5"
        isCollapsible={true}
        isExpanded={isMobileViewport ? true : desktopExpanded.basetext}
        onToggleExpand={(exp) => setDesktopExpanded((prev) => ({ ...prev, basetext: exp }))}
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
      </div>

      {/* 3. Instrutores (1 a 4) */}
      <div className={mobileSubSection === 'instructors' ? 'block' : 'hidden lg:block'}>
      <AppCard
        title="Instrutores e Assinaturas"
        description={`Profissionais responsáveis pelo treinamento (${data.instructors.length} de ${MAX_INSTRUCTORS})`}
        icon="fa-solid fa-chalkboard-user"
        headerClassName="max-lg:hidden"
        contentClassName="p-3.5 sm:p-5"
        isCollapsible={true}
        isExpanded={isMobileViewport ? true : desktopExpanded.instructors}
        onToggleExpand={(exp) => setDesktopExpanded((prev) => ({ ...prev, instructors: exp }))}
        badge={
          <AppBadge variant={data.instructors.length >= MAX_INSTRUCTORS ? 'warning' : 'neutral'} size="sm">
            {data.instructors.length} / {MAX_INSTRUCTORS}
          </AppBadge>
        }
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
      </div>

      {/* 4. Empresa Emissora e Responsável Técnico */}
      <div className={mobileSubSection === 'institution' ? 'block' : 'hidden lg:block'}>
      <AppCard
        title="Instituição & Responsável Técnico"
        description="Identificação jurídica e registro profissional do emissor"
        icon="fa-solid fa-building"
        headerClassName="max-lg:hidden"
        contentClassName="p-3.5 sm:p-5"
        isCollapsible={true}
        isExpanded={isMobileViewport ? true : desktopExpanded.institution}
        onToggleExpand={(exp) => setDesktopExpanded((prev) => ({ ...prev, institution: exp }))}
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

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <div className="h-6 flex items-center">
                    <label htmlFor="techRegistryType" className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                      Registro Profissional (Conselho e Número)
                    </label>
                  </div>
                  <div className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-2">
                    <div className="flex flex-col gap-1.5">
                      <select
                        id="techRegistryType"
                        aria-label="Tipo de registro profissional"
                        value={isKnownRegistryType ? registry.type : 'OUTRO'}
                        onChange={(e) => {
                          if (e.target.value === 'OUTRO') {
                            setUseCustomRegistry(true);
                            updateRegistry(customRegistryType, registry.number);
                          } else {
                            setUseCustomRegistry(false);
                            updateRegistry(e.target.value, registry.number);
                          }
                        }}
                        className="w-full h-10 px-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50"
                      >
                        {REGISTRY_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                        <option value="OUTRO">Outro (digitar sigla)</option>
                      </select>
                      {!isKnownRegistryType && (
                        <AppInput
                          id="techRegistryCustomType"
                          aria-label="Sigla do conselho"
                          placeholder="Sigla (ex: CRMV)"
                          value={customRegistryType}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/[^A-Za-zÀ-ÿ]/g, '').toUpperCase().slice(0, 10);
                            setCustomRegistryType(clean);
                            updateRegistry(clean, registry.number);
                          }}
                        />
                      )}
                    </div>
                    <AppInput
                      id="techResponsibleCompetencies"
                      aria-label="Número do registro"
                      placeholder="Número (ex: 12345/SP)"
                      value={registry.number}
                      onChange={(e) => updateRegistry(isKnownRegistryType ? registry.type : customRegistryType, e.target.value)}
                    />
                  </div>
                  {registryPreview && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      No certificado: <strong className="text-slate-700 dark:text-slate-200">{registryPreview}</strong>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </AppCard>
      </div>
    </div>
  );
};
