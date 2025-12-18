
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import FormInput from './components/FormInput';
import CurriculumTable from './components/CurriculumTable';
import CertificatePreview from './components/CertificatePreview';
import { CertificateData, DEFAULT_BASE_TEXT, CurriculumItem, Student, Instructor } from './types';
import { fileToBase64 } from './utils/helpers';

const App: React.FC = () => {
  const [data, setData] = useState<CertificateData>({
    students: [],
    companyName: '',
    companyCnpj: '',
    address: '',
    instructors: [],
    techResponsibleName: '',
    techResponsibleCompetencies: '',
    showTechResponsible: true,
    courseName: '',
    courseDate: new Date().toLocaleDateString('pt-BR'),
    totalHours: '0',
    baseText: DEFAULT_BASE_TEXT,
    curriculum: [],
    bgImage: null,
    signatureImage: null,
    digitalSeal: null,
    showHoursColumn: true,
    versoSplitRatio: 40,
    hoursColumnWidth: 80,
    versoRowPadding: 12,
    versoCurriculumFontSize: 12,
    versoInstitutionVerticalOffset: 0,
    mainTextVerticalOffset: 0,
    titleVerticalOffset: 0,
    titleFontSize: 100,
    subtitleFontSize: 24,
    titleSpacing: 24,
    bodyVerticalOffset: 0,
    highlightNameVerticalOffset: 0,
    highlightNameFontSize: 80,
    frontSidePadding: 128, 
    signaturesVerticalOffset: 0,
    signaturesHorizontalPadding: 40,
    signatureFontSize: 14,
    frontTextAlign: 'center',
    boldVariables: [],
  });

  const [activeTab, setActiveTab] = useState<'dados' | 'visual' | 'grade'>('dados');
  const [previewPage, setPreviewPage] = useState<1 | 2>(1);
  const [currentStudentIdx, setCurrentStudentIdx] = useState(0);
  const [zoom, setZoom] = useState(0.5); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancingText, setIsEnhancingText] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCpf, setNewStudentCpf] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [newInstructorName, setNewInstructorName] = useState('');
  const [newInstructorCompetencies, setNewInstructorCompetencies] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setData(prev => ({ ...prev, [name]: checked }));
  };

  const handleBoldToggle = (tag: string) => {
    setData(prev => {
      const isBold = prev.boldVariables.includes(tag);
      return {
        ...prev,
        boldVariables: isBold 
          ? prev.boldVariables.filter(t => t !== tag)
          : [...prev.boldVariables, tag]
      };
    });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: parseInt(value) }));
  };

  const setTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    setData(prev => ({ ...prev, frontTextAlign: align }));
  };

  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = data.baseText;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + tag + after;
    setData(prev => ({ ...prev, baseText: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'bgImage' | 'signatureImage' | 'digitalSeal') => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setData(prev => ({ ...prev, [field]: base64 }));
    }
  };

  const addStudent = () => {
    if (newStudentName && newStudentCpf) {
      const newStudent: Student = {
        id: Math.random().toString(36).substring(2, 9),
        name: newStudentName,
        cpf: newStudentCpf,
        displayName: newStudentName // Default é o nome completo
      };
      setData(prev => ({ ...prev, students: [...prev.students, newStudent] }));
      setNewStudentName('');
      setNewStudentCpf('');
    }
  };

  const updateStudentDisplayName = (id: string, value: string) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === id ? { ...s, displayName: value } : s)
    }));
  };

  const removeStudent = (id: string) => {
    setData(prev => ({ ...prev, students: prev.students.filter(s => s.id !== id) }));
    if (currentStudentIdx >= data.students.length - 1) {
      setCurrentStudentIdx(Math.max(0, data.students.length - 2));
    }
  };

  const addInstructor = () => {
    if (newInstructorName.trim()) {
      const newInstructor: Instructor = {
        id: Math.random().toString(36).substring(2, 9),
        name: newInstructorName.trim(),
        competencies: newInstructorCompetencies.trim()
      };
      setData(prev => ({ ...prev, instructors: [...prev.instructors, newInstructor] }));
      setNewInstructorName('');
      setNewInstructorCompetencies('');
    }
  };

  const removeInstructor = (id: string) => {
    setData(prev => ({ ...prev, instructors: prev.instructors.filter(i => i.id !== id) }));
  };

  const handleBulkImport = () => {
    const lines = bulkInput.split('\n').filter(line => line.trim() !== '');
    const newStudents: Student[] = lines.map(line => {
      const parts = line.split(/[,\t;]/);
      const name = parts[0]?.trim() || 'Sem Nome';
      return {
        id: Math.random().toString(36).substring(2, 9),
        name: name,
        cpf: parts[1]?.trim() || '000.000.000-00',
        displayName: name
      };
    });
    setData(prev => ({ ...prev, students: [...prev.students, ...newStudents] }));
    setBulkInput('');
  };

  const handleAddCurriculum = (item: CurriculumItem) => {
    setData(prev => {
      const newCurriculum = [...prev.curriculum, item];
      const total = newCurriculum.reduce((acc, curr) => acc + curr.hours, 0);
      return { ...prev, curriculum: newCurriculum, totalHours: total.toString() };
    });
  };

  const handleUpdateCurriculum = (id: string, updatedItem: Partial<CurriculumItem>) => {
    setData(prev => {
      const newCurriculum = prev.curriculum.map(item => item.id === id ? { ...item, ...updatedItem } : item);
      const total = newCurriculum.reduce((acc, curr) => acc + curr.hours, 0);
      return { ...prev, curriculum: newCurriculum, totalHours: total.toString() };
    });
  };

  const handleRemoveCurriculum = (id: string) => {
    setData(prev => {
      const newCurriculum = prev.curriculum.filter(i => i.id !== id);
      const total = newCurriculum.reduce((acc, curr) => acc + curr.hours, 0);
      return { ...prev, curriculum: newCurriculum, totalHours: total.toString() };
    });
  };

  const enhanceTextWithGemini = async () => {
    if (!data.baseText) return;
    setIsEnhancingText(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Reescreva o seguinte texto de certificado para ser mais formal e elegante em português. Mantenha obrigatoriamente as variáveis {{NOME}}, {{CPF}}, {{CURSO}}, {{DATA}}, {{CARGA_HORARIA}}, {{CNPJ}}, {{ENDERECO}} e {{RAZAO_SOCIAL}}. Texto atual: ${data.baseText}`,
      });
      if (response.text) {
        setData(prev => ({ ...prev, baseText: response.text || prev.baseText }));
      }
    } catch (error) {
      console.error("Error enhancing text:", error);
      alert("Erro ao conectar com o Gemini API.");
    } finally {
      setIsEnhancingText(false);
    }
  };

  const exportAllToPDF = async () => {
    if (data.students.length === 0) {
      alert("Adicione pelo menos um aluno.");
      return;
    }
    setIsGenerating(true);
    try {
      // Usando milímetros (mm) para garantir o tamanho A4 exato
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4', // a4 landscape é 297mm x 210mm
      });

      for (let i = 0; i < data.students.length; i++) {
        const student = data.students[i];
        const p1 = document.getElementById(`export-p1-${student.id}`);
        if (p1) {
          const canvas1 = await html2canvas(p1, { 
            scale: 2, // Maior escala para impressão nítida
            useCORS: true,
            logging: false,
            width: 1123,
            height: 794
          });
          if (i > 0) pdf.addPage();
          pdf.addImage(canvas1.toDataURL('image/png'), 'PNG', 0, 0, 297, 210);
        }
      }

      const p2 = document.getElementById('export-p2-generic');
      if (p2) {
        pdf.addPage();
        const canvas2 = await html2canvas(p2, { 
          scale: 2, 
          useCORS: true,
          logging: false,
          width: 1123,
          height: 794
        });
        pdf.addImage(canvas2.toDataURL('image/png'), 'PNG', 0, 0, 297, 210);
      }
      
      pdf.save(`Certificados_${data.courseName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Houve um erro ao gerar o lote de PDFs.");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentStudent = data.students[currentStudentIdx] || null;
  const handleZoom = (delta: number) => setZoom(prev => Math.min(Math.max(prev + delta, 0.15), 1.5));

  const availableTags = [
    '{{NOME}}', '{{CPF}}', '{{CURSO}}', '{{DATA}}', '{{CARGA_HORARIA}}', 
    '{{RAZAO_SOCIAL}}', '{{CNPJ}}', '{{ENDERECO}}', '{{INSTRUTORES}}'
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Modal de Pré-visualização */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute top-4 right-4 flex gap-4">
             <button 
              onClick={exportAllToPDF}
              className="bg-green-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"
             >
               <i className="fa-solid fa-file-pdf"></i> Exportar Agora
             </button>
             <button 
              onClick={() => setIsPreviewOpen(false)}
              className="bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all"
             >
               <i className="fa-solid fa-xmark text-xl"></i>
             </button>
          </div>
          
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto scrollbar-hide py-10">
            <div className="flex flex-col items-center gap-12">
              <div className="space-y-4">
                <h3 className="text-white text-center font-bold uppercase tracking-widest opacity-50 text-sm">Página 1: Frente (A4 297x210mm)</h3>
                <div className="shadow-2xl ring-1 ring-white/10 rounded-lg overflow-hidden transform scale-[0.8] md:scale-100 origin-center">
                  <CertificatePreview data={data} student={currentStudent} page={1} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-white text-center font-bold uppercase tracking-widest opacity-50 text-sm">Página 2: Verso (A4 297x210mm)</h3>
                <div className="shadow-2xl ring-1 ring-white/10 rounded-lg overflow-hidden transform scale-[0.8] md:scale-100 origin-center">
                  <CertificatePreview data={data} student={null} page={2} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full md:w-[450px] bg-white shadow-xl flex flex-col max-h-screen overflow-hidden no-print z-20">
        <div className="p-6 bg-blue-900 text-white">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <i className="fa-solid fa-graduation-cap"></i>
            CertificaMaster
          </h1>
          <p className="text-xs opacity-75">Layout A4 (297x210mm) Ativo</p>
        </div>
        <div className="flex bg-gray-100 border-b">
          <button onClick={() => setActiveTab('dados')} className={`flex-1 py-3 text-xs font-bold uppercase transition-colors ${activeTab === 'dados' ? 'bg-white border-t-2 border-blue-900 text-blue-900' : 'text-gray-500'}`}>Alunos & Curso</button>
          <button onClick={() => setActiveTab('grade')} className={`flex-1 py-3 text-xs font-bold uppercase transition-colors ${activeTab === 'grade' ? 'bg-white border-t-2 border-blue-900 text-blue-900' : 'text-gray-500'}`}>Grade</button>
          <button onClick={() => setActiveTab('visual')} className={`flex-1 py-3 text-xs font-bold uppercase transition-colors ${activeTab === 'visual' ? 'bg-white border-t-2 border-blue-900 text-blue-900' : 'text-gray-500'}`}>Visual</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300">
          {activeTab === 'dados' && (
            <div className="animate-fadeIn space-y-6">
              <section>
                <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2"><i className="fa-solid fa-users"></i> Gerenciar Alunos</h2>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input type="text" placeholder="Nome Completo" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} className="px-3 py-2 text-sm border rounded bg-white" />
                  <input type="text" placeholder="CPF" value={newStudentCpf} onChange={(e) => setNewStudentCpf(e.target.value)} className="px-3 py-2 text-sm border rounded bg-white" />
                </div>
                <button onClick={addStudent} className="w-full bg-blue-600 text-white py-2 rounded text-sm font-bold hover:bg-blue-700 mb-4">Adicionar Aluno</button>
                
                {currentStudent && (
                  <div className="bg-blue-50 p-3 rounded border border-blue-100 mb-4 animate-fadeIn">
                    <label className="block text-[10px] font-bold text-blue-800 mb-1 uppercase">Texto de Destaque (Aluno Selecionado)</label>
                    <input 
                      type="text" 
                      placeholder="Nome p/ o Manuscrito" 
                      value={currentStudent.displayName || ''} 
                      onChange={(e) => updateStudentDisplayName(currentStudent.id, e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <p className="text-[9px] text-blue-400 mt-1 italic">* Edite como o nome deve aparecer na fonte manuscrita.</p>
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded border border-dashed mb-4">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Importação em Lote (Nome, CPF)</label>
                  <textarea placeholder="João Silva, 123.456.789-00&#10;Maria Souza, 987.654.321-11" className="w-full h-24 text-xs p-2 border rounded font-mono bg-white" value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} />
                  <button onClick={handleBulkImport} className="mt-2 text-xs font-bold text-blue-600 hover:underline">Processar Lista</button>
                </div>
                <div className="max-h-40 overflow-y-auto border rounded divide-y bg-white">
                  {data.students.length === 0 ? (<p className="p-4 text-center text-xs text-gray-400 italic">Nenhum aluno adicionado.</p>) : (
                    data.students.map((s, idx) => (
                      <div key={s.id} className={`flex items-center justify-between p-2 text-xs ${currentStudentIdx === idx ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}>
                        <div className="cursor-pointer flex-1 font-medium" onClick={() => setCurrentStudentIdx(idx)}><span className="font-bold">{idx + 1}.</span> {s.name}</div>
                        <button onClick={() => removeStudent(s.id)} className="text-red-500 px-2"><i className="fa-solid fa-trash-can"></i></button>
                      </div>
                    ))
                  )}
                </div>
              </section>
              <section>
                <h2 className="text-sm font-bold text-gray-500 uppercase mt-8 mb-4 flex items-center gap-2"><i className="fa-solid fa-book"></i> Informações do Curso</h2>
                <FormInput label="Nome do Curso" name="courseName" value={data.courseName} onChange={handleChange} />
                <div className="grid grid-cols-2 gap-2">
                  <FormInput label="Data de Conclusão" name="courseDate" value={data.courseDate} onChange={handleChange} />
                  <FormInput label="Carga Horária Total (Horas)" name="totalHours" value={data.totalHours} onChange={handleChange} />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instrutor(es)</label>
                  <div className="space-y-2 mb-2">
                    <input type="text" placeholder="Nome do Instrutor" value={newInstructorName} onChange={(e) => setNewInstructorName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white" />
                    <textarea placeholder="Competências" value={newInstructorCompetencies} onChange={(e) => setNewInstructorCompetencies(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white" />
                    <button onClick={addInstructor} className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-bold hover:bg-blue-700">Adicionar Instrutor</button>
                  </div>
                  <div className="max-h-32 overflow-y-auto border rounded divide-y bg-white">
                    {data.instructors.length === 0 ? (<p className="p-3 text-center text-xs text-gray-400 italic">Adicione instrutores.</p>) : (
                      data.instructors.map((ins) => (
                        <div key={ins.id} className="flex items-center justify-between p-2 text-xs">
                          <div><p className="font-bold">{ins.name}</p><p className="text-[10px] text-gray-500">{ins.competencies}</p></div>
                          <button onClick={() => removeInstructor(ins.id)} className="text-red-500 px-2"><i className="fa-solid fa-xmark"></i></button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <h2 className="text-sm font-bold text-gray-500 uppercase mt-8 mb-4 flex items-center gap-2"><i className="fa-solid fa-building"></i> Informações da Empresa</h2>
                <FormInput label="Razão Social" name="companyName" value={data.companyName} onChange={handleChange} />
                <FormInput label="CNPJ" name="companyCnpj" value={data.companyCnpj} onChange={handleChange} />
                <FormInput label="Endereço Completo" name="address" value={data.address} onChange={handleChange} multiline />
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-600 uppercase">Responsável Técnico</h3>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="showTechResponsible" 
                        name="showTechResponsible" 
                        checked={data.showTechResponsible} 
                        onChange={handleCheckboxChange} 
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <label htmlFor="showTechResponsible" className="text-[10px] font-bold text-gray-500 uppercase cursor-pointer">Exibir no Certificado</label>
                    </div>
                  </div>
                  <FormInput label="Nome" name="techResponsibleName" value={data.techResponsibleName} onChange={handleChange} placeholder="Ex: Eng. João da Silva" />
                  <FormInput label="Cargo / Competências" name="techResponsibleCompetencies" value={data.techResponsibleCompetencies} onChange={handleChange} placeholder="Ex: CREA 123456-D / Especialista em Segurança" multiline />
                </div>
              </section>
            </div>
          )}
          {activeTab === 'grade' && (
            <div className="animate-fadeIn space-y-6">
              <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-xs font-bold text-gray-600 uppercase mb-4 flex items-center gap-2"><i className="fa-solid fa-sliders"></i> Layout do Verso</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <input type="checkbox" id="showHoursColumn" name="showHoursColumn" checked={data.showHoursColumn} onChange={handleCheckboxChange} className="w-4 h-4 text-blue-600 rounded" />
                    <label htmlFor="showHoursColumn" className="text-sm font-medium text-gray-800 cursor-pointer">Exibir coluna de horas</label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1"><label className="text-xs font-bold text-gray-500 uppercase">Divisão</label><span className="text-xs font-mono font-bold text-blue-600">{data.versoSplitRatio}%</span></div>
                      <input type="range" name="versoSplitRatio" min="10" max="90" value={data.versoSplitRatio} onChange={handleSliderChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1"><label className="text-xs font-bold text-gray-500 uppercase">Espaçamento</label><span className="text-xs font-mono font-bold text-blue-600">{data.versoRowPadding}px</span></div>
                      <input type="range" name="versoRowPadding" min="2" max="40" value={data.versoRowPadding} onChange={handleSliderChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1"><label className="text-xs font-bold text-gray-500 uppercase">Fonte Disciplina</label><span className="text-xs font-mono font-bold text-blue-600">{data.versoCurriculumFontSize}px</span></div>
                      <input type="range" name="versoCurriculumFontSize" min="8" max="24" value={data.versoCurriculumFontSize} onChange={handleSliderChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1"><label className="text-xs font-bold text-gray-500 uppercase">Altura Instituição</label><span className="text-xs font-mono font-bold text-blue-600">{data.versoInstitutionVerticalOffset}px</span></div>
                      <input type="range" name="versoInstitutionVerticalOffset" min="-200" max="200" value={data.versoInstitutionVerticalOffset} onChange={handleSliderChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                  </div>
                </div>
              </section>
              <CurriculumTable items={data.curriculum} totalHours={data.totalHours} showHoursColumn={data.showHoursColumn} onAdd={handleAddCurriculum} onRemove={handleRemoveCurriculum} onUpdate={handleUpdateCurriculum} onUpdateTotal={(val) => setData(prev => ({ ...prev, totalHours: val }))} />
            </div>
          )}
          {activeTab === 'visual' && (
            <div className="animate-fadeIn space-y-6">
              <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-xs font-bold text-gray-600 uppercase mb-4 flex items-center gap-2"><i className="fa-solid fa-up-down-left-right"></i> Ajustes da Frente</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Alinhamento do Texto</label>
                    <div className="flex bg-white rounded border overflow-hidden">
                      {(['left', 'center', 'right', 'justify'] as const).map(align => (
                        <button key={align} onClick={() => setTextAlign(align)} className={`p-2 flex-1 flex items-center justify-center transition-colors ${data.frontTextAlign === align ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}><i className={`fa-solid fa-align-${align}`}></i></button>
                      ))}
                    </div>
                  </div>

                  {/* Controles de Título e Cabeçalho */}
                  <div className="bg-white p-3 rounded border border-gray-200 space-y-3 shadow-inner">
                    <p className="text-[10px] font-bold text-blue-900 uppercase flex items-center gap-1"><i className="fa-solid fa-heading"></i> Ajustes de Título</p>
                    <div>
                      <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Altura do Título (Bloco)</label></div>
                      <input type="range" name="titleVerticalOffset" min="-200" max="200" value={data.titleVerticalOffset} onChange={handleSliderChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Fonte Titulo 1</label><span className="text-[10px] font-mono font-bold text-blue-600">{data.titleFontSize}px</span></div>
                        <input type="range" name="titleFontSize" min="20" max="150" value={data.titleFontSize} onChange={handleSliderChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Fonte Titulo 2</label><span className="text-[10px] font-mono font-bold text-blue-600">{data.subtitleFontSize}px</span></div>
                        <input type="range" name="subtitleFontSize" min="10" max="80" value={data.subtitleFontSize} onChange={handleSliderChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Espaçamento Entre Linhas</label><span className="text-[10px] font-mono font-bold text-blue-600">{data.titleSpacing}px</span></div>
                      <input type="range" name="titleSpacing" min="0" max="100" value={data.titleSpacing} onChange={handleSliderChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Altura do Corpo</label></div>
                      <input type="range" name="bodyVerticalOffset" min="-200" max="200" value={data.bodyVerticalOffset} onChange={handleSliderChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Margem Lateral (Texto)</label><span className="text-[10px] font-mono font-bold text-blue-600">{data.frontSidePadding}px</span></div>
                      <input type="range" name="frontSidePadding" min="0" max="400" value={data.frontSidePadding} onChange={handleSliderChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                  </div>
                  
                  {/* Controles de Nome em Destaque */}
                  <div className="bg-white p-3 rounded border border-gray-200 space-y-3 shadow-inner">
                    <p className="text-[10px] font-bold text-blue-900 uppercase flex items-center gap-1"><i className="fa-solid fa-signature"></i> Nome em Destaque (Manuscrito)</p>
                    
                    {currentStudent ? (
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Conteúdo do Destaque</label>
                        <input 
                          type="text" 
                          value={currentStudent.displayName || ''} 
                          onChange={(e) => updateStudentDisplayName(currentStudent.id, e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border rounded bg-blue-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                          placeholder="Editar nome para o manuscrito..."
                        />
                      </div>
                    ) : (
                      <p className="text-[9px] text-gray-400 italic">Selecione um aluno na aba 'Dados' para editar seu texto.</p>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Tamanho da Fonte</label><span className="text-[10px] font-mono font-bold text-blue-600">{data.highlightNameFontSize}px</span></div>
                      <input type="range" name="highlightNameFontSize" min="20" max="150" value={data.highlightNameFontSize} onChange={handleSliderChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Altura do Nome</label><span className="text-[10px] font-mono font-bold text-blue-600">{data.highlightNameVerticalOffset}px</span></div>
                      <input type="range" name="highlightNameVerticalOffset" min="-200" max="200" value={data.highlightNameVerticalOffset} onChange={handleSliderChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                  </div>

                  {/* Novos controles de Assinatura */}
                  <div className="bg-blue-50 p-3 rounded border border-blue-200 space-y-3">
                    <p className="text-[10px] font-bold text-blue-900 uppercase flex items-center gap-1"><i className="fa-solid fa-file-signature"></i> Bloco de Assinaturas</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Altura Assinaturas</label></div>
                        <input type="range" name="signaturesVerticalOffset" min="-200" max="200" value={data.signaturesVerticalOffset} onChange={handleSliderChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Largura/Padding</label></div>
                        <input type="range" name="signaturesHorizontalPadding" min="0" max="150" value={data.signaturesHorizontalPadding} onChange={handleSliderChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Tamanho da Fonte (Assinaturas)</label><span className="text-[10px] font-mono font-bold text-blue-600">{data.signatureFontSize}px</span></div>
                      <input type="range" name="signatureFontSize" min="8" max="40" value={data.signatureFontSize} onChange={handleSliderChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-xs font-bold text-blue-900 uppercase mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-bold"></i> Destacar em Negrito
                </h3>
                <p className="text-[10px] text-gray-500 mb-3 leading-tight">Marque as variáveis que devem aparecer em negrito no texto final:</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {availableTags.map(tag => (
                    <label key={tag} className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          checked={data.boldVariables.includes(tag)}
                          onChange={() => handleBoldToggle(tag)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-[10px] font-mono text-gray-700 group-hover:text-blue-900 transition-colors">
                        {tag}
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto do Certificado</label>
                <div className="mb-2 p-3 bg-blue-50 rounded-lg border border-blue-100 flex flex-wrap gap-1">
                  {availableTags.map(tag => (
                    <button key={tag} onClick={() => insertTag(tag)} className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-[9px] font-mono text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">{tag}</button>
                  ))}
                </div>
                <textarea ref={textareaRef} name="baseText" value={data.baseText} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm h-48 text-sm font-mono bg-white outline-none" />
                <button onClick={enhanceTextWithGemini} disabled={isEnhancingText} className="mt-2 flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50"><i className={`fa-solid fa-wand-magic-sparkles ${isEnhancingText ? 'animate-spin' : ''}`}></i>{isEnhancingText ? 'Melhorando...' : 'Melhorar texto com IA'}</button>
              </div>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Arte de Fundo (Frente)</label><input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'bgImage')} className="text-xs block w-full text-gray-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Assinatura</label><input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'signatureImage')} className="text-xs block w-full text-gray-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Selo</label><input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'digitalSeal')} className="text-xs block w-full text-gray-500" /></div>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t bg-gray-50 flex flex-col gap-3">
          <button 
            onClick={() => setIsPreviewOpen(true)}
            disabled={data.students.length === 0}
            className="w-full bg-white border-2 border-blue-900 text-blue-900 font-bold py-2 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-eye"></i> Pré-visualizar (A4)
          </button>
          
          <button onClick={exportAllToPDF} disabled={isGenerating || data.students.length === 0} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2">
            {isGenerating ? (<><i className="fa-solid fa-circle-notch animate-spin"></i> Processando...</>) : (<><i className="fa-solid fa-file-pdf"></i> Exportar Lote em PDF</>)}
          </button>
        </div>
      </div>
      <div className="flex-1 bg-gray-200 p-8 overflow-auto flex flex-col items-center relative">
        <div className="mb-6 flex flex-col items-center gap-4 no-print sticky top-0 z-30 w-full">
          <div className="flex flex-wrap items-center justify-center gap-4 bg-white p-3 rounded-xl shadow-xl border border-gray-100">
            <div className={`flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border ${data.students.length === 0 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
              <button disabled={currentStudentIdx === 0} onClick={() => setCurrentStudentIdx(prev => prev - 1)} className="w-8 h-8 flex items-center justify-center bg-white border rounded-full text-blue-900 hover:bg-blue-50 disabled:opacity-30"><i className="fa-solid fa-chevron-left"></i></button>
              <div className="text-xs font-bold text-blue-900 min-w-[150px] text-center">
                {data.students.length > 0 ? (<>Aluno {currentStudentIdx + 1} de {data.students.length}: <span className="block text-[10px] text-gray-500 truncate max-w-[140px] uppercase">{currentStudent?.name}</span></>) : (<span className="text-gray-400 italic">Nenhum aluno</span>)}
              </div>
              <button disabled={currentStudentIdx === data.students.length - 1 || data.students.length === 0} onClick={() => setCurrentStudentIdx(prev => prev + 1)} className="w-8 h-8 flex items-center justify-center bg-white border rounded-full text-blue-900 hover:bg-blue-50 disabled:opacity-30"><i className="fa-solid fa-chevron-right"></i></button>
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-1 border">
              <button onClick={() => setPreviewPage(1)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${previewPage === 1 ? 'bg-white shadow-sm text-blue-900' : 'text-gray-500'}`}>FRENTE</button>
              <button onClick={() => setPreviewPage(2)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${previewPage === 2 ? 'bg-white shadow-sm text-blue-900' : 'text-gray-500'}`}>VERSO</button>
            </div>
            <div className="flex items-center bg-blue-50 rounded-lg px-2 py-1 gap-2 border border-blue-100">
              <button onClick={() => handleZoom(-0.1)} className="w-10 h-10 flex items-center justify-center bg-white border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-600 hover:text-white transition-all"><i className="fa-solid fa-magnifying-glass-minus text-lg"></i></button>
              <div className="flex flex-col items-center min-w-[60px] px-1"><span className="text-[10px] uppercase font-bold text-blue-400">Zoom</span><span className="text-sm font-bold text-blue-900">{Math.round(zoom * 100)}%</span></div>
              <button onClick={() => handleZoom(0.1)} className="w-10 h-10 flex items-center justify-center bg-white border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-600 hover:text-white transition-all"><i className="fa-solid fa-magnifying-glass-plus text-lg"></i></button>
            </div>
          </div>
        </div>
        <div className="origin-top shadow-2xl transition-transform duration-300 ease-out mb-20" style={{ transform: `scale(${zoom})`, marginTop: '20px' }}>
           <CertificatePreview data={data} student={previewPage === 1 ? currentStudent : null} page={previewPage} />
        </div>
        {/* Container Oculto para Exportação - Forçando Dimensões A4 */}
        <div className="fixed top-[-9999px] left-[-9999px]">
          {data.students.map(student => (
            <div key={student.id} id={`export-p1-${student.id}`} style={{ width: '1123px', height: '794px' }}>
              <CertificatePreview data={data} student={student} page={1} />
            </div>
          ))}
          <div id="export-p2-generic" style={{ width: '1123px', height: '794px' }}>
            <CertificatePreview data={data} student={null} page={2} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
