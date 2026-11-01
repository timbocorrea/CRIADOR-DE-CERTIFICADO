import React from 'react';
import { CertificateData } from '../../types';
import { readImageAsBase64 } from '../../utils/imageManager';

interface DesignControlsProps {
  data: CertificateData;
  onSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetTextAlign: (align: 'left' | 'center' | 'right' | 'justify') => void;
  onToggleBoldVariable: (variable: string) => void;
  onSetImageField: (field: 'bgImage' | 'signatureImage' | 'digitalSeal', base64: string | null) => void;
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

export const DesignControls: React.FC<DesignControlsProps> = ({
  data,
  onSliderChange,
  onSetTextAlign,
  onToggleBoldVariable,
  onSetImageField,
}) => {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'bgImage' | 'signatureImage' | 'digitalSeal') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await readImageAsBase64(file);
        onSetImageField(field, base64);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        alert(msg);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Dimensões de Cabeçalho e Rodapé */}
      <section className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
        <h3 className="text-xs font-bold text-blue-900 uppercase mb-4 flex items-center gap-2">
          <i className="fa-solid fa-ruler-combined"></i> Dimensões de Cabeçalho e Rodapé
        </h3>
        <div className="space-y-4">
          <div className="bg-white p-3 rounded border border-blue-100 shadow-sm">
            <p className="text-[10px] font-bold text-blue-800 uppercase mb-3">FRENTE (Página 1)</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase text-blue-600">Altura Cabeçalho</label>
                  <span className="text-[10px] font-mono font-bold text-blue-600">{data.frontHeaderPadding}px</span>
                </div>
                <input
                  type="range"
                  name="frontHeaderPadding"
                  min="0"
                  max="300"
                  value={data.frontHeaderPadding}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase text-blue-600">Altura Rodapé</label>
                  <span className="text-[10px] font-mono font-bold text-blue-600">{data.frontFooterPadding}px</span>
                </div>
                <input
                  type="range"
                  name="frontFooterPadding"
                  min="0"
                  max="250"
                  value={data.frontFooterPadding}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Espaçamento Lateral</label>
                  <span className="text-[10px] font-mono font-bold text-blue-600">{data.frontSidePadding}px</span>
                </div>
                <input
                  type="range"
                  name="frontSidePadding"
                  min="20"
                  max="250"
                  value={data.frontSidePadding}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Espessura Borda</label>
                  <span className="text-[10px] font-mono font-bold text-blue-600">{data.frontBorderWidth}px</span>
                </div>
                <input
                  type="range"
                  name="frontBorderWidth"
                  min="0"
                  max="60"
                  value={data.frontBorderWidth}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded border border-blue-100 shadow-sm">
            <p className="text-[10px] font-bold text-blue-800 uppercase mb-3">VERSO (Página 2)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase text-blue-600">Altura Cabeçalho</label>
                  <span className="text-[10px] font-mono font-bold text-blue-600">{data.versoHeaderPadding}px</span>
                </div>
                <input
                  type="range"
                  name="versoHeaderPadding"
                  min="0"
                  max="300"
                  value={data.versoHeaderPadding}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase text-blue-600">Altura Rodapé</label>
                  <span className="text-[10px] font-mono font-bold text-blue-600">{data.versoFooterPadding}px</span>
                </div>
                <input
                  type="range"
                  name="versoFooterPadding"
                  min="0"
                  max="250"
                  value={data.versoFooterPadding}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ajustes de Posição (Layout) */}
      <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-xs font-bold text-gray-600 uppercase mb-4 flex items-center gap-2">
          <i className="fa-solid fa-up-down-left-right"></i> Ajustes de Posição (Layout)
        </h3>
        <div className="space-y-4">
          <div className="bg-white p-3 rounded border border-gray-200 space-y-3">
            <p className="text-[10px] font-bold text-blue-900 uppercase">VERSO (Pág 2)</p>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Posição Vertical da Grade</label>
                <span className="text-[10px] font-mono font-bold text-blue-600">{data.versoCurriculumVerticalOffset}px</span>
              </div>
              <input
                type="range"
                name="versoCurriculumVerticalOffset"
                min="-200"
                max="200"
                value={data.versoCurriculumVerticalOffset}
                onChange={onSliderChange}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Posição Vertical Instituição</label>
                <span className="text-[10px] font-mono font-bold text-blue-600">{data.versoInstitutionVerticalOffset}px</span>
              </div>
              <input
                type="range"
                name="versoInstitutionVerticalOffset"
                min="-200"
                max="200"
                value={data.versoInstitutionVerticalOffset}
                onChange={onSliderChange}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          <div className="bg-white p-3 rounded border border-gray-200 space-y-3">
            <p className="text-[10px] font-bold text-blue-900 uppercase">FRENTE (Pág 1)</p>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Posição Vertical Título</label>
                <span className="text-[10px] font-mono font-bold text-blue-600">{data.titleVerticalOffset}px</span>
              </div>
              <input
                type="range"
                name="titleVerticalOffset"
                min="-200"
                max="200"
                value={data.titleVerticalOffset}
                onChange={onSliderChange}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Posição Vertical Assinaturas</label>
                <span className="text-[10px] font-mono font-bold text-blue-600">{data.signaturesVerticalOffset}px</span>
              </div>
              <input
                type="range"
                name="signaturesVerticalOffset"
                min="-200"
                max="200"
                value={data.signaturesVerticalOffset}
                onChange={onSliderChange}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
            <div className="pt-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Alinhamento do Texto</label>
              <div className="flex bg-gray-100 p-1 rounded-md border">
                <button
                  type="button"
                  onClick={() => onSetTextAlign('left')}
                  className={`flex-1 py-1.5 rounded transition-all ${data.frontTextAlign === 'left' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Esquerda"
                >
                  <i className="fa-solid fa-align-left"></i>
                </button>
                <button
                  type="button"
                  onClick={() => onSetTextAlign('center')}
                  className={`flex-1 py-1.5 rounded transition-all ${data.frontTextAlign === 'center' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Centralizado"
                >
                  <i className="fa-solid fa-align-center"></i>
                </button>
                <button
                  type="button"
                  onClick={() => onSetTextAlign('right')}
                  className={`flex-1 py-1.5 rounded transition-all ${data.frontTextAlign === 'right' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Direita"
                >
                  <i className="fa-solid fa-align-right"></i>
                </button>
                <button
                  type="button"
                  onClick={() => onSetTextAlign('justify')}
                  className={`flex-1 py-1.5 rounded transition-all ${data.frontTextAlign === 'justify' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Justificado"
                >
                  <i className="fa-solid fa-align-justify"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Negrito em Variáveis Dinâmicas */}
      <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-xs font-bold text-gray-600 uppercase mb-4 flex items-center gap-2">
          <i className="fa-solid fa-bold"></i> Estilo de Texto (Destaque)
        </h3>
        <div className="bg-white p-3 rounded border border-gray-200">
          <p className="text-[10px] font-bold text-gray-500 uppercase mb-3">Negrito nas Variáveis Dinâmicas</p>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_VARIABLES.map((variable) => (
              <div key={variable.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`bold-${variable.value}`}
                  checked={data.boldVariables.includes(variable.value)}
                  onChange={() => onToggleBoldVariable(variable.value)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <label htmlFor={`bold-${variable.value}`} className="text-xs text-gray-700 cursor-pointer select-none">
                  {variable.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tamanhos de Fontes */}
      <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-xs font-bold text-gray-600 uppercase mb-4 flex items-center gap-2">
          <i className="fa-solid fa-font"></i> Tamanhos de Fontes
        </h3>
        <div className="space-y-4">
          <div className="bg-white p-3 rounded border border-gray-200 space-y-3">
            <p className="text-[10px] font-bold text-blue-900 uppercase">FRENTE</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Título</label>
                  <span className="text-[10px] font-mono font-bold text-blue-600">{data.titleFontSize}px</span>
                </div>
                <input
                  type="range"
                  name="titleFontSize"
                  min="20"
                  max="150"
                  value={data.titleFontSize}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Nome (Manuscrito)</label>
                  <span className="text-[10px] font-mono font-bold text-blue-600">{data.highlightNameFontSize}px</span>
                </div>
                <input
                  type="range"
                  name="highlightNameFontSize"
                  min="20"
                  max="150"
                  value={data.highlightNameFontSize}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded border border-gray-200 space-y-3">
            <p className="text-[10px] font-bold text-blue-900 uppercase">VERSO</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Cabeçalho</label>
                  <span className="text-[10px] font-mono font-bold text-blue-600">{data.versoHeaderFontSize}px</span>
                </div>
                <input
                  type="range"
                  name="versoHeaderFontSize"
                  min="10"
                  max="40"
                  value={data.versoHeaderFontSize}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Grade Curricular</label>
                  <span className="text-[10px] font-mono font-bold text-blue-600">{data.versoCurriculumFontSize}px</span>
                </div>
                <input
                  type="range"
                  name="versoCurriculumFontSize"
                  min="8"
                  max="24"
                  value={data.versoCurriculumFontSize}
                  onChange={onSliderChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ativos Visuais (com Validação Segura - CM-ALTO-008) */}
      <section className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-600 uppercase flex items-center gap-2">
          <i className="fa-solid fa-image"></i> Ativos Visuais & Assinaturas
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fundo (Pág 1)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e, 'bgImage')}
              className="block w-full text-[11px] text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Assinatura Digital Principal</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e, 'signatureImage')}
              className="block w-full text-[11px] text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Selo / Assinatura Técnica</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e, 'digitalSeal')}
              className="block w-full text-[11px] text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
