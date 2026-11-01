/**
 * CertificaMaster - Planejador de Tarefas de Emissão de PDF (Export Planner)
 * Gate 03: Mapeamento determinístico de páginas e ordenação Duplex estrita (CM-CRIT-001)
 */

import { Student, CertificateData } from '../../types';
import { ExportMode, PageRenderTask } from './types';
import { paginateCurriculum, needsDuplexFillerPage } from './curriculumPaginator';

/**
 * Sanitiza nomes de arquivos para evitar caracteres ilegais em qualquer SO.
 */
export const sanitizeFileName = (name: string): string => {
  if (!name) return 'Documento';
  return name
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
};

/**
 * Gera um nome de arquivo padronizado, seguro e previsível para o PDF exportado.
 */
export const generatePDFFileName = (
  courseName: string,
  mode: ExportMode,
  student?: Student | null
): string => {
  const safeCourse = sanitizeFileName(courseName || 'Curso');

  switch (mode) {
    case 'individual': {
      const safeStudent = sanitizeFileName(student?.displayName || student?.name || 'Aluno');
      return `Certificado_${safeStudent}_${safeCourse}.pdf`;
    }
    case 'frontOnly':
      return `Certificados_${safeCourse}_Frentes.pdf`;
    case 'versoOnly':
      return `Certificados_${safeCourse}_Versos.pdf`;
    case 'duplex':
    default:
      return `Certificados_${safeCourse}_Lote_Duplex.pdf`;
  }
};

/**
 * Monta o plano de execução sequencial das páginas que integrarão o documento PDF.
 */
export const planPDFExport = (
  mode: ExportMode,
  data: CertificateData,
  students: Student[],
  selectedStudent?: Student | null
): PageRenderTask[] => {
  const tasks: PageRenderTask[] = [];
  const versoPages = paginateCurriculum(data.curriculum);
  let globalPageNumber = 1;

  if (mode === 'individual') {
    const student = selectedStudent || (students.length > 0 ? students[0] : null);
    if (!student) {
      throw new Error('Nenhum aluno selecionado para exportação individual.');
    }

    // 1. Frente do Aluno
    tasks.push({
      id: `task-indiv-${student.id}-front`,
      student,
      pageType: 'front',
      pageNumber: globalPageNumber++,
      studentIndex: 0,
      label: `Frente: ${student.displayName || student.name}`,
    });

    // 2. Verso(s) do Aluno
    versoPages.forEach((slice, vIdx) => {
      tasks.push({
        id: `task-indiv-${student.id}-verso-${vIdx + 1}`,
        student,
        pageType: 'verso',
        pageNumber: globalPageNumber++,
        studentIndex: 0,
        versoPageNumber: vIdx + 1,
        versoTotalPages: versoPages.length,
        curriculumSlice: slice,
        label: `Verso (${vIdx + 1}/${versoPages.length}): ${student.displayName || student.name}`,
      });
    });

    return tasks;
  }

  if (mode === 'duplex') {
    if (!students || students.length === 0) {
      throw new Error('A lista de alunos está vazia para exportação duplex.');
    }

    students.forEach((student, sIdx) => {
      let pagesThisStudent = 0;

      // Frente do Aluno Atual
      tasks.push({
        id: `task-dup-${student.id}-front`,
        student,
        pageType: 'front',
        pageNumber: globalPageNumber++,
        studentIndex: sIdx,
        label: `Frente [Aluno ${sIdx + 1}/${students.length}]: ${student.displayName || student.name}`,
      });
      pagesThisStudent++;

      // Verso(s) correspondente(s) imediatamente após a Frente
      versoPages.forEach((slice, vIdx) => {
        tasks.push({
          id: `task-dup-${student.id}-verso-${vIdx + 1}`,
          student,
          pageType: 'verso',
          pageNumber: globalPageNumber++,
          studentIndex: sIdx,
          versoPageNumber: vIdx + 1,
          versoTotalPages: versoPages.length,
          curriculumSlice: slice,
          label: `Verso [Aluno ${sIdx + 1}/${students.length}] (Folha ${vIdx + 1}/${versoPages.length})`,
        });
        pagesThisStudent++;
      });

      // Se o aluno teve número ímpar de páginas (ex: 1 frente + 2 versos = 3 páginas),
      // adiciona 1 página de preenchimento para garantir que o próximo aluno comece em uma nova folha física!
      if (needsDuplexFillerPage(pagesThisStudent)) {
        tasks.push({
          id: `task-dup-${student.id}-filler`,
          student,
          pageType: 'filler',
          pageNumber: globalPageNumber++,
          studentIndex: sIdx,
          label: `Anotações/Filler [Aluno ${sIdx + 1}/${students.length}] (Duplex Sheet Separation)`,
        });
      }
    });

    return tasks;
  }

  if (mode === 'frontOnly') {
    if (!students || students.length === 0) {
      throw new Error('A lista de alunos está vazia para exportação de frentes.');
    }

    students.forEach((student, sIdx) => {
      tasks.push({
        id: `task-front-${student.id}`,
        student,
        pageType: 'front',
        pageNumber: globalPageNumber++,
        studentIndex: sIdx,
        label: `Frente [${sIdx + 1}/${students.length}]: ${student.displayName || student.name}`,
      });
    });

    return tasks;
  }

  if (mode === 'versoOnly') {
    // Se há alunos, gera o verso para cada aluno (se houver dados do aluno) ou os versos da turma
    const targetStudents = students.length > 0 ? students : [null];

    targetStudents.forEach((student, sIdx) => {
      versoPages.forEach((slice, vIdx) => {
        tasks.push({
          id: `task-verso-${student ? student.id : 'turma'}-${vIdx + 1}`,
          student,
          pageType: 'verso',
          pageNumber: globalPageNumber++,
          studentIndex: sIdx,
          versoPageNumber: vIdx + 1,
          versoTotalPages: versoPages.length,
          curriculumSlice: slice,
          label: student
            ? `Verso [${sIdx + 1}/${targetStudents.length}] (${vIdx + 1}/${versoPages.length}): ${student.displayName || student.name}`
            : `Verso Geral (${vIdx + 1}/${versoPages.length})`,
        });
      });
    });

    return tasks;
  }

  return tasks;
};
