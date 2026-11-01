import { describe, it, expect, vi } from 'vitest';
import { 
  planPDFExport, 
  generatePDFFileName, 
  sanitizeFileName 
} from '../services/pdf/exportPlanner';
import { 
  paginateCurriculum, 
  calculateVersoPageCount, 
  needsDuplexFillerPage,
  DEFAULT_MAX_ITEMS_PER_PAGE 
} from '../services/pdf/curriculumPaginator';
import { PDFEngine } from '../services/pdf/pdfEngine';
import { executePDFExport } from '../services/pdf/pdfExportService';
import { CertificateData, Student, CurriculumItem, DEFAULT_BASE_TEXT } from '../types';

// Utilitário para geração de dados sintéticos válidos
const createSyntheticStudents = (count: number): Student[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `student-${i + 1}`,
    name: `Aluno Sintético ${i + 1}`,
    cpf: '529.982.247-25',
    displayName: `Aluno ${i + 1}`,
  }));
};

const createSyntheticCurriculum = (count: number): CurriculumItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `disc-${i + 1}`,
    subject: `Módulo / Disciplina ${i + 1} de Conteúdo Programático Extenso`,
    hours: 20,
  }));
};

const baseData: CertificateData = {
  students: [],
  companyName: 'Instituição de Ensino Superior Exemplo Ltda',
  companyCnpj: '12.345.678/0001-90',
  address: 'Avenida Paulista, 1000 - Bela Vista - São Paulo/SP',
  providerName: 'Faculdade de Tecnologia Aplicada',
  providerCnpj: '98.765.432/0001-10',
  instructors: [
    { id: '1', name: 'Dr. Roberto Santos', competencies: 'Doutor em Ciência da Computação' },
    { id: '2', name: 'Msc. Fernanda Lima', competencies: 'Mestre em Engenharia de Software' }
  ],
  techResponsibleName: 'Eng. Carlos Eduardo Martins',
  techResponsibleCompetencies: 'CREA-SP 5061234567',
  showTechResponsible: true,
  courseName: 'Engenharia de Software e Arquitetura de Sistemas',
  courseDate: '31/10/2026',
  totalHours: '120',
  baseText: DEFAULT_BASE_TEXT,
  curriculum: createSyntheticCurriculum(6),
  bgImage: null,
  signatureImage: null,
  digitalSeal: null,
  showHoursColumn: true,
  versoSplitRatio: 40,
  hoursColumnWidth: 80,
  versoRowPadding: 12,
  versoCurriculumFontSize: 12,
  versoHeaderFontSize: 16,
  footerFontSize: 9,
  versoInstitutionVerticalOffset: 0,
  versoCurriculumVerticalOffset: 0,
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
  boldVariables: ['{{NOME}}', '{{CURSO}}'],
  frontHeaderPadding: 60,
  frontFooterPadding: 24,
  versoHeaderPadding: 48,
  versoFooterPadding: 32,
  frontBorderWidth: 16,
};

describe('Motor de Exportação de PDF — Matriz de Testes Gate 03', () => {

  // Testes de Lote e Duplex Intercalado
  describe('PDF-01 a PDF-05: Lote Duplex e Associação Frente/Verso', () => {
    it('PDF-01: 1 aluno, duplex -> 2 páginas exatamente intercaladas (Frente A, Verso A)', () => {
      const students = createSyntheticStudents(1);
      const tasks = planPDFExport('duplex', baseData, students);

      expect(tasks).toHaveLength(2);
      expect(tasks[0].pageType).toBe('front');
      expect(tasks[0].student?.id).toBe(students[0].id);
      expect(tasks[1].pageType).toBe('verso');
      expect(tasks[1].student?.id).toBe(students[0].id);
    });

    it('PDF-02: 2 alunos, duplex -> 4 páginas intercaladas (Frente 1, Verso 1, Frente 2, Verso 2)', () => {
      const students = createSyntheticStudents(2);
      const tasks = planPDFExport('duplex', baseData, students);

      expect(tasks).toHaveLength(4);
      expect(tasks[0].pageType).toBe('front');
      expect(tasks[0].student?.id).toBe(students[0].id);
      expect(tasks[1].pageType).toBe('verso');
      expect(tasks[1].student?.id).toBe(students[0].id);

      expect(tasks[2].pageType).toBe('front');
      expect(tasks[2].student?.id).toBe(students[1].id);
      expect(tasks[3].pageType).toBe('verso');
      expect(tasks[3].student?.id).toBe(students[1].id);
    });

    it('PDF-03: 3 alunos, duplex -> 6 páginas intercaladas rigorosamente', () => {
      const students = createSyntheticStudents(3);
      const tasks = planPDFExport('duplex', baseData, students);

      expect(tasks).toHaveLength(6);
      for (let i = 0; i < 3; i++) {
        expect(tasks[i * 2].pageType).toBe('front');
        expect(tasks[i * 2].student?.id).toBe(students[i].id);
        expect(tasks[i * 2 + 1].pageType).toBe('verso');
        expect(tasks[i * 2 + 1].student?.id).toBe(students[i].id);
      }
    });

    it('PDF-04: 10 alunos, duplex -> 20 páginas intercaladas sem desassociação', () => {
      const students = createSyntheticStudents(10);
      const tasks = planPDFExport('duplex', baseData, students);

      expect(tasks).toHaveLength(20);
      students.forEach((st, idx) => {
        const front = tasks[idx * 2];
        const verso = tasks[idx * 2 + 1];
        expect(front.pageType).toBe('front');
        expect(front.student?.id).toBe(st.id);
        expect(verso.pageType).toBe('verso');
        expect(verso.student?.id).toBe(st.id);
      });
    });

    it('PDF-05: 50 alunos, duplex -> 100 páginas com integridade referencial total', () => {
      const students = createSyntheticStudents(50);
      const tasks = planPDFExport('duplex', baseData, students);

      expect(tasks).toHaveLength(100);
      // Confirma que nenhuma frente é seguida por outra frente
      for (let i = 0; i < 50; i++) {
        expect(tasks[i * 2].pageType).toBe('front');
        expect(tasks[i * 2 + 1].pageType).toBe('verso');
        expect(tasks[i * 2].student?.id).toBe(tasks[i * 2 + 1].student?.id);
      }
    });
  });

  // Modalidades de Exportação
  describe('PDF-06 a PDF-08: Modalidades de Exportação', () => {
    it('PDF-06: Exportação individual -> gera apenas o aluno escolhido (2 páginas)', () => {
      const students = createSyntheticStudents(5);
      const targetStudent = students[2]; // Aluno 3

      const tasks = planPDFExport('individual', baseData, students, targetStudent);
      expect(tasks).toHaveLength(2);
      expect(tasks[0].student?.id).toBe(targetStudent.id);
      expect(tasks[0].pageType).toBe('front');
      expect(tasks[1].student?.id).toBe(targetStudent.id);
      expect(tasks[1].pageType).toBe('verso');
    });

    it('PDF-07: Somente frentes -> N páginas de frente para N alunos', () => {
      const students = createSyntheticStudents(7);
      const tasks = planPDFExport('frontOnly', baseData, students);

      expect(tasks).toHaveLength(7);
      tasks.forEach((task, idx) => {
        expect(task.pageType).toBe('front');
        expect(task.student?.id).toBe(students[idx].id);
      });
    });

    it('PDF-08: Somente versos -> N páginas de verso para a turma', () => {
      const students = createSyntheticStudents(4);
      const tasks = planPDFExport('versoOnly', baseData, students);

      expect(tasks).toHaveLength(4);
      tasks.forEach(task => {
        expect(task.pageType).toBe('verso');
      });
    });
  });

  // Paginação e Tratamento de Grade Curricular Extensa
  describe('PDF-09 a PDF-12: Grade Curricular Extensa (CM-ALTO-003)', () => {
    it('PDF-09: 5 disciplinas -> 1 página de verso, sem corte', () => {
      const curr = createSyntheticCurriculum(5);
      const pages = paginateCurriculum(curr, DEFAULT_MAX_ITEMS_PER_PAGE);

      expect(pages).toHaveLength(1);
      expect(pages[0]).toHaveLength(5);
      expect(calculateVersoPageCount(5)).toBe(1);
    });

    it('PDF-10: 12 disciplinas -> 1 página de verso compactada, sem corte', () => {
      const curr = createSyntheticCurriculum(12);
      const pages = paginateCurriculum(curr, DEFAULT_MAX_ITEMS_PER_PAGE);

      expect(pages).toHaveLength(1);
      expect(pages[0]).toHaveLength(12);
      expect(calculateVersoPageCount(12)).toBe(1);
    });

    it('PDF-11: 20 disciplinas -> 2 páginas de verso com distribuição equilibrada', () => {
      const curr = createSyntheticCurriculum(20);
      const pages = paginateCurriculum(curr, DEFAULT_MAX_ITEMS_PER_PAGE);

      expect(pages).toHaveLength(2);
      expect(pages[0]).toHaveLength(10);
      expect(pages[1]).toHaveLength(10);
      expect(calculateVersoPageCount(20)).toBe(2);
    });

    it('PDF-12: 40 disciplinas -> 4 páginas de verso, conteúdo completo sem sobreposição', () => {
      const curr = createSyntheticCurriculum(40);
      const pages = paginateCurriculum(curr, DEFAULT_MAX_ITEMS_PER_PAGE);

      expect(pages).toHaveLength(4);
      expect(pages[0]).toHaveLength(10);
      expect(pages[1]).toHaveLength(10);
      expect(pages[2]).toHaveLength(10);
      expect(pages[3]).toHaveLength(10);
      expect(calculateVersoPageCount(40)).toBe(4);
    });

    it('Regra Duplex com Múltiplos Versos: preserva separação física de folhas com páginas pares', () => {
      // 1 Aluno com 2 versos (total ímpar: 1 frente + 2 versos = 3 páginas)
      // Deve inserir 1 página de filler para totalizar 4 páginas (2 folhas físicas)
      const dataWith20Items: CertificateData = {
        ...baseData,
        curriculum: createSyntheticCurriculum(20), // 2 versos
      };
      const students = createSyntheticStudents(2);
      const tasks = planPDFExport('duplex', dataWith20Items, students);

      // Cada aluno: 1 frente + 2 versos + 1 filler = 4 páginas.
      // 2 alunos * 4 = 8 páginas no total.
      expect(tasks).toHaveLength(8);

      // Aluno 1 ocupa páginas 1 a 4
      expect(tasks[0].pageType).toBe('front');
      expect(tasks[1].pageType).toBe('verso');
      expect(tasks[2].pageType).toBe('verso');
      expect(tasks[3].pageType).toBe('filler');

      // Aluno 2 começa obrigatoriamente na página 5 (nova folha física)
      expect(tasks[4].pageType).toBe('front');
      expect(tasks[4].pageNumber).toBe(5);
      expect(tasks[4].student?.id).toBe(students[1].id);
    });
  });

  // Sanitização de Nomes e Arquivos
  describe('PDF-13 a PDF-15: Fidelidade e Nomes de Arquivo', () => {
    it('PDF-13: Nome de aluno com caracteres especiais e espaços -> gera nome sanitizado e seguro', () => {
      const rawName = 'João da Silva & Cia / Teste <Extremo> : 2026?';
      const sanitized = sanitizeFileName(rawName);

      expect(sanitized).not.toContain('/');
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain(':');
      expect(sanitized).not.toContain('?');
      expect(sanitized).toContain('João_da_Silva');
    });

    it('Gera nome de arquivo previsível para cada modalidade', () => {
      const student = createSyntheticStudents(1)[0];
      const fnDuplex = generatePDFFileName('Curso de Teste', 'duplex');
      expect(fnDuplex).toBe('Certificados_Curso_de_Teste_Lote_Duplex.pdf');

      const fnIndiv = generatePDFFileName('Curso de Teste', 'individual', student);
      expect(fnIndiv).toBe('Certificado_Aluno_1_Curso_de_Teste.pdf');

      const fnFront = generatePDFFileName('Curso de Teste', 'frontOnly');
      expect(fnFront).toBe('Certificados_Curso_de_Teste_Frentes.pdf');

      const fnVerso = generatePDFFileName('Curso de Teste', 'versoOnly');
      expect(fnVerso).toBe('Certificados_Curso_de_Teste_Versos.pdf');
    });
  });

  // Cancelamento e Resiliência
  describe('PDF-16 a PDF-19: Cancelamento e Resiliência do Motor', () => {
    it('PDF-16: Cancelamento via AbortSignal interrompe o processo e libera recursos', async () => {
      const controller = new AbortController();
      const students = createSyntheticStudents(5);

      // Simula canvas sintético
      const fakeCanvas = {
        getContext: () => ({ clearRect: vi.fn() }),
        toDataURL: () => 'data:image/jpeg;base64,fake',
        width: 1123,
        height: 794,
      } as unknown as HTMLCanvasElement;

      let callCount = 0;
      const captureHandler = async () => {
        callCount++;
        if (callCount === 2) {
          controller.abort(); // Cancela na 2ª página
        }
        return fakeCanvas;
      };

      const result = await executePDFExport(
        {
          mode: 'duplex',
          data: baseData,
          students,
          signal: controller.signal,
        },
        captureHandler
      );

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(callCount).toBe(2);
    });

    it('PDF-18: Falha controlada quando captura de página falha', async () => {
      const students = createSyntheticStudents(1);
      const failingHandler = async () => null as unknown as HTMLCanvasElement;

      const result = await executePDFExport(
        {
          mode: 'individual',
          data: baseData,
          students,
        },
        failingHandler
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Falha ao renderizar');
    });

    it('PDF-19: Execuções repetidas não interferem no estado interno', async () => {
      const students = createSyntheticStudents(1);
      const fakeCanvas = {
        getContext: () => ({ clearRect: vi.fn() }),
        toDataURL: () => 'data:image/jpeg;base64,fake',
        width: 1123,
        height: 794,
      } as unknown as HTMLCanvasElement;

      const run1 = await executePDFExport(
        { mode: 'individual', data: baseData, students },
        async () => fakeCanvas
      );
      const run2 = await executePDFExport(
        { mode: 'individual', data: baseData, students },
        async () => fakeCanvas
      );

      expect(run1.success).toBe(true);
      expect(run1.totalPages).toBe(2);
      expect(run2.success).toBe(true);
      expect(run2.totalPages).toBe(2);
    });
  });

  // Verificação da Atualização de Versão do jsPDF
  describe('PDF-20: Verificação de Segurança e Compatibilidade do jsPDF', () => {
    it('PDF-20: Instância de jsPDF inicializa sem falhas em landscape a4', () => {
      const engine = new PDFEngine();
      expect(engine.getPageCount()).toBe(0);

      const fakeCanvas = {
        getContext: () => ({ clearRect: vi.fn() }),
        toDataURL: () => 'data:image/jpeg;base64,fake',
        width: 1123,
        height: 794,
      } as unknown as HTMLCanvasElement;

      engine.addCanvasPage(fakeCanvas);
      expect(engine.getPageCount()).toBe(1);

      engine.addCanvasPage(fakeCanvas);
      expect(engine.getPageCount()).toBe(2);

      const blob = engine.outputBlob();
      expect(blob).toBeDefined();
      expect(blob.size).toBeGreaterThan(0);

      engine.dispose();
    });
  });
});
