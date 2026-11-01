import { describe, it, expect } from 'vitest';
import { parseStudentsBulkInput, splitDelimitedLine } from '../utils/importParser';
import { Student } from '../types';

describe('G04-G: Integridade de Importação com Aspas e Delimitadores (CM-MED-003)', () => {
  it('deve dividir linha simples por vírgula', () => {
    const parts = splitDelimitedLine('João da Silva, 123.456.789-00');
    expect(parts).toEqual(['João da Silva', '123.456.789-00']);
  });

  it('deve preservar vírgulas dentro de campos entre aspas', () => {
    const parts = splitDelimitedLine('"Silva, João Carlos", 123.456.789-00');
    expect(parts).toEqual(['Silva, João Carlos', '123.456.789-00']);
  });

  it('deve tratar delimitadores por ponto-e-vírgula e tabulação', () => {
    const partsSemicolon = splitDelimitedLine('Maria Souza; 987.654.321-11');
    expect(partsSemicolon).toEqual(['Maria Souza', '987.654.321-11']);

    const partsTab = splitDelimitedLine('Carlos Pereira\t111.444.777-35');
    expect(partsTab).toEqual(['Carlos Pereira', '111.444.777-35']);
  });

  it('deve importar lista com múltiplos formatos e nomes complexos', () => {
    // CPFs válidos sintéticos:
    // 52998224725 -> 529.982.247-25
    // 71428793860 -> 714.287.938-60
    // 11144477735 -> 111.444.777-35
    const raw = `
      João da Silva, 529.982.247-25
      "Souza, Maria", 714.287.938-60
      Carlos Pereira\t111.444.777-35
    `;

    const res = parseStudentsBulkInput(raw);
    expect(res.validStudents.length).toBe(3);
    expect(res.errors.length).toBe(0);

    expect(res.validStudents[0].name).toBe('João da Silva');
    expect(res.validStudents[1].name).toBe('Souza, Maria');
    expect(res.validStudents[2].name).toBe('Carlos Pereira');
  });

  it('deve rejeitar e reportar CPFs inválidos com identificação da linha', () => {
    const raw = `
      Aluno Válido, 529.982.247-25
      Aluno Com CPF Errado, 111.111.111-11
      Aluno Sem CPF
    `;

    const res = parseStudentsBulkInput(raw);
    expect(res.validStudents.length).toBe(1);
    expect(res.errors.length).toBe(2);
    expect(res.errors[0]).toContain('Linha 2 (Aluno Com CPF Errado): CPF inválido');
    expect(res.errors[1]).toContain('Linha 3: Formato inválido');
  });

  it('deve rejeitar CPFs duplicados contra a lista de alunos existentes', () => {
    const existing: Student[] = [
      { id: '1', name: 'Aluno Já Existente', cpf: '529.982.247-25' }
    ];

    const raw = `
      Novo Aluno, 529.982.247-25
      Outro Aluno, 714.287.938-60
    `;

    const res = parseStudentsBulkInput(raw, existing);
    expect(res.validStudents.length).toBe(1);
    expect(res.validStudents[0].name).toBe('Outro Aluno');
    expect(res.errors.length).toBe(1);
    expect(res.errors[0]).toContain('CPF já cadastrado');
  });
});
