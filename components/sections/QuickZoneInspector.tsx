import React from 'react';
import { CertificateData, CertificateElementZone, Student, CurriculumItem } from '../../types';
import { AppCard, AppInput, AppButton, AppBadge } from '../ui';
import CurriculumTable from '../CurriculumTable';
import { AVAILABLE_VARIABLES } from './DesignSection';
import { readImageAsBase64 } from '../../utils/imageManager';
import { MAX_INSTRUCTORS } from '../../hooks/useCertificateData';

interface QuickZoneInspectorProps {
  zone: CertificateElementZone;
  data: CertificateData;
  currentStudent: Student | null;
  calculatedHours: number;
  onClose: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetTextAlign: (align: 'left' | 'center' | 'right' | 'justify') => void;
  onToggleBoldVariable: (variable: string) => void;
  onSetImageField: (field: 'bgImage' | 'signatureImage' | 'digitalSeal', base64: string | null) => void;
  onUpdateBaseText: (text: string) => void;
  onUpdateStudentDisplayName: (id: string, name: string) => void;
  onAddInstructor: (name: string, competencies: string) => { success: boolean; error?: string };
  onRemoveInstructor: (id: string) => void;
  onAddCurriculumItem: (item: CurriculumItem) => void;
  onRemoveCurriculumItem: (id: string) => void;
  onUpdateCurriculumItem: (id: string, updatedItem: Partial<CurriculumItem>) => void;
  onSetTotalHoursManual: (hours: string) => void;
  onToggleWorkloadMode: (mode: 'auto' | 'manual') => void;
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

const ZONE_METADATA: Record<
  CertificateElementZone,
  { title: string; subtitle: string; icon: string; badge: string }
> = {
  front_header: {
    title: 'Cabeçalho do Certificado (Título e Subtítulo)',
    subtitle: 'Textos, tamanhos de fonte, espaçamento e posição (V/H) do cabeçalho',
    icon: 'fa-solid fa-heading',
    badge: 'Frente',
  },
  front_highlight_name: {
    title: 'Nome de Destaque (Caligrafia)',
    subtitle: 'Visibilidade, caligrafia do aluno, tamanho da fonte e posição (V/H)',
    icon: 'fa-solid fa-signature',
    badge: 'Frente',
  },
  front_body: {
    title: 'Corpo do Texto do Certificado',
    subtitle: 'Texto base, alinhamento, variáveis em negrito, fonte e posição (V/H)',
    icon: 'fa-solid fa-paragraph',
    badge: 'Frente',
  },
  front_signatures: {
    title: 'Assinaturas, Instrutores e Selo',
    subtitle: 'Instrutores, responsável técnico, imagens de assinatura/selo, fonte e posição (V/H)',
    icon: 'fa-solid fa-pen-nib',
    badge: 'Frente',
  },
  front_footer: {
    title: 'Rodapé Institucional (Frente)',
    subtitle: 'Razão social, CNPJ, endereço, tamanho da fonte e posição (V/H)',
    icon: 'fa-solid fa-building',
    badge: 'Frente',
  },
  verso_header: {
    title: 'Cabeçalho do Verso (Conteúdo Programático)',
    subtitle: 'Tamanho da fonte, margem superior e posição (V/H) do título do verso',
    icon: 'fa-solid fa-heading',
    badge: 'Verso',
  },
  verso_institution: {
    title: 'Coluna Institucional & Curso (Verso)',
    subtitle: 'Nome do curso, empresa realizadora, largura da coluna, fonte e posição (V/H)',
    icon: 'fa-solid fa-building-columns',
    badge: 'Verso',
  },
  verso_curriculum: {
    title: 'Tabela da Grade Curricular (Verso)',
    subtitle: 'Disciplinas, coluna de horas, tamanho da fonte, espaçamento e posição (V/H)',
    icon: 'fa-solid fa-table-list',
    badge: 'Verso',
  },
  verso_footer: {
    title: 'Rodapé Institucional (Verso)',
    subtitle: 'Empresa emissora, tamanho da fonte, margem inferior e posição (V/H)',
    icon: 'fa-solid fa-shoe-prints',
    badge: 'Verso',
  },
};

export const QuickZoneInspector: React.FC<QuickZoneInspectorProps> = ({
  zone,
  data,
  currentStudent,
  calculatedHours,
  onClose,
  onChange,
  onCheckboxChange,
  onSliderChange,
  onSetTextAlign,
  onToggleBoldVariable,
  onSetImageField,
  onUpdateBaseText,
  onUpdateStudentDisplayName,
  onAddInstructor,
  onRemoveInstructor,
  onAddCurriculumItem,
  onRemoveCurriculumItem,
  onUpdateCurriculumItem,
  onSetTotalHoursManual,
  onToggleWorkloadMode,
  onNotify,
}) => {
  const meta = ZONE_METADATA[zone];
  const [newInstName, setNewInstName] = React.useState('');
  const [newInstComp, setNewInstComp] = React.useState('');

  const handleUploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'bgImage' | 'signatureImage' | 'digitalSeal',
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await readImageAsBase64(file);
      onSetImageField(field, base64);
      onNotify?.('success', 'Imagem Carregada', `${label} atualizada com sucesso.`);
    } catch (err: unknown) {
      onNotify?.('error', 'Falha no Upload', err instanceof Error ? err.message : String(err));
    }
  };

  const renderOffsetPair = (
    label: string,
    verticalName: keyof CertificateData,
    horizontalName: keyof CertificateData,
    vMin = -250,
    vMax = 250,
    hMin = -300,
    hMax = 300
  ) => {
    const vVal = Number(data[verticalName] ?? 0);
    const hVal = Number(data[horizontalName] ?? 0);
    return (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <i className="fa-solid fa-up-down-left-right text-blue-600 dark:text-blue-400"></i>
          <span>{label}</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Vertical (Cima/Baixo)</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                {vVal > 0 ? `+${vVal}` : vVal}px
              </span>
            </div>
            <input
              type="range"
              name={String(verticalName)}
              min={vMin}
              max={vMax}
              value={vVal}
              onChange={onSliderChange}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Horizontal (Esq/Dir)</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                {hVal > 0 ? `+${hVal}` : hVal}px
              </span>
            </div>
            <input
              type="range"
              name={String(horizontalName)}
              min={hMin}
              max={hMax}
              value={hVal}
              onChange={onSliderChange}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Barra de Destaque: Elemento Selecionado Diretamente no Preview */}
      <div className="p-3 rounded-xl bg-blue-600 text-white shadow-md flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-sm shrink-0">
            <i className={meta.icon} aria-hidden="true"></i>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                Editando Campo Selecionado no Preview
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase bg-white/20 rounded">
                {meta.badge}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold truncate">{meta.title}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1.5 rounded-lg bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs transition-colors cursor-pointer"
          title="Voltar para o menu de abas padrão"
        >
          <i className="fa-solid fa-xmark"></i>
          <span>Fechar</span>
        </button>
      </div>

      {/* CONTEÚDO ESPECÍFICO DA ZONA SELECIONADA */}
      <AppCard
        title={meta.title}
        description={meta.subtitle}
        icon={meta.icon}
        headerClassName="hidden"
        contentClassName="p-3.5 sm:p-5"
      >
        {/* 1. CABEÇALHO DA FRENTE (TÍTULO E SUBTÍTULO) */}
        {zone === 'front_header' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AppInput
                id="inspector-certificateTitle"
                name="certificateTitle"
                label="Título Principal"
                placeholder="Ex: CERTIFICADO"
                value={data.certificateTitle ?? 'CERTIFICADO'}
                onChange={onChange}
                icon="fa-solid fa-font"
              />
              <AppInput
                id="inspector-certificateSubtitle"
                name="certificateSubtitle"
                label="Subtítulo (Modalidade)"
                placeholder="Ex: DE PARTICIPAÇÃO ou DE CONCLUSÃO"
                value={data.certificateSubtitle ?? 'DE PARTICIPAÇÃO'}
                onChange={onChange}
                icon="fa-solid fa-text-Width"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Fonte do Título</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.titleFontSize}px</span>
                </div>
                <input
                  type="range"
                  name="titleFontSize"
                  min="20"
                  max="150"
                  value={data.titleFontSize}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Fonte do Subtítulo</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.subtitleFontSize}px</span>
                </div>
                <input
                  type="range"
                  name="subtitleFontSize"
                  min="12"
                  max="48"
                  value={data.subtitleFontSize}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Margem Superior Topo</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.frontHeaderPadding}px</span>
                </div>
                <input
                  type="range"
                  name="frontHeaderPadding"
                  min="0"
                  max="300"
                  value={data.frontHeaderPadding}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {renderOffsetPair(
              'Posição do Título Principal',
              'titleVerticalOffset',
              'titleHorizontalOffset'
            )}

            {renderOffsetPair(
              'Posição do Subtítulo',
              'subtitleVerticalOffset',
              'subtitleHorizontalOffset',
              -150,
              150,
              -300,
              300
            )}
          </div>
        )}

        {/* 2. NOME DE DESTAQUE (CALIGRAFIA) */}
        {zone === 'front_highlight_name' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200 dark:border-blue-900 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Exibir Nome de Destaque no Certificado
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Desmarque para ocultar o nome cursivo e deixar apenas o corpo do texto
                </p>
              </div>
              <input
                type="checkbox"
                name="showHighlightName"
                checked={data.showHighlightName !== false}
                onChange={onCheckboxChange}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {currentStudent && (
              <AppInput
                id="inspector-studentDisplayName"
                label={`Texto Caligrafado de Destaque (${currentStudent.name})`}
                placeholder="Deixe em branco para usar o Primeiro e Último nome automático"
                value={currentStudent.displayName || ''}
                onChange={(e) => onUpdateStudentDisplayName(currentStudent.id, e.target.value)}
                icon="fa-solid fa-pen-fancy"
              />
            )}

            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-slate-700 dark:text-slate-200 font-medium">Tamanho da Fonte Caligrafada</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.highlightNameFontSize}px</span>
              </div>
              <input
                type="range"
                name="highlightNameFontSize"
                min="20"
                max="150"
                value={data.highlightNameFontSize}
                onChange={onSliderChange}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {renderOffsetPair(
              'Posição do Nome de Destaque',
              'highlightNameVerticalOffset',
              'highlightNameHorizontalOffset'
            )}
          </div>
        )}

        {/* 3. CORPO DO TEXTO DO CERTIFICADO */}
        {zone === 'front_body' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Texto Base do Certificado
              </label>
              <textarea
                rows={4}
                value={data.baseText}
                onChange={(e) => onUpdateBaseText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Alinhamento e Tamanho da Fonte */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                  Alinhamento do Texto
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { align: 'left', label: 'Esq.', icon: 'fa-align-left' },
                    { align: 'center', label: 'Centro', icon: 'fa-align-center' },
                    { align: 'right', label: 'Dir.', icon: 'fa-align-right' },
                    { align: 'justify', label: 'Just.', icon: 'fa-align-justify' },
                  ].map((item) => (
                    <button
                      key={item.align}
                      type="button"
                      onClick={() => onSetTextAlign(item.align as 'left' | 'center' | 'right' | 'justify')}
                      className={`py-2 px-1 rounded-lg text-[11px] font-semibold flex flex-col items-center gap-1 border transition-all ${
                        data.frontTextAlign === item.align
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <i className={`fa-solid ${item.icon} text-xs`}></i>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="text-slate-700 dark:text-slate-200 font-medium">Tamanho da Fonte</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.bodyFontSize || 24}px</span>
                  </div>
                  <input
                    type="range"
                    name="bodyFontSize"
                    min="12"
                    max="42"
                    value={data.bodyFontSize || 24}
                    onChange={onSliderChange}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="text-slate-700 dark:text-slate-200 font-medium">Margem Lateral do Certificado</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.frontSidePadding}px</span>
                  </div>
                  <input
                    type="range"
                    name="frontSidePadding"
                    min="20"
                    max="250"
                    value={data.frontSidePadding}
                    onChange={onSliderChange}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>

            {renderOffsetPair(
              'Posição do Corpo do Texto',
              'bodyVerticalOffset',
              'bodyHorizontalOffset'
            )}

            {/* Variáveis em Negrito */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Variáveis em Negrito
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {AVAILABLE_VARIABLES.map((v) => {
                  const isChecked = data.boldVariables.includes(v.value);
                  return (
                    <label
                      key={v.value}
                      className={`p-2 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 cursor-pointer ${
                        isChecked
                          ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleBoldVariable(v.value)}
                        className="rounded text-blue-600 h-3.5 w-3.5"
                      />
                      <span className="truncate">{v.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. BLOCO DE ASSINATURAS, INSTRUTORES E SELO */}
        {zone === 'front_signatures' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Tamanho da Fonte (Assinaturas)</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.signatureFontSize}px</span>
                </div>
                <input
                  type="range"
                  name="signatureFontSize"
                  min="8"
                  max="28"
                  value={data.signatureFontSize}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Recuo Lateral das Assinaturas</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.signaturesHorizontalPadding}px</span>
                </div>
                <input
                  type="range"
                  name="signaturesHorizontalPadding"
                  min="0"
                  max="150"
                  value={data.signaturesHorizontalPadding}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {renderOffsetPair(
              'Posição do Bloco de Assinaturas',
              'signaturesVerticalOffset',
              'signaturesHorizontalOffset'
            )}

            {/* Instrutores Rápidos */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Instrutores ({data.instructors.length}/{MAX_INSTRUCTORS})
                </span>
              </div>

              {data.instructors.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{inst.name}</p>
                    {inst.competencies && (
                      <p className="text-[11px] text-slate-500 truncate">{inst.competencies}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveInstructor(inst.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remover instrutor"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              ))}

              {data.instructors.length < MAX_INSTRUCTORS && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <AppInput
                    placeholder="Nome do Instrutor"
                    value={newInstName}
                    onChange={(e) => setNewInstName(e.target.value)}
                  />
                  <AppInput
                    placeholder="Qualificação / Registro"
                    value={newInstComp}
                    onChange={(e) => setNewInstComp(e.target.value)}
                  />
                  <AppButton
                    type="button"
                    variant="primary"
                    size="sm"
                    icon="fa-solid fa-plus"
                    onClick={() => {
                      if (!newInstName.trim()) return;
                      const res = onAddInstructor(newInstName.trim(), newInstComp.trim());
                      if (res.success) {
                        setNewInstName('');
                        setNewInstComp('');
                      }
                    }}
                  >
                    Adicionar
                  </AppButton>
                </div>
              )}
            </div>

            {/* Responsável Técnico */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Responsável Técnico na Frente
                </span>
                <input
                  type="checkbox"
                  name="showTechResponsible"
                  checked={data.showTechResponsible}
                  onChange={onCheckboxChange}
                  className="w-4 h-4 rounded text-blue-600"
                />
              </div>
              {data.showTechResponsible && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <AppInput
                    name="techResponsibleName"
                    label="Nome do Resp. Técnico"
                    value={data.techResponsibleName}
                    onChange={onChange}
                  />
                  <AppInput
                    name="techResponsibleCompetencies"
                    label="Registro (Ex: CREA 12345)"
                    value={data.techResponsibleCompetencies}
                    onChange={onChange}
                  />
                </div>
              )}
            </div>

            {/* Upload Rápido de Assinatura e Selo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                  Assinatura Digital
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {data.signatureImage && (
                    <button
                      type="button"
                      onClick={() => onSetImageField('signatureImage', null)}
                      className="text-[11px] text-red-600 px-1.5"
                    >
                      Remover
                    </button>
                  )}
                  <label className="cursor-pointer px-2.5 py-1 bg-white dark:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-600">
                    <span>{data.signatureImage ? 'Trocar' : 'Enviar'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImage(e, 'signatureImage', 'Assinatura')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                  Selo / Carimbo
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {data.digitalSeal && (
                    <button
                      type="button"
                      onClick={() => onSetImageField('digitalSeal', null)}
                      className="text-[11px] text-red-600 px-1.5"
                    >
                      Remover
                    </button>
                  )}
                  <label className="cursor-pointer px-2.5 py-1 bg-white dark:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-600">
                    <span>{data.digitalSeal ? 'Trocar' : 'Enviar'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImage(e, 'digitalSeal', 'Selo')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. RODAPÉ DA FRENTE */}
        {zone === 'front_footer' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AppInput
                name="companyName"
                label="Razão Social / Instituição Emissora"
                value={data.companyName}
                onChange={onChange}
                icon="fa-solid fa-building"
              />
              <AppInput
                name="companyCnpj"
                label="CNPJ da Instituição"
                value={data.companyCnpj}
                onChange={onChange}
                icon="fa-solid fa-id-card"
              />
            </div>

            <AppInput
              name="address"
              label="Endereço Institucional"
              value={data.address}
              onChange={onChange}
              icon="fa-solid fa-location-dot"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Tamanho da Fonte do Rodapé</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.footerFontSize}px</span>
                </div>
                <input
                  type="range"
                  name="footerFontSize"
                  min="6"
                  max="20"
                  value={data.footerFontSize}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Margem Inferior do Rodapé</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.frontFooterPadding}px</span>
                </div>
                <input
                  type="range"
                  name="frontFooterPadding"
                  min="0"
                  max="250"
                  value={data.frontFooterPadding}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {renderOffsetPair(
              'Posição do Rodapé da Frente',
              'footerVerticalOffset',
              'footerHorizontalOffset',
              -150,
              150,
              -300,
              300
            )}
          </div>
        )}

        {/* 6. CABEÇALHO DO VERSO */}
        {zone === 'verso_header' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Tamanho da Fonte do Título</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.versoTitleFontSize || 30}px</span>
                </div>
                <input
                  type="range"
                  name="versoTitleFontSize"
                  min="16"
                  max="48"
                  value={data.versoTitleFontSize || 30}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Margem Superior do Verso</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.versoHeaderPadding}px</span>
                </div>
                <input
                  type="range"
                  name="versoHeaderPadding"
                  min="0"
                  max="300"
                  value={data.versoHeaderPadding}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {renderOffsetPair(
              'Posição do Título do Verso',
              'versoTitleVerticalOffset',
              'versoTitleHorizontalOffset',
              -200,
              200,
              -300,
              300
            )}
          </div>
        )}

        {/* 7. COLUNA INSTITUIÇÃO E CURSO NO VERSO */}
        {zone === 'verso_institution' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AppInput
                name="courseName"
                label="Nome do Curso"
                value={data.courseName}
                onChange={onChange}
                icon="fa-solid fa-graduation-cap"
              />
              <AppInput
                name="totalHours"
                label="Carga Horária Total (Horas)"
                value={data.totalHours}
                onChange={onChange}
                icon="fa-solid fa-clock"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AppInput
                name="providerName"
                label="Empresa Fornecedora / Realização"
                value={data.providerName}
                onChange={onChange}
              />
              <AppInput
                name="providerCnpj"
                label="CNPJ da Empresa Fornecedora"
                value={data.providerCnpj}
                onChange={onChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Fonte dos Dados (Verso)</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.versoHeaderFontSize}px</span>
                </div>
                <input
                  type="range"
                  name="versoHeaderFontSize"
                  min="10"
                  max="40"
                  value={data.versoHeaderFontSize}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Largura da Coluna Esquerda</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.versoSplitRatio}%</span>
                </div>
                <input
                  type="range"
                  name="versoSplitRatio"
                  min="20"
                  max="70"
                  value={data.versoSplitRatio}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {renderOffsetPair(
              'Posição da Coluna Institucional (Verso)',
              'versoInstitutionVerticalOffset',
              'versoInstitutionHorizontalOffset',
              -200,
              200,
              -300,
              300
            )}
          </div>
        )}

        {/* 8. TABELA DA GRADE CURRICULAR NO VERSO */}
        {zone === 'verso_curriculum' && (
          <div className="space-y-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Fonte da Grade</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.versoCurriculumFontSize}px</span>
                </div>
                <input
                  type="range"
                  name="versoCurriculumFontSize"
                  min="8"
                  max="24"
                  value={data.versoCurriculumFontSize}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Espaçamento Linhas</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.versoRowPadding}px</span>
                </div>
                <input
                  type="range"
                  name="versoRowPadding"
                  min="2"
                  max="30"
                  value={data.versoRowPadding}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Largura Coluna Horas</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.hoursColumnWidth || 80}px</span>
                </div>
                <input
                  type="range"
                  name="hoursColumnWidth"
                  min="50"
                  max="250"
                  value={data.hoursColumnWidth || 80}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {renderOffsetPair(
              'Posição da Tabela da Grade (Verso)',
              'versoCurriculumVerticalOffset',
              'versoCurriculumHorizontalOffset',
              -200,
              200,
              -300,
              300
            )}
          </div>
        )}

        {/* 9. RODAPÉ DO VERSO */}
        {zone === 'verso_footer' && (
          <div className="space-y-4">
            <AppInput
              name="companyName"
              label="Instituição Emissora Impressa no Rodapé"
              value={data.companyName}
              onChange={onChange}
              icon="fa-solid fa-building"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Fonte do Rodapé do Verso</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                    {data.versoFooterFontSize || data.footerFontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  name="versoFooterFontSize"
                  min="6"
                  max="20"
                  value={data.versoFooterFontSize || data.footerFontSize}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Margem Inferior do Verso</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{data.versoFooterPadding}px</span>
                </div>
                <input
                  type="range"
                  name="versoFooterPadding"
                  min="0"
                  max="250"
                  value={data.versoFooterPadding}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {renderOffsetPair(
              'Posição do Rodapé do Verso',
              'versoFooterVerticalOffset',
              'versoFooterHorizontalOffset',
              -150,
              150,
              -300,
              300
            )}
          </div>
        )}
      </AppCard>
    </div>
  );
};

