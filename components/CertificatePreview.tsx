
import React from 'react';
import { CertificateData, Student } from '../types';
import { replaceVariables } from '../utils/helpers';

interface CertificatePreviewProps {
  data: CertificateData;
  student: Student | null;
  page: 1 | 2;
  idSuffix?: string;
}

const CertificatePreview: React.FC<CertificatePreviewProps> = ({ data, student, page, idSuffix = "" }) => {
  const bgStyle: React.CSSProperties = data.bgImage
    ? { backgroundImage: `url(${data.bgImage})`, backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
    : { backgroundColor: '#ffffff', border: '16px solid #1e3a8a' };

  if (page === 1) {
    const formattedText = replaceVariables(data.baseText, data, student);
    const displayHighlightName = student?.displayName || student?.name || '[NOME DE DESTAQUE]';

    return (
      <div
        id={`certificate-page-1${idSuffix}`}
        className="relative w-[1123px] h-[794px] bg-white mx-auto certificate-font box-border overflow-hidden"
        style={bgStyle}
      >
        <div 
          className="absolute inset-0 flex flex-col"
          style={{ 
            paddingLeft: `${data.frontSidePadding}px`, 
            paddingRight: `${data.frontSidePadding}px`,
            paddingTop: '60px',
            paddingBottom: '40px'
          }}
        >
          {/* ZONA 1: TÍTULO (Âncora Superior) */}
          <div 
            className="w-full text-center flex flex-col items-center"
            style={{ transform: `translateY(${data.titleVerticalOffset}px)` }}
          >
            <h1 
              style={{ fontSize: `${data.titleFontSize}px` }}
              className="font-bold text-blue-900 uppercase tracking-widest leading-[1]"
            >
              Certificado
            </h1>
            <p 
              style={{ fontSize: `${data.subtitleFontSize}px`, marginTop: `${data.titleSpacing}px` }}
              className="font-medium text-gray-500 tracking-[0.4em] uppercase"
            >
              DE PARTICIPAÇÃO
            </p>
          </div>
          
          {/* ZONA 2: NOME MANUSCRITO (Centro-Superior) */}
          <div 
            className="w-full flex items-center justify-center"
            style={{ height: '140px', marginTop: '20px', transform: `translateY(${data.highlightNameVerticalOffset}px)` }}
          >
            <div 
              className="script-font text-blue-900 text-center w-full leading-none"
              style={{ fontSize: `${data.highlightNameFontSize}px` }}
            >
              {displayHighlightName}
            </div>
          </div>

          <div 
            className="w-full h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent"
            style={{ marginBottom: '30px', transform: `translateY(${data.highlightNameVerticalOffset}px)` }}
          ></div>
          
          {/* ZONA 3: CORPO DO TEXTO (Centro) */}
          <div 
            className="text-2xl leading-relaxed text-gray-800 whitespace-pre-wrap w-full px-6 flex-grow flex items-center"
            style={{ 
              transform: `translateY(${data.bodyVerticalOffset}px)`,
              textAlign: data.frontTextAlign,
              maxHeight: '280px'
            }}
          >
            <div className="w-full" dangerouslySetInnerHTML={{ __html: formattedText }} />
          </div>

          {/* ZONA 4: ASSINATURAS (Âncora Inferior) */}
          <div 
            className={`w-full flex items-end ${data.showTechResponsible ? 'justify-between' : 'justify-around'}`}
            style={{ 
              transform: `translateY(${data.signaturesVerticalOffset}px)`,
              paddingLeft: `${data.signaturesHorizontalPadding}px`,
              paddingRight: `${data.signaturesHorizontalPadding}px`,
              minHeight: '160px'
            }}
          >
            {/* Instrutor */}
            <div className="flex flex-col items-center text-center min-w-[220px]">
              <div className="h-20 flex items-end justify-center mb-2">
                {data.signatureImage && <img src={data.signatureImage} className="h-full object-contain" />}
              </div>
              <div className="w-full border-t border-gray-400 mb-1"></div>
              <p style={{ fontSize: `${data.signatureFontSize}px` }} className="font-bold uppercase text-gray-800 leading-tight">
                {data.instructors[0]?.name || 'Instrutor Responsável'}
              </p>
              {data.instructors[0]?.competencies && (
                <p style={{ fontSize: `${Math.max(8, data.signatureFontSize * 0.7)}px` }} className="text-gray-500 max-w-[200px] leading-tight mt-1">
                  {data.instructors[0].competencies}
                </p>
              )}
            </div>

            {/* Aluno */}
            <div className="flex flex-col items-center text-center min-w-[220px]">
              <div className="h-20 flex items-end justify-center mb-2"></div>
              <div className="w-full border-t border-gray-400 mb-1"></div>
              <p style={{ fontSize: `${data.signatureFontSize}px` }} className="font-bold uppercase text-gray-800 leading-tight">
                {student?.name || '[NOME DO ALUNO]'}
              </p>
              <p style={{ fontSize: `${Math.max(8, data.signatureFontSize * 0.7)}px` }} className="font-bold text-gray-400 uppercase mt-1">
                Aluno
              </p>
            </div>

            {/* Responsável Técnico */}
            {data.showTechResponsible && (
              <div className="flex flex-col items-center text-center min-w-[220px]">
                <div className="h-20 flex items-end justify-center mb-2">
                   {data.digitalSeal && <img src={data.digitalSeal} className="h-full object-contain" />}
                </div>
                <div className="w-full border-t border-gray-400 mb-1"></div>
                <p style={{ fontSize: `${data.signatureFontSize}px` }} className="font-bold uppercase text-gray-800 leading-tight">
                  {data.techResponsibleName || 'Responsável Técnico'}
                </p>
                {data.techResponsibleCompetencies && (
                  <p style={{ fontSize: `${Math.max(8, data.signatureFontSize * 0.7)}px` }} className="text-gray-500 max-w-[200px] leading-tight mt-1">
                    {data.techResponsibleCompetencies}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* RODAPÉ FIXO */}
          <div 
            className="absolute bottom-6 w-full px-10 text-gray-400 uppercase tracking-tighter text-center" 
            style={{ left: 0, fontSize: `${data.footerFontSize}px` }}
          >
             {data.companyName} - {data.companyCnpj} {data.address && `| ${data.address.replace(/\n/g, ' ')}`}
          </div>
        </div>
      </div>
    );
  }

  // VERSO (Simplificado e Rígido)
  const rowPaddingStyle: React.CSSProperties = { 
    paddingTop: `${data.versoRowPadding}px`, 
    paddingBottom: `${data.versoRowPadding}px`,
    fontSize: `${data.versoCurriculumFontSize}px`
  };

  return (
    <div
      id={`certificate-page-2${idSuffix}`}
      className="relative w-[1123px] h-[794px] bg-white mx-auto p-12 certificate-font box-border flex flex-col"
      style={{ border: '4px solid #f3f4f6' }}
    >
      <h2 className="text-3xl font-bold text-blue-900 mb-6 border-b-4 border-blue-900 pb-2 uppercase tracking-wide">Conteúdo Programático</h2>
      
      <div 
        className="grid gap-8 flex-grow overflow-hidden"
        style={{ gridTemplateColumns: `${data.versoSplitRatio}% 1fr` }}
      >
        <div className="space-y-8" style={{ transform: `translateY(${data.versoInstitutionVerticalOffset}px)` }}>
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
        
        <div className="flex flex-col h-full border rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-900">
                <th className="px-4 py-3 text-white uppercase font-bold text-sm">Disciplina / Módulo</th>
                {data.showHoursColumn && (
                  <th className="px-4 py-3 text-white text-center uppercase font-bold text-sm w-24">Horas</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.curriculum.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                  <td className="px-4 text-gray-700 font-medium" style={rowPaddingStyle}>{item.subject}</td>
                  {data.showHoursColumn && (
                    <td className="px-4 text-center text-gray-600 font-mono font-bold" style={rowPaddingStyle}>{item.hours}h</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-auto bg-blue-50/50 p-4 border-t-2 border-blue-900 flex justify-between items-center font-bold">
             <span className="text-blue-900 uppercase text-xs">Carga Horária Total Final</span>
             <span className="text-blue-900 text-lg">{data.totalHours}h</span>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t flex justify-between items-end opacity-60">
        <div className="text-gray-400 max-w-md uppercase tracking-tighter" style={{ fontSize: `${data.footerFontSize}px` }}>
          Registro oficial da instituição para fins de comprovação acadêmica.
        </div>
        <div className="text-right">
          <p className="font-bold text-blue-900 uppercase" style={{ fontSize: `${data.footerFontSize + 2}px` }}>{data.companyName}</p>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
