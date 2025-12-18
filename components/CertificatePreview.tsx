
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
  // 1123px x 794px é a representação de 297mm x 210mm a 96DPI
  const bgStyle: React.CSSProperties = data.bgImage
    ? { backgroundImage: `url(${data.bgImage})`, backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
    : { backgroundColor: '#ffffff', border: '16px solid #1e3a8a' };

  if (page === 1) {
    const formattedText = replaceVariables(data.baseText, data, student);
    const displayHighlightName = student?.displayName || student?.name || '[NOME DE DESTAQUE]';

    return (
      <div
        id={`certificate-page-1${idSuffix}`}
        className="relative w-[1123px] h-[794px] shadow-2xl overflow-hidden bg-white mx-auto certificate-font"
        style={bgStyle}
      >
        <div 
          className={`absolute inset-0 flex flex-col items-center justify-center py-10 ${data.bgImage ? 'bg-transparent' : 'bg-white/70 backdrop-blur-[1px]'}`}
          style={{ 
            paddingLeft: `${data.frontSidePadding}px`, 
            paddingRight: `${data.frontSidePadding}px` 
          }}
        >
          {/* Título Principal */}
          <div 
            style={{ transform: `translateY(${data.titleVerticalOffset}px)` }} 
            className="w-full text-center mb-10 flex flex-col items-center"
          >
            <h1 
              style={{ fontSize: `${data.titleFontSize}px` }}
              className="font-bold text-blue-900 uppercase tracking-widest leading-[0.8]"
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
          
          {/* Nome em Destaque */}
          <div 
            className="script-font text-blue-900 w-full text-center transition-all duration-300"
            style={{ 
              fontSize: `${data.highlightNameFontSize}px`,
              transform: `translateY(${data.highlightNameVerticalOffset}px)`,
              margin: '30px 0'
            }}
          >
            {displayHighlightName}
          </div>

          <div 
            className="w-full h-[2px] bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-10"
            style={{ transform: `translateY(${data.highlightNameVerticalOffset}px)` }}
          ></div>
          
          {/* Corpo do Texto */}
          <div 
            className="text-2xl leading-relaxed text-gray-800 mb-16 whitespace-pre-wrap transition-all duration-300 w-full px-6"
            style={{ 
              transform: `translateY(${data.bodyVerticalOffset}px)`,
              textAlign: data.frontTextAlign
            }}
            dangerouslySetInnerHTML={{ __html: formattedText }}
          />

          {/* Área de Assinaturas */}
          <div 
            className={`w-full mt-auto flex items-end transition-all duration-300 ${data.showTechResponsible ? 'justify-between' : 'justify-around'}`}
            style={{ 
              transform: `translateY(${data.signaturesVerticalOffset}px)`,
              paddingLeft: `${data.signaturesHorizontalPadding}px`,
              paddingRight: `${data.signaturesHorizontalPadding}px`
            }}
          >
            {/* Instrutor */}
            <div className="flex flex-col items-center text-center min-w-[250px]">
              <div className="h-20 flex items-end justify-center mb-2">
                {data.signatureImage && (
                   <img src={data.signatureImage} alt="Assinatura" className="h-20 object-contain" />
                )}
              </div>
              <div className="w-full border-t border-gray-400 mb-2"></div>
              {data.instructors.length > 0 ? (
                <>
                  <p style={{ fontSize: `${data.signatureFontSize}px` }} className="font-bold uppercase text-gray-800 leading-tight">
                    {data.instructors[0].name}
                  </p>
                  <p style={{ fontSize: `${Math.max(8, data.signatureFontSize * 0.7)}px` }} className="text-gray-500 max-w-[200px] leading-tight mt-1">
                    {data.instructors[0].competencies}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: `${data.signatureFontSize}px` }} className="font-bold uppercase text-gray-400">Instrutor Responsável</p>
              )}
            </div>

            {/* Aluno */}
            <div className="flex flex-col items-center text-center min-w-[250px]">
              <div className="h-20 w-full flex items-end justify-center mb-2"></div>
              <div className="w-full border-t border-gray-400 mb-2"></div>
              <p style={{ fontSize: `${data.signatureFontSize}px` }} className="font-bold uppercase text-gray-800 leading-tight">
                {student?.name || '[NOME DO ALUNO]'}
              </p>
              <p style={{ fontSize: `${Math.max(8, data.signatureFontSize * 0.7)}px` }} className="font-bold text-gray-400 uppercase">Aluno</p>
            </div>

            {/* Responsável Técnico */}
            {data.showTechResponsible && (
              <div className="flex flex-col items-center text-center min-w-[250px]">
                <div className="h-20 flex items-end justify-center mb-2">
                   {data.digitalSeal && (
                     <img src={data.digitalSeal} alt="Selo" className="h-20 object-contain" />
                   )}
                </div>
                <div className="w-full border-t border-gray-400 mb-2"></div>
                {data.techResponsibleName ? (
                  <>
                    <p style={{ fontSize: `${data.signatureFontSize}px` }} className="font-bold uppercase text-gray-800 leading-tight">
                      {data.techResponsibleName}
                    </p>
                    <p style={{ fontSize: `${Math.max(8, data.signatureFontSize * 0.7)}px` }} className="text-gray-500 max-w-[200px] leading-tight mt-1">
                      {data.techResponsibleCompetencies || 'Responsável Técnico'}
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: `${data.signatureFontSize}px` }} className="font-bold uppercase text-gray-400">Responsável Técnico</p>
                )}
              </div>
            )}
          </div>
          
          <div className="absolute bottom-4 w-full px-10 text-[9px] text-gray-400 uppercase tracking-tighter text-center" style={{ left: 0 }}>
             {data.companyName} - {data.companyCnpj} {data.address && `| ${data.address.replace(/\n/g, ' ')}`}
          </div>
        </div>
      </div>
    );
  }

  const rowPaddingStyle: React.CSSProperties = { 
    paddingTop: `${data.versoRowPadding}px`, 
    paddingBottom: `${data.versoRowPadding}px`,
    fontSize: `${data.versoCurriculumFontSize}px`
  };

  return (
    <div
      id={`certificate-page-2${idSuffix}`}
      className="relative w-[1123px] h-[794px] shadow-2xl overflow-hidden bg-white mx-auto p-6 certificate-font flex flex-col"
      style={{ border: '4px solid #f3f4f6' }}
    >
      <h2 className="text-2xl font-bold text-blue-900 mb-1 border-b-2 border-blue-900 pb-0.5 uppercase tracking-wide">Conteúdo Programático</h2>
      
      <div 
        className="grid gap-4 flex-grow overflow-hidden mt-4"
        style={{ gridTemplateColumns: `${data.versoSplitRatio}% 1fr` }}
      >
        <div className="space-y-3" style={{ transform: `translateY(${data.versoInstitutionVerticalOffset}px)` }}>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase">Instituição</p>
            <p className="text-lg font-semibold text-blue-900 leading-tight">{data.companyName || '[EMPRESA]'}</p>
            <p className="text-xs text-gray-500">CNPJ: {data.companyCnpj || '[CNPJ]'}</p>
          </div>
          
          <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
             <p className="text-[9px] font-bold text-blue-800 uppercase mb-0.5">Curso</p>
             <p className="text-base font-bold text-gray-800 leading-tight mb-1">{data.courseName || '[NOME DO CURSO]'}</p>
             <p className="text-xs text-gray-600 font-bold">Carga Total: {data.totalHours || '0'}h</p>
          </div>

          <div className="text-[10px] text-gray-500 border-l-2 pl-3 py-1">
            <span className="font-bold block text-gray-400">Sede:</span>
            {data.address || '[ENDEREÇO]'}
          </div>
        </div>
        
        <div className="flex flex-col overflow-hidden">
          <table className="w-full text-left border-collapse border border-gray-100">
            <thead>
              <tr className="bg-blue-900">
                <th className="px-3 text-white uppercase font-bold text-xs" style={rowPaddingStyle}>Disciplina / Módulo</th>
                {data.showHoursColumn && (
                  <th className="px-3 text-white text-center uppercase font-bold text-xs" style={{ ...rowPaddingStyle, width: `${data.hoursColumnWidth}px` }}>Horas</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.curriculum.length > 0 ? (
                data.curriculum.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                    <td className="px-3 text-gray-700 font-medium" style={rowPaddingStyle}>{item.subject}</td>
                    {data.showHoursColumn && (
                      <td className="px-3 text-center text-gray-600 font-mono font-bold" style={rowPaddingStyle}>{item.hours}h</td>
                    )}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={2} className="p-8 text-center text-gray-300 italic text-xs">Sem disciplinas registradas.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50/50 font-bold border-t-2 border-blue-900">
                <td className="px-3 text-blue-900 uppercase text-xs" style={rowPaddingStyle}>
                  Carga Horária Total Final {!data.showHoursColumn && `: ${data.totalHours}h`}
                </td>
                {data.showHoursColumn && (
                  <td className="px-3 text-center text-blue-900 font-bold" style={rowPaddingStyle}>
                    {data.totalHours}h
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-4 pt-2 border-t flex justify-between items-end opacity-60">
        <div className="text-[7px] text-gray-400 max-w-md uppercase tracking-tighter">
          Folha de Verso (A4) - Documento de registro acadêmico.
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-blue-900 uppercase leading-none">{data.companyName}</p>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
