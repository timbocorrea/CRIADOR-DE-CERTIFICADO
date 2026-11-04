
import React from 'react';
import { CertificateData, Student, CurriculumItem, CertificateElementZone } from '../types';
import { renderSafeCertificateText, formatHighlightName } from '../utils/helpers';
import { formatRegistryForDisplay } from '../utils/professionalRegistry';

interface CertificatePreviewProps {
  data: CertificateData;
  student: Student | null;
  page: 1 | 2;
  idSuffix?: string;
  versoPageNumber?: number;
  versoTotalPages?: number;
  curriculumSlice?: CurriculumItem[];
  isFillerPage?: boolean;
  selectedZone?: CertificateElementZone | null;
  onSelectZone?: (zone: CertificateElementZone) => void;
}

const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  data,
  student,
  page,
  idSuffix = "",
  versoPageNumber,
  versoTotalPages,
  curriculumSlice,
  isFillerPage = false,
  selectedZone = null,
  onSelectZone,
}) => {
  const isInteractive = Boolean(onSelectZone) && idSuffix === "";
  const effectiveBodyFont = data.bodyFontFamily || "'Playfair Display', serif";
  const effectiveTitleFont = data.titleFontFamily || effectiveBodyFont;
  const effectiveHighlightFont = data.highlightNameFontFamily || "'Alex Brush', cursive";

  const getInteractiveClass = (zone: CertificateElementZone) => {
    if (!isInteractive) return '';
    const isSelected = selectedZone === zone;
    return `cursor-pointer transition-all rounded-lg ${
      isSelected
        ? 'ring-2 ring-blue-600 bg-blue-500/5 shadow-sm'
        : 'hover:ring-2 hover:ring-blue-400/70 hover:bg-blue-500/[0.03]'
    }`;
  };

  const handleZoneClick = (e: React.MouseEvent, zone: CertificateElementZone) => {
    if (!isInteractive || !onSelectZone) return;
    e.stopPropagation();
    onSelectZone(zone);
  };
  // Versão 1: Frente
  if (page === 1) {
    const rawHighlightName = student?.displayName || student?.name || '[Nome de Destaque]';
    const displayHighlightName = formatHighlightName(rawHighlightName);

    return (
      <div
        id={`certificate-page-1${idSuffix}`}
        className="relative w-[1123px] h-[794px] bg-white mx-auto certificate-font box-border overflow-hidden select-none"
        style={{ width: '1123px', height: '794px', fontFamily: effectiveBodyFont }}
      >
        {/* Renderização do Fundo */}
        {data.bgImage ? (
          <img 
            src={data.bgImage} 
            width="1123"
            height="794"
            className="absolute inset-0 w-[1123px] h-[794px] object-fill pointer-events-none" 
            style={{ zIndex: 0 }}
            alt="Fundo"
          />
        ) : (
          <div 
            className="absolute border-blue-900 pointer-events-none" 
            style={{ 
              zIndex: 0, 
              top: `${data.frontBorderMargin || 0}px`,
              left: `${data.frontBorderMargin || 0}px`,
              width: `${1123 - (data.frontBorderMargin || 0) * 2}px`, 
              height: `${794 - (data.frontBorderMargin || 0) * 2}px`, 
              boxSizing: 'border-box',
              borderWidth: `${data.frontBorderWidth}px`,
              borderStyle: 'solid'
            }}
          ></div>
        )}

        {/* Conteúdo sobreposto */}
        <div 
          className="relative z-10 w-full h-full flex flex-col"
          style={{ 
            paddingLeft: `${data.frontSidePadding}px`, 
            paddingRight: `${data.frontSidePadding}px`,
            paddingTop: `${data.frontHeaderPadding}px`,
            paddingBottom: `${data.frontFooterPadding}px`,
            width: '1123px',
            height: '794px',
            boxSizing: 'border-box'
          }}
        >
          {/* ZONA 1: TÍTULO E SUBTÍTULO EDITÁVEIS (COM AJUSTE VERTICAL E HORIZONTAL) */}
          <div 
            onClick={(e) => handleZoneClick(e, 'front_header')}
            title={isInteractive ? 'Clique para editar o Cabeçalho (Título e Subtítulo)' : undefined}
            className={`w-full text-center flex flex-col items-center ${getInteractiveClass('front_header')}`}
            style={{
              transform: `translate(${data.titleHorizontalOffset || 0}px, ${data.titleVerticalOffset || 0}px)`,
              fontFamily: effectiveTitleFont
            }}
          >
            {(data.certificateTitle ?? 'CERTIFICADO').trim() !== '' && (
              <h1 
                style={{ fontSize: `${data.titleFontSize}px`, fontFamily: effectiveTitleFont }}
                className="font-bold text-blue-900 uppercase tracking-widest leading-[1]"
              >
                {data.certificateTitle ?? 'CERTIFICADO'}
              </h1>
            )}
            {(data.certificateSubtitle ?? 'DE PARTICIPAÇÃO').trim() !== '' && (
              <p 
                style={{
                  fontSize: `${data.subtitleFontSize}px`,
                  marginTop: `${data.titleSpacing}px`,
                  transform: `translate(${data.subtitleHorizontalOffset || 0}px, ${data.subtitleVerticalOffset || 0}px)`,
                  fontFamily: effectiveTitleFont
                }}
                className="font-medium text-gray-500 tracking-[0.4em] uppercase"
              >
                {data.certificateSubtitle ?? 'DE PARTICIPAÇÃO'}
              </p>
            )}
          </div>
          
          {/* ZONA 2: NOME MANUSCRITO (Pode ser ocultado para deixar apenas o corpo do texto) */}
          {data.showHighlightName !== false && (
            <>
              <div 
                onClick={(e) => handleZoneClick(e, 'front_highlight_name')}
                title={isInteractive ? 'Clique para editar o Nome de Destaque' : undefined}
                className={`w-full flex items-center justify-center ${getInteractiveClass('front_highlight_name')}`}
                style={{
                  height: '140px',
                  marginTop: '20px',
                  transform: `translate(${data.highlightNameHorizontalOffset || 0}px, ${data.highlightNameVerticalOffset || 0}px)`
                }}
              >
                <div 
                  className="script-font text-blue-900 text-center w-full leading-none"
                  style={{ fontSize: `${data.highlightNameFontSize}px`, fontFamily: effectiveHighlightFont }}
                >
                  {displayHighlightName}
                </div>
              </div>

              <div 
                onClick={(e) => handleZoneClick(e, 'front_highlight_name')}
                className="w-full border-b border-gray-300"
                style={{
                  marginBottom: '30px',
                  transform: `translate(${data.highlightNameHorizontalOffset || 0}px, ${data.highlightNameVerticalOffset || 0}px)`
                }}
              ></div>
            </>
          )}
          
          <div 
            onClick={(e) => handleZoneClick(e, 'front_body')}
            title={isInteractive ? 'Clique para editar o Corpo do Texto do Certificado' : undefined}
            className={`leading-relaxed text-gray-800 whitespace-pre-wrap w-full px-6 flex-grow flex items-center ${getInteractiveClass('front_body')}`}
            style={{ 
              fontSize: `${data.bodyFontSize || 24}px`,
              fontFamily: effectiveBodyFont,
              transform: `translate(${data.bodyHorizontalOffset || 0}px, ${data.bodyVerticalOffset || 0}px)`,
              textAlign: data.frontTextAlign,
              maxHeight: '280px'
            }}
          >
            <div className="w-full">{renderSafeCertificateText(data.baseText, data, student)}</div>
          </div>

          <div 
            onClick={(e) => handleZoneClick(e, 'front_signatures')}
            title={isInteractive ? 'Clique para editar Assinaturas, Instrutores e Selo' : undefined}
            className={`w-full flex items-start ${data.showTechResponsible ? 'justify-between' : 'justify-around'} ${getInteractiveClass('front_signatures')}`}
            style={{ 
              transform: `translate(${data.signaturesHorizontalOffset || 0}px, ${data.signaturesVerticalOffset || 0}px)`,
              paddingLeft: `${data.signaturesHorizontalPadding}px`,
              paddingRight: `${data.signaturesHorizontalPadding}px`,
              minHeight: '160px'
            }}
          >
            {/* Bloco de Instrutores (Suporta 1 a 4 instrutores - CM-ALTO-004) */}
            {data.instructors.length <= 1 ? (
              <div className="flex flex-col items-center text-center min-w-[220px]">
                <div className="h-20 flex items-end justify-center mb-2" style={{ height: '80px' }}>
                  {data.signatureImage && <img src={data.signatureImage} height="80" className="h-20 object-contain" alt="Assinatura" />}
                </div>
                <div className="w-full border-t border-gray-400 mb-1"></div>
                <p style={{ fontSize: `${data.signatureFontSize}px` }} className="font-bold uppercase text-gray-800 leading-tight">
                  {data.instructors[0]?.name || '[NOME DO INSTRUTOR]'}
                </p>
                <p style={{ fontSize: `${Math.max(8, data.signatureFontSize * 0.7)}px` }} className="font-bold text-gray-400 uppercase mt-1">
                  Instrutor Responsável
                </p>
                {data.instructors[0]?.competencies && (
                  <p style={{ fontSize: `${data.signatureFontSize * 0.7}px` }} className="text-gray-500 uppercase mt-0.5 max-w-[200px] leading-tight">
                    {data.instructors[0].competencies}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-4 max-w-[500px]">
                {data.instructors.slice(0, 4).map((inst, idx) => {
                  const scaleFactor = data.instructors.length > 2 ? 0.85 : 0.95;
                  const effectiveFontSize = Math.max(9, Math.floor(data.signatureFontSize * scaleFactor));
                  return (
                    <div key={inst.id || idx} className="flex flex-col items-center text-center min-w-[130px] max-w-[180px]">
                      <div className="h-20 flex items-end justify-center mb-2" style={{ height: '80px' }}>
                        {idx === 0 && data.signatureImage && (
                          <img src={data.signatureImage} height="80" className="h-20 object-contain" alt="Assinatura" />
                        )}
                      </div>
                      <div className="w-full border-t border-gray-400 mb-1"></div>
                      <p style={{ fontSize: `${effectiveFontSize}px` }} className="font-bold uppercase text-gray-800 leading-tight">
                        {inst.name}
                      </p>
                      <p style={{ fontSize: `${Math.max(8, effectiveFontSize * 0.75)}px` }} className="font-bold text-gray-400 uppercase mt-1">
                        Instrutor Responsável
                      </p>
                      {inst.competencies && (
                        <p style={{ fontSize: `${effectiveFontSize * 0.75}px` }} className="text-gray-500 uppercase mt-0.5 max-w-[160px] leading-tight">
                          {inst.competencies}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col items-center text-center min-w-[220px]">
              <div className="h-20 flex items-end justify-center mb-2" style={{ height: '80px' }}></div>
              <div className="w-full border-t border-gray-400 mb-1"></div>
              <p style={{ fontSize: `${data.signatureFontSize}px` }} className="font-bold uppercase text-gray-800 leading-tight">
                {student?.name || '[NOME DO ALUNO]'}
              </p>
              <p style={{ fontSize: `${Math.max(8, data.signatureFontSize * 0.7)}px` }} className="font-bold text-gray-400 uppercase mt-1">
                Aluno
              </p>
            </div>

            {data.showTechResponsible && (
              <div className="flex flex-col items-center text-center min-w-[220px]">
                <div className="h-20 flex items-end justify-center mb-2" style={{ height: '80px' }}>
                   {data.digitalSeal && <img src={data.digitalSeal} height="80" className="h-20 object-contain" alt="Selo" />}
                </div>
                <div className="w-full border-t border-gray-400 mb-1"></div>
                <p style={{ fontSize: `${data.signatureFontSize}px` }} className="font-bold uppercase text-gray-800 leading-tight">
                  {data.techResponsibleName || '[RESPONSÁVEL TÉCNICO]'}
                </p>
                <p style={{ fontSize: `${Math.max(8, data.signatureFontSize * 0.7)}px` }} className="font-bold text-gray-400 uppercase mt-1">
                  Responsável Técnico
                </p>
                {formatRegistryForDisplay(data.techResponsibleCompetencies) && (
                  <p style={{ fontSize: `${data.signatureFontSize * 0.7}px` }} className="text-gray-500 uppercase mt-0.5 max-w-[220px] leading-tight">
                    {formatRegistryForDisplay(data.techResponsibleCompetencies)}
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div 
            onClick={(e) => handleZoneClick(e, 'front_footer')}
            title={isInteractive ? 'Clique para editar o Rodapé Institucional' : undefined}
            className={`absolute w-full px-10 text-gray-400 uppercase tracking-tighter text-center ${getInteractiveClass('front_footer')}`}
            style={{
              left: 0,
              fontSize: `${data.footerFontSize}px`,
              bottom: `${data.frontFooterPadding}px`,
              transform: `translate(${data.footerHorizontalOffset || 0}px, ${data.footerVerticalOffset || 0}px)`
            }}
          >
             {data.companyName} - {data.companyCnpj} {data.address && `| ${data.address.replace(/\n/g, ' ')}`}
          </div>
        </div>
      </div>
    );
  }

  // Página de Fechamento / Anotações (Filler para alinhamento estrito em Impressão Duplex)
  if (isFillerPage) {
    return (
      <div
        id={`certificate-page-2${idSuffix}`}
        className="relative w-[1123px] h-[794px] bg-white mx-auto certificate-font box-border flex flex-col justify-between overflow-hidden"
        style={{ 
          border: `${data.versoBorderWidth !== undefined ? data.versoBorderWidth : 4}px solid #f3f4f6`, 
          width: '1123px', 
          height: '794px',
          fontFamily: effectiveBodyFont,
          paddingTop: `${data.versoHeaderPadding}px`,
          paddingBottom: `${data.versoFooterPadding}px`,
          paddingLeft: `${data.versoSidePadding !== undefined ? data.versoSidePadding : 64}px`,
          paddingRight: `${data.versoSidePadding !== undefined ? data.versoSidePadding : 64}px`
        }}
      >
        <h2 
          className="font-bold text-gray-500 border-b-2 border-gray-300 uppercase tracking-wide leading-tight pb-2"
          style={{ 
            fontSize: `${data.versoTitleFontSize ? Math.max(18, data.versoTitleFontSize - 6) : 24}px`,
            marginBottom: '24px' 
          }}
        >
          Anotações e Observações Institucionais
        </h2>

        <div className="flex-grow border-2 border-dashed border-gray-200 rounded-xl p-8 bg-gray-50/40 flex flex-col justify-between text-gray-500">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-wider font-semibold text-gray-400">
              Espaço Reservado para Registros Complementares
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Este espaço destina-se a averbações acadêmicas, registros de estágio supervisionado, selos cartoriais de autenticação física ou homologações complementares da entidade formadora.
            </p>
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-between text-[11px] text-gray-400">
            <span>CertificaMaster — Sistema de Emissão Documental</span>
            <span>Folha de fechamento de impressão Duplex</span>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t flex justify-between items-end opacity-60">
          <div className="text-gray-400 max-w-md uppercase tracking-tighter" style={{ fontSize: `${data.versoFooterFontSize || data.footerFontSize}px` }}>
            Registro oficial da instituição para fins de comprovação acadêmica.
          </div>
          <div className="text-right">
            <p className="font-bold text-blue-900 uppercase" style={{ fontSize: `${(data.versoFooterFontSize || data.footerFontSize) + 2}px` }}>{data.companyName}</p>
          </div>
        </div>
      </div>
    );
  }

  // Versão 2: Verso (Conteúdo Programático com Paginador de Grade Extensa)
  const items = curriculumSlice || data.curriculum;
  const isLastVersoPage = !versoTotalPages || versoTotalPages === 1 || versoPageNumber === versoTotalPages;

  // Ajuste fino dinâmico de densidade para acomodar até 12 disciplinas com legibilidade total
  const compactRowPadding = items.length > 8 
    ? Math.max(4, Math.floor(data.versoRowPadding * (8 / items.length)))
    : data.versoRowPadding;
  const compactFontSize = items.length > 10
    ? Math.max(10, Math.floor(data.versoCurriculumFontSize * 0.9))
    : data.versoCurriculumFontSize;

  const rowPaddingStyle: React.CSSProperties = { 
    paddingTop: `${compactRowPadding}px`, 
    paddingBottom: `${compactRowPadding}px`,
    fontSize: `${compactFontSize}px`,
    verticalAlign: 'middle', 
    textAlign: 'left', 
    lineHeight: '1.2'
  };

  const headerTitle = versoTotalPages && versoTotalPages > 1
    ? (versoPageNumber && versoPageNumber > 1
        ? `Conteúdo Programático (Continuação — Folha ${versoPageNumber} de ${versoTotalPages})`
        : `Conteúdo Programático (Folha 1 de ${versoTotalPages})`)
    : 'Conteúdo Programático';

  return (
    <div
      id={`certificate-page-2${idSuffix}`}
      className="relative w-[1123px] h-[794px] bg-white mx-auto certificate-font box-border flex flex-col overflow-hidden"
      style={{ 
        border: `${data.versoBorderWidth !== undefined ? data.versoBorderWidth : 4}px solid #f3f4f6`, 
        width: '1123px', 
        height: '794px',
        fontFamily: effectiveBodyFont,
        paddingTop: `${data.versoHeaderPadding}px`,
        paddingBottom: `${data.versoFooterPadding}px`,
        paddingLeft: `${data.versoSidePadding !== undefined ? data.versoSidePadding : 64}px`,
        paddingRight: `${data.versoSidePadding !== undefined ? data.versoSidePadding : 64}px`
      }}
    >
      <h2 
        onClick={(e) => handleZoneClick(e, 'verso_header')}
        title={isInteractive ? 'Clique para editar o Cabeçalho do Verso' : undefined}
        className={`font-bold text-blue-900 border-b-4 border-blue-900 uppercase tracking-wide leading-tight ${getInteractiveClass('verso_header')}`}
        style={{ 
          fontSize: `${data.versoTitleFontSize || 30}px`,
          fontFamily: effectiveTitleFont,
          marginBottom: '24px', 
          paddingBottom: '12px',
          transform: `translate(${data.versoTitleHorizontalOffset || 0}px, ${data.versoTitleVerticalOffset || 0}px)`
        }}
      >
        {headerTitle}
      </h2>
      
      <div 
        className="grid gap-8 flex-grow overflow-hidden"
        style={{ gridTemplateColumns: `${data.versoSplitRatio}% 1fr` }}
      >
        <div
          onClick={(e) => handleZoneClick(e, 'verso_institution')}
          title={isInteractive ? 'Clique para editar Dados da Instituição e Curso no Verso' : undefined}
          className={`space-y-8 ${getInteractiveClass('verso_institution')}`}
          style={{ transform: `translate(${data.versoInstitutionHorizontalOffset || 0}px, ${data.versoInstitutionVerticalOffset || 0}px)` }}
        >
          {data.providerName && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Empresa Fornecedora / Realização</p>
              <p className="font-semibold text-gray-700 leading-tight" style={{ fontSize: `${data.versoHeaderFontSize}px` }}>{data.providerName}</p>
              {data.providerCnpj && <p className="text-xs text-gray-500 mt-1">CNPJ: {data.providerCnpj}</p>}
            </div>
          )}
          
          <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 shadow-sm">
             <p className="text-[10px] font-bold text-blue-800 uppercase mb-2">Curso Ministrado</p>
             <p className="font-bold text-gray-800 leading-tight mb-2" style={{ fontSize: `${data.versoHeaderFontSize}px` }}>{data.courseName || '[NOME DO CURSO]'}</p>
             <p className="text-sm text-gray-600 font-bold">Carga Total: {data.totalHours || '0'}h</p>
          </div>
        </div>
        
        <div 
          onClick={(e) => handleZoneClick(e, 'verso_curriculum')}
          title={isInteractive ? 'Clique para editar a Tabela da Grade Curricular' : undefined}
          className={`flex flex-col h-full border rounded-lg overflow-hidden bg-white ${getInteractiveClass('verso_curriculum')}`}
          style={{ transform: `translate(${data.versoCurriculumHorizontalOffset || 0}px, ${data.versoCurriculumVerticalOffset || 0}px)` }}
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-900">
                <th className="px-4 py-3 text-white uppercase font-bold text-sm text-left">Disciplina / Módulo</th>
                {data.showHoursColumn && (
                  <th 
                    className="px-4 py-3 text-white text-center uppercase font-bold text-sm"
                    style={{ width: `${data.hoursColumnWidth || 80}px` }}
                  >
                    Horas
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                  <td className="px-4 text-gray-700 font-medium" style={rowPaddingStyle}>{item.subject}</td>
                  {data.showHoursColumn && (
                    <td 
                      className="px-4 text-center text-gray-600 font-mono font-bold" 
                      style={{ ...rowPaddingStyle, width: `${data.hoursColumnWidth || 80}px` }}
                    >
                      {item.hours}h
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          {isLastVersoPage ? (
            <div className="mt-auto bg-blue-50/50 p-4 border-t-2 border-blue-900 flex justify-between items-center font-bold">
               <span className="text-blue-900 uppercase text-xs">Carga Horária Total Final</span>
               <span className="text-blue-900 text-lg">{data.totalHours}h</span>
            </div>
          ) : (
            <div className="mt-auto bg-gray-50 p-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500 font-medium">
               <span>Continua na folha seguinte...</span>
               <span>Folha {versoPageNumber || 1} de {versoTotalPages}</span>
            </div>
          )}
        </div>
      </div>

      <div
        onClick={(e) => handleZoneClick(e, 'verso_footer')}
        title={isInteractive ? 'Clique para editar o Rodapé do Verso' : undefined}
        className={`mt-8 pt-4 border-t flex justify-between items-end opacity-60 ${getInteractiveClass('verso_footer')}`}
        style={{ transform: `translate(${data.versoFooterHorizontalOffset || 0}px, ${data.versoFooterVerticalOffset || 0}px)` }}
      >
        <div className="text-gray-400 max-w-md uppercase tracking-tighter" style={{ fontSize: `${data.versoFooterFontSize || data.footerFontSize}px` }}>
          Registro oficial da instituição para fins de comprovação acadêmica.
        </div>
        <div className="text-right">
          <p className="font-bold text-blue-900 uppercase" style={{ fontSize: `${(data.versoFooterFontSize || data.footerFontSize) + 2}px` }}>{data.companyName}</p>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
