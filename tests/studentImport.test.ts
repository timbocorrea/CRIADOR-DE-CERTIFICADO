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

  it('deve aceitar participantes com CPFs informados e participantes sem CPF sem bloqueio', () => {
    const raw = `
      Aluno Válido, 529.982.247-25
      Aluno Com CPF Errado, 111.111.111-11
      Aluno Sem CPF
      Outro Aluno Sem CPF,
    `;

    const res = parseStudentsBulkInput(raw);
    expect(res.validStudents.length).toBe(4);
    expect(res.validStudents[0].name).toBe('Aluno Válido');
    expect(res.validStudents[0].cpf).toBe('529.982.247-25');
    expect(res.validStudents[1].name).toBe('Aluno Com CPF Errado');
    expect(res.validStudents[1].cpf).toBe('111.111.111-11');
    expect(res.validStudents[2].name).toBe('Aluno Sem CPF');
    expect(res.validStudents[2].cpf).toBe('');
    expect(res.validStudents[3].name).toBe('Outro Aluno Sem CPF');
    expect(res.validStudents[3].cpf).toBe('');
    expect(res.errors.length).toBe(0);
  });

  it('deve importar todos os 10 alunos de planilha mesmo com CPFs sintéticos ou fictícios', () => {
    const sheetCsv = `
Ana Beatriz Ferreira,284.915.730-97
Carlos Eduardo de Souza,519.842.370-04
Juliana Maria Silveira,367.481.920-96
Lucas Gabriel Oliveira,840.193.520-00
Mariana Ribeiro Alves,726.351.480-07
Rodrigo Santos Mendes,495.823.160-33
Camila Cristina Barbosa,631.974.250-09
Felipe Augusto Lima,952.836.410-60
Larissa Cristina Rocha,184.629.750-30
Thiago Henrique Martins,317.582.940-04
`;
    const res = parseStudentsBulkInput(sheetCsv);
    expect(res.validStudents.length).toBe(10);
    expect(res.errors.length).toBe(0);
    expect(res.validStudents.map((s) => s.name)).toEqual([
      'Ana Beatriz Ferreira',
      'Carlos Eduardo de Souza',
      'Juliana Maria Silveira',
      'Lucas Gabriel Oliveira',
      'Mariana Ribeiro Alves',
      'Rodrigo Santos Mendes',
      'Camila Cristina Barbosa',
      'Felipe Augusto Lima',
      'Larissa Cristina Rocha',
      'Thiago Henrique Martins',
    ]);
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
