import { useState, useCallback, useMemo } from 'react';
import { CertificateData, DEFAULT_BASE_TEXT, Student, Instructor, CurriculumItem } from '../types';
import { generateId, formatHighlightName } from '../utils/helpers';
import { formatCPF } from '../utils/security';
import { calculateCurriculumHours, checkWorkloadDivergence, WorkloadDivergenceInfo } from '../utils/workloadCalculator';

export const INITIAL_CERTIFICATE_DATA: CertificateData = {
  students: [],
  companyName: '',
  companyCnpj: '',
  address: '',
  providerName: '',
  providerCnpj: '',
  instructors: [],
  techResponsibleName: '',
  techResponsibleCompetencies: '',
  showTechResponsible: true,
  courseName: '',
  courseDate: new Date().toLocaleDateString('pt-BR'),
  totalHours: '0',
  workloadMode: 'auto',
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
  versoHeaderFontSize: 16,
  versoTitleFontSize: 30,
  versoFooterFontSize: 9,
  footerFontSize: 9,
  versoInstitutionVerticalOffset: 0,
  versoCurriculumVerticalOffset: 0,
  mainTextVerticalOffset: 0,
  titleVerticalOffset: 0,
  titleFontSize: 100,
  subtitleFontSize: 24,
  titleSpacing: 24,
  bodyVerticalOffset: 0,
  bodyFontSize: 24,
  highlightNameVerticalOffset: 0,
  highlightNameFontSize: 80,
  frontSidePadding: 128, 
  signaturesVerticalOffset: 0,
  signaturesHorizontalPadding: 40,
  signatureFontSize: 14,
  frontTextAlign: 'center',
  boldVariables: [],
  frontHeaderPadding: 60,
  frontFooterPadding: 24,
  versoHeaderPadding: 48,
  versoFooterPadding: 32,
  frontBorderWidth: 16,
  frontBorderMargin: 0,
  versoBorderWidth: 4,
  versoSidePadding: 64,
};

export const MAX_INSTRUCTORS = 4;

/* ========================================================================= */
/* TRANSFORMAÇÕES PURAS DE DOMÍNIO (100% TESTÁVEIS E DETERMINÍSTICAS)       */
/* ========================================================================= */

export function addStudentToData(data: CertificateData, name: string, rawCpf: string): { data: CertificateData; newStudent: Student } {
  const trimmedName = name.trim();
  const trimmedCpf = rawCpf.trim();
  const newStudent: Student = {
    id: generateId(),
    name: trimmedName,
    cpf: formatCPF(trimmedCpf),
    displayName: formatHighlightName(trimmedName)
  };
  return {
    data: { ...data, students: [...data.students, newStudent] },
    newStudent
  };
}

export function removeStudentFromData(data: CertificateData, id: string): CertificateData {
  return { ...data, students: data.students.filter(s => s.id !== id) };
}

export function addInstructorToData(data: CertificateData, name: string, competencies: string): { data: CertificateData; error?: string } {
  if (!name.trim()) {
    return { data, error: 'O nome do instrutor é obrigatório.' };
  }
  if (data.instructors.length >= MAX_INSTRUCTORS) {
    return {
      data,
      error: `Limite atingido: O certificado comporta até ${MAX_INSTRUCTORS} blocos de assinatura de instrutores simultâneos.`
    };
  }
  const newInst: Instructor = {
    id: generateId(),
    name: name.trim(),
    competencies: competencies.trim()
  };
  return {
    data: { ...data, instructors: [...data.instructors, newInst] }
  };
}

export function removeInstructorFromData(data: CertificateData, id: string): CertificateData {
  return { ...data, instructors: data.instructors.filter(i => i.id !== id) };
}

export function addCurriculumItemToData(data: CertificateData, item: CurriculumItem): CertificateData {
  const newCurriculum = [...data.curriculum, item];
  if (data.workloadMode === 'manual') {
    return { ...data, curriculum: newCurriculum };
  }
  const sum = calculateCurriculumHours(newCurriculum);
  return { ...data, curriculum: newCurriculum, totalHours: sum.toString() };
}

export function updateCurriculumItemInData(data: CertificateData, id: string, updatedFields: Partial<CurriculumItem>): CertificateData {
  const newCurriculum = data.curriculum.map(item => item.id === id ? { ...item, ...updatedFields } : item);
  if (data.workloadMode === 'manual') {
    return { ...data, curriculum: newCurriculum };
  }
  const sum = calculateCurriculumHours(newCurriculum);
  return { ...data, curriculum: newCurriculum, totalHours: sum.toString() };
}

export function removeCurriculumItemFromData(data: CertificateData, id: string): CertificateData {
  const newCurriculum = data.curriculum.filter(i => i.id !== id);
  if (data.workloadMode === 'manual') {
    return { ...data, curriculum: newCurriculum };
  }
  const sum = calculateCurriculumHours(newCurriculum);
  return { ...data, curriculum: newCurriculum, totalHours: sum.toString() };
}

export function setTotalHoursManualInData(data: CertificateData, hours: string): CertificateData {
  return {
    ...data,
    totalHours: hours,
    workloadMode: 'manual'
  };
}

export function toggleBoldVariableInData(data: CertificateData, variable: string): CertificateData {
  const isBold = data.boldVariables.includes(variable);
  return {
    ...data,
    boldVariables: isBold
      ? data.boldVariables.filter(v => v !== variable)
      : [...data.boldVariables, variable]
  };
}

/* ========================================================================= */
/* HOOK DE GERENCIAMENTO DE ESTADO DO CERTIFICADO                            */
/* ========================================================================= */

export function useCertificateData(initialData?: Partial<CertificateData>) {
  const [data, setData] = useState<CertificateData>(() => ({
    ...INITIAL_CERTIFICATE_DATA,
    ...initialData
  }));

  const [currentStudentIdx, setCurrentStudentIdx] = useState<number>(0);

  // Aluno atualmente selecionado
  const currentStudent = useMemo<Student | null>(() => {
    if (data.students.length === 0) return null;
    const safeIdx = Math.min(Math.max(0, currentStudentIdx), data.students.length - 1);
    return data.students[safeIdx] || null;
  }, [data.students, currentStudentIdx]);

  // Carga horária calculada e divergência (CM-ALTO-005)
  const calculatedHours = useMemo(() => calculateCurriculumHours(data.curriculum), [data.curriculum]);

  const workloadDivergence = useMemo<WorkloadDivergenceInfo>(() => {
    return checkWorkloadDivergence(data.curriculum, data.totalHours, data.workloadMode || 'auto');
  }, [data.curriculum, data.totalHours, data.workloadMode]);

  // Atualização genérica de campos
  const updateField = useCallback(<K extends keyof CertificateData>(name: K, value: CertificateData[K]) => {
    setData(prev => ({ ...prev, [name]: value }));
  }, []);

  const updateFields = useCallback((fields: Partial<CertificateData>) => {
    setData(prev => ({ ...prev, ...fields }));
  }, []);

  // Gestão de Carga Horária (CM-ALTO-005)
  const setTotalHoursManual = useCallback((hours: string) => {
    setData(prev => setTotalHoursManualInData(prev, hours));
  }, []);

  const setWorkloadMode = useCallback((mode: 'auto' | 'manual') => {
    setData(prev => {
      if (mode === 'auto') {
        const sum = calculateCurriculumHours(prev.curriculum);
        return {
          ...prev,
          workloadMode: 'auto',
          totalHours: sum.toString()
        };
      }
      return { ...prev, workloadMode: 'manual' };
    });
  }, []);

  const recalculateWorkloadFromCurriculum = useCallback(() => {
    setData(prev => {
      const sum = calculateCurriculumHours(prev.curriculum);
      return {
        ...prev,
        workloadMode: 'auto',
        totalHours: sum.toString()
      };
    });
  }, []);

  // Gestão de Alunos
  const addStudent = useCallback((name: string, rawCpf: string): { success: boolean; error?: string } => {
    setData(prev => addStudentToData(prev, name, rawCpf).data);
    return { success: true };
  }, []);

  const bulkAddStudents = useCallback((students: Student[]) => {
    if (students.length === 0) return;
    setData(prev => ({
      ...prev,
      students: [...prev.students, ...students]
    }));
  }, []);

  const updateStudentDisplayName = useCallback((id: string, value: string) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === id ? { ...s, displayName: value } : s)
    }));
  }, []);

  const removeStudent = useCallback((id: string) => {
    setData(prev => removeStudentFromData(prev, id));
    setCurrentStudentIdx(prevIdx => {
      if (prevIdx >= data.students.length - 1) {
        return Math.max(0, data.students.length - 2);
      }
      return prevIdx;
    });
  }, [data.students.length]);

  // Gestão de Múltiplos Instrutores (CM-ALTO-004: 1 a 4 instrutores)
  const addInstructor = useCallback((name: string, competencies: string): { success: boolean; error?: string } => {
    const res = addInstructorToData(data, name, competencies);
    if (res.error) {
      return { success: false, error: res.error };
    }
    setData(res.data);
    return { success: true };
  }, [data]);

  const removeInstructor = useCallback((id: string) => {
    setData(prev => removeInstructorFromData(prev, id));
  }, []);

  // Gestão de Grade Curricular
  const addCurriculumItem = useCallback((item: CurriculumItem) => {
    setData(prev => addCurriculumItemToData(prev, item));
  }, []);

  const updateCurriculumItem = useCallback((id: string, updatedFields: Partial<CurriculumItem>) => {
    setData(prev => updateCurriculumItemInData(prev, id, updatedFields));
  }, []);

  const removeCurriculumItem = useCallback((id: string) => {
    setData(prev => removeCurriculumItemFromData(prev, id));
  }, []);

  // Gestão Visual e Formatação
  const setTextAlign = useCallback((align: 'left' | 'center' | 'right' | 'justify') => {
    setData(prev => ({ ...prev, frontTextAlign: align }));
  }, []);

  const toggleBoldVariable = useCallback((variable: string) => {
    setData(prev => toggleBoldVariableInData(prev, variable));
  }, []);

  const setImageField = useCallback((field: 'bgImage' | 'signatureImage' | 'digitalSeal', base64: string | null) => {
    setData(prev => ({ ...prev, [field]: base64 }));
  }, []);

  // Carga de Projeto Completo
  const loadFullProject = useCallback((newData: CertificateData) => {
    setData(newData);
    setCurrentStudentIdx(0);
  }, []);

  // Reset Geral
  const resetToDefaults = useCallback(() => {
    setData(INITIAL_CERTIFICATE_DATA);
    setCurrentStudentIdx(0);
  }, []);

  return {
    data,
    currentStudent,
    currentStudentIdx,
    setCurrentStudentIdx,
    calculatedHours,
    workloadDivergence,
    updateField,
    updateFields,
    setTotalHoursManual,
    setWorkloadMode,
    recalculateWorkloadFromCurriculum,
    addStudent,
    bulkAddStudents,
    updateStudentDisplayName,
    removeStudent,
    addInstructor,
    removeInstructor,
    addCurriculumItem,
    updateCurriculumItem,
    removeCurriculumItem,
    setTextAlign,
    toggleBoldVariable,
    setImageField,
    loadFullProject,
    resetToDefaults,
  };
}
