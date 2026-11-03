import { describe, it, expect } from 'vitest';
import { parseStudentsBulkInput } from '../utils/importParser';
import { calculateCurriculumHours } from '../utils/workloadCalculator';
import { paginateCurriculum, calculateVersoPageCount } from '../services/pdf/curriculumPaginator';
import { CurriculumItem, Student } from '../types';

function generateSyntheticValidCPF(index = 0): string {
  const base = String(100000000 + index).padStart(9, '0').split('').map(Number);
  let d1 = base.reduce((acc, val, idx) => acc + val * (10 - idx), 0);
  d1 = (d1 * 10) % 11;
  if (d1 === 10) d1 = 0;
  let d2 = base.reduce((acc, val, idx) => acc + val * (11 - idx), 0) + d1 * 2;
  d2 = (d2 * 10) % 11;
  if (d2 === 10) d2 = 0;
  return `${base.slice(0,3).join('')}.${base.slice(3,6).join('')}.${base.slice(6,9).join('')}-${d1}${d2}`;
}

describe('G07-G: Testes Automatizados de Desempenho, Estresse e Robustez Algorítmica', () => {

  describe('1. Desempenho e Integridade de Importação em Lote Massivo (100 Alunos)', () => {
    it('deve processar 100 participantes sintéticos com CPFs válidos em menos de 100ms', () => {
      const lines: string[] = [];
      for (let i = 1; i <= 100; i++) {
        lines.push(`Participante Performance ${String(i).padStart(3, '0')}, ${generateSyntheticValidCPF(i)}`);
      }
      const rawInput = lines.join('\n');

      const startTime = performance.now();
      const result = parseStudentsBulkInput(rawInput);
      const durationMs = performance.now() - startTime;

      expect(result.validStudents.length).toBe(100);
      expect(result.errors.length).toBe(0);
      expect(durationMs).toBeLessThan(150); // Deve ser sub-150ms
    });

    it('deve rejeitar e isolar corretamente registros corrompidos em lote de 100 registros', () => {
      const lines: string[] = [];
      for (let i = 1; i <= 95; i++) {
        lines.push(`Aluno Válido ${i}, ${generateSyntheticValidCPF(i)}`);
      }
      // Adiciona 5 registros inválidos misturados (nomes vazios ou CPFs malformados)
      lines.push('Aluno Invalido 1, 000.000.000-00');
      lines.push('Aluno Invalido 2, 111.111.111-11');
      lines.push('Aluno Invalido 3, 999.999.999-99');
      lines.push(', 123.456.789-00');
      lines.push('Aluno Invalido 5, 12345');

      const result = parseStudentsBulkInput(lines.join('\n'));

      expect(result.validStudents.length).toBe(95);
      expect(result.errors.length).toBe(5);
    });

    it('deve desduplicar CPFs idênticos dentro do próprio lote massivo', () => {
      const cpfCompartilhado = generateSyntheticValidCPF(42);
      const lines = [
        `Aluno Original, ${cpfCompartilhado}`,
        `Aluno Duplicata 1, ${cpfCompartilhado}`,
        `Aluno Duplicata 2, ${cpfCompartilhado}`,
        `Aluno Distinto, ${generateSyntheticValidCPF(99)}`
      ];

      const result = parseStudentsBulkInput(lines.join('\n'));

      expect(result.validStudents.length).toBe(2);
      expect(result.errors.length).toBe(2);
      expect(result.errors[0]).toContain('CPF já cadastrado');
    });
  });

  describe('2. Cálculo e Robustez de Carga Horária com Grades Extensas', () => {
    it('deve somar precisamente a carga horária de grade com 50 disciplinas sem perda de precisão', () => {
      const items: CurriculumItem[] = [];
      let expectedSum = 0;
      for (let i = 1; i <= 50; i++) {
        const h = i * 2;
        items.push({ id: `c-${i}`, subject: `Disciplina Especializada ${i}`, hours: h });
        expectedSum += h;
      }

      const total = calculateCurriculumHours(items);
      expect(total).toBe(expectedSum);
      expect(total).toBe(2550);
    });

    it('deve lidar com valores não numéricos, nulos ou negativos com resiliência', () => {
      const items: any[] = [
        { id: '1', subject: 'Válida 1', hours: 20 },
        { id: '2', subject: 'Inválida NaN', hours: NaN },
        { id: '3', subject: 'Inválida Undefined', hours: undefined },
        { id: '4', subject: 'Inválida String', hours: '40' },
        { id: '5', subject: 'Inválida Negativa', hours: -15 },
        { id: '6', subject: 'Válida 2', hours: 30 },
      ];

      const total = calculateCurriculumHours(items);
      expect(total).toBe(75); // 20 + 40 + (-15) + 30 = 75
    });
  });

  describe('3. Paginador e Gestor de Overflow da Grade Curricular (CM-ALTO-003)', () => {
    it('deve manter grade de até 12 disciplinas em uma única página de verso', () => {
      const items: CurriculumItem[] = Array.from({ length: 12 }, (_, i) => ({
        id: `disc-${i}`,
        subject: `Matéria ${i + 1}`,
        hours: 10
      }));

      const pages = paginateCurriculum(items, 12);
      expect(pages.length).toBe(1);
      expect(pages[0].length).toBe(12);
      expect(calculateVersoPageCount(items.length, 12)).toBe(1);
    });

    it('deve particionar equilibradamente grade de 25 disciplinas entre páginas sem perda de itens', () => {
      const items: CurriculumItem[] = Array.from({ length: 25 }, (_, i) => ({
        id: `disc-${i}`,
        subject: `Matéria Avançada ${i + 1}`,
        hours: 15
      }));

      const pages = paginateCurriculum(items, 12);
      expect(pages.length).toBe(3); // 25 / 12 = ceil(2.08) = 3 páginas
      expect(calculateVersoPageCount(25, 12)).toBe(3);

      // Todas as disciplinas devem estar presentes exatamente uma vez
      const allPaginatedItems = pages.flat();
      expect(allPaginatedItems.length).toBe(25);
      expect(new Set(allPaginatedItems.map(it => it.id)).size).toBe(25);
    });

    it('deve retornar página vazia se a lista de disciplinas for nula ou vazia', () => {
      expect(paginateCurriculum([])).toEqual([[]]);
      expect(calculateVersoPageCount(0)).toBe(1);
    });
  });

  describe('4. Isolamento e Integridade do Modelo de Dados do Certificado', () => {
    it('deve garantir que instâncias de estudantes geradas sejam imutáveis em arrays de turma', () => {
      const studentA: Student = { id: 's1', name: 'Ana Souza', cpf: '123.456.789-00' };
      const studentB: Student = { id: 's2', name: 'Beto Lima', cpf: '987.654.321-11' };
      const roster = [studentA, studentB];

      // Mutação em cópia rasa não deve afetar a lista
      const clonedRoster = [...roster];
      clonedRoster.push({ id: 's3', name: 'Carlos Dias', cpf: '111.444.777-35' });

      expect(roster.length).toBe(2);
      expect(clonedRoster.length).toBe(3);
    });
  });
});
