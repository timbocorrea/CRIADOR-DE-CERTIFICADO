import React, { useState } from 'react';
import { CertificateData } from '../../types';
import { readImageAsBase64 } from '../../utils/imageManager';
import {
  AppCard,
  AppBadge,
} from '../ui';

interface DesignSectionProps {
  data: CertificateData;
  previewPage?: 1 | 2;
  onSelectPage?: (page: 1 | 2) => void;
  onSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetTextAlign: (align: 'left' | 'center' | 'right' | 'justify') => void;
  onToggleBoldVariable: (variable: string) => void;
  onSetImageField: (field: 'bgImage' | 'signatureImage' | 'digitalSeal', base64: string | null) => void;
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const AVAILABLE_VARIABLES = [
  { label: 'Nome do Aluno', value: '{{NOME}}' },
  { label: 'CPF', value: '{{CPF}}' },
  { label: 'Curso', value: '{{CURSO}}' },
  { label: 'Data', value: '{{DATA}}' },
  { label: 'Carga Horária', value: '{{CARGA_HORARIA}}' },
  { label: 'Razão Social', value: '{{RAZAO_SOCIAL}}' },
  { label: 'CNPJ', value: '{{CNPJ}}' },
  { label: 'Endereço', value: '{{ENDERECO}}' },
];

type AdvancedSectionId = 'all' | 'dimensions' | 'offsets' | 'typography' | 'seal';

interface FaceGroupProps {
  page: 1 | 2;
  previewPage?: 1 | 2;
  onSelectPage?: (page: 1 | 2) => void;
  title: string;
  icon?: string;
  children: React.ReactNode;
}

const FaceGroup: React.FC<FaceGroupProps> = ({
  page,
  previewPage,
  onSelectPage,
  title,
  icon,
  children,
}) => {
  const isCurrentInPreview = previewPage === page;
  const isFront = page === 1;

  const handleSwitch = () => {
    if (onSelectPage && previewPage !== page) {
      onSelectPage(page);
    }
  };

  return (
    <div
      onPointerDown={handleSwitch}
      onFocusCapture={handleSwitch}
      className={`p-3 rounded-xl border transition-all ${
        isCurrentInPreview
          ? 'border-blue-400 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-950/30 ring-1 ring-blue-300 dark:ring-blue-800 shadow-xs'
          : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
        <button
          type="button"
          onClick={handleSwitch}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 uppercase tracking-wider transition-colors select-none focus:outline-none"
        >
          <i
            className={`${icon || (isFront ? 'fa-solid fa-file' : 'fa-solid fa-file-lines')} ${
              isCurrentInPreview ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          ></i>
          <span>{title}</span>
        </button>

        {isCurrentInPreview ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-xs animate-fadeIn">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            Em exibição
          </span>
        ) : (
          <button
            type="button"
            onClick={handleSwitch}
            className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-white dark:hover:bg-slate-700"
          >
            <i className="fa-solid fa-eye text-[9px]"></i>
            Ver no preview
          </button>
        )}
      </div>

      {children}
    </div>
  );
};

export const DesignSection: React.FC<DesignSectionProps> = ({
  data,
  previewPage = 1,
  onSelectPage,
  onSliderChange,
  onSetTextAlign,
  onToggleBoldVariable,
  onSetImageField,
  onNotify,
}) => {
  // Alternância entre Modo Padrão e Modo Avançado
  const [designMode, setDesignMode] = useState<'standard' | 'advanced'>('standard');

  // Menu Suspenso / Filtro de Seção do Modo Avançado
  const [activeSectionFilter, setActiveSectionFilter] = useState<AdvancedSectionId>('all');

  // Controle de estado recolhido/expandido dos cards quando em visualização de todas as seções
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    dimensions: true,
    offsets: true,
    typography: false,
    seal: false,
  });

  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const expandAll = () => {
    setExpandedCards({
      dimensions: true,
      offsets: true,
      typography: true,
      seal: true,
    });
  };

  const collapseAll = () => {
    setExpandedCards({
      dimensions: false,
      offsets: false,
      typography: false,
      seal: false,
    });
  };

  const ensurePreviewPage = (targetPage: 1 | 2) => {
    if (onSelectPage && previewPage !== targetPage) {
      onSelectPage(targetPage);
    }
  };

  const handleSliderWithAutoSwitch = (
    e: React.ChangeEvent<HTMLInputElement>,
    targetPage: 1 | 2
  ) => {
    ensurePreviewPage(targetPage);
    onSliderChange(e);
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'bgImage' | 'signatureImage' | 'digitalSeal',
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        ensurePreviewPage(1);
        const base64 = await readImageAsBase64(file);
        onSetImageField(field, base64);
        if (onNotify) onNotify('success', 'Imagem Carregada', `${fieldName} atualizado com sucesso.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (onNotify) onNotify('error', 'Falha no Upload', msg);
        else alert(msg);
      }
    }
  };

  const handleRemoveImage = (field: 'bgImage' | 'signatureImage' | 'digitalSeal', fieldName: string) => {
    ensurePreviewPage(1);
    onSetImageField(field, null);
    if (onNotify) onNotify('info', 'Imagem Removida', `${fieldName} foi removido.`);
  };

  // Seletor de visibilidade de cards conforme menu suspenso
  const showDimensions = activeSectionFilter === 'all' || activeSectionFilter === 'dimensions';
  const showOffsets = activeSectionFilter === 'all' || activeSectionFilter === 'offsets';
  const showTypography = activeSectionFilter === 'all' || activeSectionFilter === 'typography';
  const showSeal = activeSectionFilter === 'all' || activeSectionFilter === 'seal';

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Seletor de Nível de Configuração: Padrão vs Avançado */}
      <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setDesignMode('standard')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            designMode === 'standard'
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm border border-slate-200/60 dark:border-slate-600'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <i className="fa-solid fa-wand-magic-sparkles"></i>
          <span>Modo Padrão (Rápido)</span>
        </button>
        <button
          type="button"
          onClick={() => setDesignMode('advanced')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            designMode === 'advanced'
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm border border-slate-200/60 dark:border-slate-600'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <i className="fa-solid fa-sliders"></i>
          <span>Modo Avançado (Ajustes Precisos)</span>
        </button>
      </div>

      {/* MODO PADRÃO (SIMPLIFICADO) */}
      {designMode === 'standard' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Alinhamento do Texto */}
          <AppCard
            title="Alinhamento do Texto Principal"
            description="Orientação tipográfica do certificado na frente"
            icon="fa-solid fa-align-center"
            defaultExpanded={true}
          >
            <div className="grid grid-cols-4 gap-2">
              {[
                { align: 'left', label: 'Esquerda', icon: 'fa-align-left' },
                { align: 'center', label: 'Centro', icon: 'fa-align-center' },
                { align: 'right', label: 'Direita', icon: 'fa-align-right' },
                { align: 'justify', label: 'Justificado', icon: 'fa-align-justify' },
              ].map((item) => {
                const isSelected = data.frontTextAlign === item.align;
                return (
                  <button
                    key={item.align}
                    type="button"
                    onClick={() => {
                      ensurePreviewPage(1);
                      onSetTextAlign(item.align as any);
                    }}
                    className={`py-3 px-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition-all border ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-sm ring-1 ring-blue-300 dark:ring-blue-700'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <i className={`fa-solid ${item.icon} text-base`}></i>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </AppCard>

          {/* Destaque em Negrito nas Variáveis */}
          <AppCard
            title="Destaque em Negrito"
            description="Marque quais variáveis devem receber tipografia em negrito"
            icon="fa-solid fa-bold"
            defaultExpanded={true}
          >
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_VARIABLES.map((v) => {
                const isChecked = data.boldVariables.includes(v.value);
                return (
                  <label
                    key={v.value}
                    onClick={() => ensurePreviewPage(1)}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-blue-50/70 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-semibold'
                        : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        ensurePreviewPage(1);
                        onToggleBoldVariable(v.value);
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>{v.label}</span>
                  </label>
                );
              })}
            </div>
          </AppCard>

          {/* Ativos Visuais Rápidos (Upload de Imagens) */}
          <AppCard
            title="Ativos Visuais & Selos"
            description="Imagens institucionais, carimbos e assinaturas digitais"
            icon="fa-solid fa-images"
            defaultExpanded={true}
          >
            <div className="space-y-3">
              {/* Imagem de Fundo */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-base shrink-0">
                    <i className="fa-solid fa-image"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      Imagem de Fundo (Anverso)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {data.bgImage ? 'Imagem personalizada carregada' : 'Fundo padrão com borda dourada'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {data.bgImage && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('bgImage', 'Imagem de fundo')}
                      className="text-xs text-red-600 hover:text-red-700 px-2 py-1"
                    >
                      Remover
                    </button>
                  )}
                  <label className="cursor-pointer px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm transition-colors">
                    <span>{data.bgImage ? 'Substituir' : 'Enviar Fundo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, 'bgImage', 'Imagem de fundo')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Assinatura Digital Principal */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base shrink-0">
                    <i className="fa-solid fa-signature"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      Assinatura Principal
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {data.signatureImage ? 'Assinatura digital carregada' : 'Nenhuma imagem enviada'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {data.signatureImage && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('signatureImage', 'Assinatura principal')}
                      className="text-xs text-red-600 hover:text-red-700 px-2 py-1"
                    >
                      Remover
                    </button>
                  )}
                  <label className="cursor-pointer px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm transition-colors">
                    <span>{data.signatureImage ? 'Substituir' : 'Enviar Assinatura'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, 'signatureImage', 'Assinatura principal')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Selo Digital */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-amber-100/70 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base shrink-0">
                    <i className="fa-solid fa-certificate"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      Selo Digital / Carimbo
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {data.digitalSeal ? 'Selo personalizado ativo' : 'Selo vetorial padrão ativo'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {data.digitalSeal && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('digitalSeal', 'Selo digital')}
                      className="text-xs text-red-600 hover:text-red-700 px-2 py-1"
                    >
                      Remover
                    </button>
                  )}
                  <label className="cursor-pointer px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm transition-colors">
                    <span>{data.digitalSeal ? 'Substituir' : 'Enviar Selo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, 'digitalSeal', 'Selo digital')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </AppCard>
        </div>
      )}

      {/* MODO AVANÇADO (AJUSTES PRECISOS COM MENU SUSPENSO E SINCRONIZAÇÃO AUTOMÁTICA) */}
      {designMode === 'advanced' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Menu Suspenso de Seleção de Seção & Ações de Recolhimento */}
          <div className="p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Ajustes Avançados</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">(Sincronizado)</span>
              </div>

              {activeSectionFilter === 'all' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={expandAll}
                    className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Expandir todas as seções"
                  >
                    <i className="fa-solid fa-angles-down mr-1"></i>
                    Expandir
                  </button>
                  <span className="text-slate-300 dark:text-slate-600 text-xs">|</span>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Recolher todas as seções"
                  >
                    <i className="fa-solid fa-angles-up mr-1"></i>
                    Recolher
                  </button>
                </div>
              )}
            </div>

            {/* Menu Suspenso (Dropdown Select) para focar na seção desejada e recolher as demais */}
            <div className="relative">
              <label htmlFor="advanced-section-filter" className="sr-only">
                Menu Suspenso de Ajustes Avançados
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600 dark:text-blue-400">
                  <i className="fa-solid fa-list-check text-xs"></i>
                </div>
                <select
                  id="advanced-section-filter"
                  value={activeSectionFilter}
                  onChange={(e) => setActiveSectionFilter(e.target.value as AdvancedSectionId)}
                  className="w-full pl-8 pr-8 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all cursor-pointer appearance-none"
                >
                  <option value="all">📂 Todas as Seções (Visualização Completa)</option>
                  <option value="dimensions">📐 1. Dimensões, Margens, Bordas & Colunas</option>
                  <option value="offsets">↕️ 2. Posições e Offsets Verticais</option>
                  <option value="typography">🔤 3. Tamanhos de Fontes por Elemento</option>
                  <option value="seal">🛡️ 4. Selo Digital e Efeitos</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <i className="fa-solid fa-chevron-down text-xs"></i>
                </div>
              </div>
            </div>

            {activeSectionFilter !== 'all' && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Exibindo apenas a seção selecionada.</span>
                <button
                  type="button"
                  onClick={() => setActiveSectionFilter('all')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Mostrar todas
                </button>
              </div>
            )}
          </div>

          {/* 1. Dimensões, Margens, Bordas & Colunas */}
          {showDimensions && (
            <AppCard
              title="Dimensões, Margens, Bordas & Colunas"
              description="Margens da borda, espessura e largura de cada coluna do documento"
              icon="fa-solid fa-ruler-combined"
              isCollapsible={true}
              isExpanded={activeSectionFilter !== 'all' || expandedCards.dimensions}
              onToggleExpand={() => toggleCard('dimensions')}
            >
              <div className="space-y-4">
                {/* Grupo FRENTE */}
                <FaceGroup
                  page={1}
                  previewPage={previewPage}
                  onSelectPage={onSelectPage}
                  title="FRENTE (Página 1)"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Margem Superior (Cabeçalho)</span>
                        <span className="font-mono text-blue-600 font-bold">{data.frontHeaderPadding}px</span>
                      </div>
                      <input
                        type="range"
                        name="frontHeaderPadding"
                        min="0"
                        max="300"
                        value={data.frontHeaderPadding}
                        onPointerDown={() => ensurePreviewPage(1)}
                        onFocus={() => ensurePreviewPage(1)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Margem Inferior (Rodapé)</span>
                        <span className="font-mono text-blue-600 font-bold">{data.frontFooterPadding}px</span>
                      </div>
                      <input
                        type="range"
                        name="frontFooterPadding"
                        min="0"
                        max="250"
                        value={data.frontFooterPadding}
                        onPointerDown={() => ensurePreviewPage(1)}
                        onFocus={() => ensurePreviewPage(1)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Margem Lateral da Borda</span>
                        <span className="font-mono text-blue-600 font-bold">{data.frontSidePadding}px</span>
                      </div>
                      <input
                        type="range"
                        name="frontSidePadding"
                        min="20"
                        max="250"
                        value={data.frontSidePadding}
                        onPointerDown={() => ensurePreviewPage(1)}
                        onFocus={() => ensurePreviewPage(1)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Espessura da Borda</span>
                        <span className="font-mono text-blue-600 font-bold">{data.frontBorderWidth}px</span>
                      </div>
                      <input
                        type="range"
                        name="frontBorderWidth"
                        min="0"
                        max="60"
                        value={data.frontBorderWidth}
                        onPointerDown={() => ensurePreviewPage(1)}
                        onFocus={() => ensurePreviewPage(1)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Recuo da Borda (Margem Externa)</span>
                        <span className="font-mono text-blue-600 font-bold">{data.frontBorderMargin || 0}px</span>
                      </div>
                      <input
                        type="range"
                        name="frontBorderMargin"
                        min="0"
                        max="60"
                        value={data.frontBorderMargin || 0}
                        onPointerDown={() => ensurePreviewPage(1)}
                        onFocus={() => ensurePreviewPage(1)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Recuo Lateral Assinaturas</span>
                        <span className="font-mono text-blue-600 font-bold">{data.signaturesHorizontalPadding}px</span>
                      </div>
                      <input
                        type="range"
                        name="signaturesHorizontalPadding"
                        min="0"
                        max="150"
                        value={data.signaturesHorizontalPadding}
                        onPointerDown={() => ensurePreviewPage(1)}
                        onFocus={() => ensurePreviewPage(1)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </FaceGroup>

                {/* Grupo VERSO */}
                <FaceGroup
                  page={2}
                  previewPage={previewPage}
                  onSelectPage={onSelectPage}
                  title="VERSO (Página 2)"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Margem Superior (Cabeçalho)</span>
                        <span className="font-mono text-blue-600 font-bold">{data.versoHeaderPadding}px</span>
                      </div>
                      <input
                        type="range"
                        name="versoHeaderPadding"
                        min="0"
                        max="300"
                        value={data.versoHeaderPadding}
                        onPointerDown={() => ensurePreviewPage(2)}
                        onFocus={() => ensurePreviewPage(2)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 2)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Margem Inferior (Rodapé)</span>
                        <span className="font-mono text-blue-600 font-bold">{data.versoFooterPadding}px</span>
                      </div>
                      <input
                        type="range"
                        name="versoFooterPadding"
                        min="0"
                        max="250"
                        value={data.versoFooterPadding}
                        onPointerDown={() => ensurePreviewPage(2)}
                        onFocus={() => ensurePreviewPage(2)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 2)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Margem Lateral da Borda</span>
                        <span className="font-mono text-blue-600 font-bold">{data.versoSidePadding !== undefined ? data.versoSidePadding : 64}px</span>
                      </div>
                      <input
                        type="range"
                        name="versoSidePadding"
                        min="20"
                        max="200"
                        value={data.versoSidePadding !== undefined ? data.versoSidePadding : 64}
                        onPointerDown={() => ensurePreviewPage(2)}
                        onFocus={() => ensurePreviewPage(2)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 2)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Espessura da Borda</span>
                        <span className="font-mono text-blue-600 font-bold">{data.versoBorderWidth !== undefined ? data.versoBorderWidth : 4}px</span>
                      </div>
                      <input
                        type="range"
                        name="versoBorderWidth"
                        min="0"
                        max="30"
                        value={data.versoBorderWidth !== undefined ? data.versoBorderWidth : 4}
                        onPointerDown={() => ensurePreviewPage(2)}
                        onFocus={() => ensurePreviewPage(2)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 2)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Largura Coluna Instituição</span>
                        <span className="font-mono text-blue-600 font-bold">{data.versoSplitRatio}% / {100 - data.versoSplitRatio}%</span>
                      </div>
                      <input
                        type="range"
                        name="versoSplitRatio"
                        min="20"
                        max="70"
                        value={data.versoSplitRatio}
                        onPointerDown={() => ensurePreviewPage(2)}
                        onFocus={() => ensurePreviewPage(2)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 2)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Largura Coluna Horas</span>
                        <span className="font-mono text-blue-600 font-bold">{data.hoursColumnWidth || 80}px</span>
                      </div>
                      <input
                        type="range"
                        name="hoursColumnWidth"
                        min="50"
                        max="250"
                        value={data.hoursColumnWidth || 80}
                        onPointerDown={() => ensurePreviewPage(2)}
                        onFocus={() => ensurePreviewPage(2)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 2)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Espaçamento Linhas da Grade</span>
                        <span className="font-mono text-blue-600 font-bold">{data.versoRowPadding}px</span>
                      </div>
                      <input
                        type="range"
                        name="versoRowPadding"
                        min="2"
                        max="30"
                        value={data.versoRowPadding}
                        onPointerDown={() => ensurePreviewPage(2)}
                        onFocus={() => ensurePreviewPage(2)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 2)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </FaceGroup>
              </div>
            </AppCard>
          )}

          {/* 2. Ajustes de Posição e Deslocamento Vertical */}
          {showOffsets && (
            <AppCard
              title="Ajustes de Posição (Offsets Verticais)"
              description="Deslocamentos milimétricos dos blocos de conteúdo"
              icon="fa-solid fa-up-down-left-right"
              isCollapsible={true}
              isExpanded={activeSectionFilter !== 'all' || expandedCards.offsets}
              onToggleExpand={() => toggleCard('offsets')}
            >
              <div className="space-y-4">
                {/* Grupo FRENTE */}
                <FaceGroup
                  page={1}
                  previewPage={previewPage}
                  onSelectPage={onSelectPage}
                  title="FRENTE (Página 1)"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Offset Título</span>
                        <span className="font-mono text-blue-600 font-bold">{data.titleVerticalOffset}px</span>
                      </div>
                      <input
                        type="range"
                        name="titleVerticalOffset"
                        min="-200"
                        max="200"
                        value={data.titleVerticalOffset}
                        onPointerDown={() => ensurePreviewPage(1)}
                        onFocus={() => ensurePreviewPage(1)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Offset Assinaturas</span>
                        <span className="font-mono text-blue-600 font-bold">{data.signaturesVerticalOffset}px</span>
                      </div>
                      <input
                        type="range"
                        name="signaturesVerticalOffset"
                        min="-200"
                        max="200"
                        value={data.signaturesVerticalOffset}
                        onPointerDown={() => ensurePreviewPage(1)}
                        onFocus={() => ensurePreviewPage(1)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </FaceGroup>

                {/* Grupo VERSO */}
                <FaceGroup
                  page={2}
                  previewPage={previewPage}
                  onSelectPage={onSelectPage}
                  title="VERSO (Página 2)"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Offset Grade</span>
                        <span className="font-mono text-blue-600 font-bold">{data.versoCurriculumVerticalOffset}px</span>
                      </div>
                      <input
                        type="range"
                        name="versoCurriculumVerticalOffset"
                        min="-200"
                        max="200"
                        value={data.versoCurriculumVerticalOffset}
                        onPointerDown={() => ensurePreviewPage(2)}
                        onFocus={() => ensurePreviewPage(2)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 2)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Offset Instituição</span>
                        <span className="font-mono text-blue-600 font-bold">{data.versoInstitutionVerticalOffset}px</span>
                      </div>
                      <input
                        type="range"
                        name="versoInstitutionVerticalOffset"
                        min="-200"
                        max="200"
                        value={data.versoInstitutionVerticalOffset}
                        onPointerDown={() => ensurePreviewPage(2)}
                        onFocus={() => ensurePreviewPage(2)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 2)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </FaceGroup>
              </div>
            </AppCard>
          )}

          {/* 3. Tamanhos de Fontes Específicos */}
          {showTypography && (
            <AppCard
              title="Tamanhos de Fontes por Elemento"
              description="Definição precisa em pixels das fontes do documento"
              icon="fa-solid fa-font"
              isCollapsible={true}
              isExpanded={activeSectionFilter !== 'all' || expandedCards.typography}
              onToggleExpand={() => toggleCard('typography')}
            >
              <div className="space-y-4">
                {/* Grupo FRENTE */}
                <FaceGroup
                  page={1}
                  previewPage={previewPage}
                  onSelectPage={onSelectPage}
                  title="FRENTE"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Título Principal</span>
                        <span className="font-mono text-blue-600 font-bold">{data.titleFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        name="titleFontSize"
                        min="20"
                        max="150"
                        value={data.titleFontSize}
                        onPointerDown={() => ensurePreviewPage(1)}
                        onFocus={() => ensurePreviewPage(1)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Subtítulo</span>
                        <span className="font-mono text-blue-600 font-bold">{data.subtitleFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        name="subtitleFontSize"
                        min="12"
                        max="48"
                        value={data.subtitleFontSize}
                        onPointerDown={() => ensurePreviewPage(1)}
                        onFocus={() => ensurePreviewPage(1)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Nome de Destaque</span>
                        <span className="font-mono text-blue-600 font-bold">{data.highlightNameFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        name="highlightNameFontSize"
                        min="20"
                        max="150"
                        value={data.highlightNameFontSize}
                        onPointerDown={() => ensurePreviewPage(1)}
                        onFocus={() => ensurePreviewPage(1)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Corpo do Texto</span>
                        <span className="font-mono text-blue-600 font-bold">{data.bodyFontSize || 24}px</span>
                      </div>
                      <input
                        type="range"
                        name="bodyFontSize"
                        min="12"
                        max="42"
                        value={data.bodyFontSize || 24}
                        onPointerDown={() => ensurePreviewPage(1)}
                        onFocus={() => ensurePreviewPage(1)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Assinaturas</span>
                        <span className="font-mono text-blue-600 font-bold">{data.signatureFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        name="signatureFontSize"
                        min="8"
                        max="28"
                        value={data.signatureFontSize}
                        onPointerDown={() => ensurePreviewPage(1)}
                        onFocus={() => ensurePreviewPage(1)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Rodapé Oficial</span>
                        <span className="font-mono text-blue-600 font-bold">{data.footerFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        name="footerFontSize"
                        min="6"
                        max="20"
                        value={data.footerFontSize}
                        onPointerDown={() => ensurePreviewPage(1)}
                        onFocus={() => ensurePreviewPage(1)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </FaceGroup>

                {/* Grupo VERSO */}
                <FaceGroup
                  page={2}
                  previewPage={previewPage}
                  onSelectPage={onSelectPage}
                  title="VERSO"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Título do Verso</span>
                        <span className="font-mono text-blue-600 font-bold">{data.versoTitleFontSize || 30}px</span>
                      </div>
                      <input
                        type="range"
                        name="versoTitleFontSize"
                        min="16"
                        max="48"
                        value={data.versoTitleFontSize || 30}
                        onPointerDown={() => ensurePreviewPage(2)}
                        onFocus={() => ensurePreviewPage(2)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 2)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Dados Instituição / Curso</span>
                        <span className="font-mono text-blue-600 font-bold">{data.versoHeaderFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        name="versoHeaderFontSize"
                        min="10"
                        max="40"
                        value={data.versoHeaderFontSize}
                        onPointerDown={() => ensurePreviewPage(2)}
                        onFocus={() => ensurePreviewPage(2)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 2)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Grade Curricular</span>
                        <span className="font-mono text-blue-600 font-bold">{data.versoCurriculumFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        name="versoCurriculumFontSize"
                        min="8"
                        max="24"
                        value={data.versoCurriculumFontSize}
                        onPointerDown={() => ensurePreviewPage(2)}
                        onFocus={() => ensurePreviewPage(2)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 2)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-600">Rodapé do Verso</span>
                        <span className="font-mono text-blue-600 font-bold">{data.versoFooterFontSize || data.footerFontSize}px</span>
                      </div>
                      <input
                        type="range"
                        name="versoFooterFontSize"
                        min="6"
                        max="20"
                        value={data.versoFooterFontSize || data.footerFontSize}
                        onPointerDown={() => ensurePreviewPage(2)}
                        onFocus={() => ensurePreviewPage(2)}
                        onChange={(e) => handleSliderWithAutoSwitch(e, 2)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </FaceGroup>
              </div>
            </AppCard>
          )}

          {/* 4. Controles do Selo Digital */}
          {showSeal && (
            <AppCard
              title="Selo Digital e Efeitos"
              description="Dimensões, opacidade e posição do carimbo de autenticidade"
              icon="fa-solid fa-stamp"
              isCollapsible={true}
              isExpanded={activeSectionFilter !== 'all' || expandedCards.seal}
              onToggleExpand={() => toggleCard('seal')}
            >
              <FaceGroup
                page={1}
                previewPage={previewPage}
                onSelectPage={onSelectPage}
                title="FRENTE (Posição e Efeitos do Selo)"
                icon="fa-solid fa-stamp"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-slate-600">Tamanho do Selo</span>
                      <span className="font-mono text-blue-600 font-bold">{data.sealSize}px</span>
                    </div>
                    <input
                      type="range"
                      name="sealSize"
                      min="30"
                      max="200"
                      value={data.sealSize}
                      onPointerDown={() => ensurePreviewPage(1)}
                      onFocus={() => ensurePreviewPage(1)}
                      onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-slate-600">Opacidade</span>
                      <span className="font-mono text-blue-600 font-bold">{data.sealOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      name="sealOpacity"
                      min="10"
                      max="100"
                      value={data.sealOpacity}
                      onPointerDown={() => ensurePreviewPage(1)}
                      onFocus={() => ensurePreviewPage(1)}
                      onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-slate-600">Offset Vertical</span>
                      <span className="font-mono text-blue-600 font-bold">{data.sealVerticalOffset}px</span>
                    </div>
                    <input
                      type="range"
                      name="sealVerticalOffset"
                      min="-200"
                      max="200"
                      value={data.sealVerticalOffset}
                      onPointerDown={() => ensurePreviewPage(1)}
                      onFocus={() => ensurePreviewPage(1)}
                      onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-slate-600">Offset Horizontal</span>
                      <span className="font-mono text-blue-600 font-bold">{data.sealHorizontalOffset}px</span>
                    </div>
                    <input
                      type="range"
                      name="sealHorizontalOffset"
                      min="-200"
                      max="200"
                      value={data.sealHorizontalOffset}
                      onPointerDown={() => ensurePreviewPage(1)}
                      onFocus={() => ensurePreviewPage(1)}
                      onChange={(e) => handleSliderWithAutoSwitch(e, 1)}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              </FaceGroup>
            </AppCard>
          )}
        </div>
      )}
    </div>
  );
};
