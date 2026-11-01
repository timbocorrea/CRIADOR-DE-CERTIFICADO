import { describe, it, expect } from 'vitest';
import { processUploadedFile } from '../utils/fileParser';

describe('Local File Parser (processUploadedFile)', () => {
  it('deve processar arquivo CSV de texto e retornar participantes válidos', async () => {
    const csvContent = "Nome do Aluno,CPF\nCarlos Eduardo,529.982.247-25\nMariana Lima,714.287.938-60";
    const file = new File([csvContent], 'alunos.csv', { type: 'text/csv' });

    const result = await processUploadedFile(file, []);
    expect(result.kind).toBe('text');
    expect(result.parseResult?.validStudents).toHaveLength(2);
    expect(result.parseResult?.validStudents[0].name).toBe('Carlos Eduardo');
    expect(result.parseResult?.validStudents[1].name).toBe('Mariana Lima');
  });

  it('deve processar arquivo TXT tabulado', async () => {
    const txtContent = "Juliana Costa\t111.444.777-35\nRodrigo Alves\t529.982.247-25";
    const file = new File([txtContent], 'turma.txt', { type: 'text/plain' });

    const result = await processUploadedFile(file, []);
    expect(result.kind).toBe('text');
    expect(result.parseResult?.validStudents).toHaveLength(2);
    expect(result.parseResult?.validStudents[0].name).toBe('Juliana Costa');
    expect(result.parseResult?.validStudents[1].name).toBe('Rodrigo Alves');
  });

  it('deve rejeitar formatos não suportados com mensagem amigável', async () => {
    const binaryFile = new File(['fake binary content'], 'documento.exe', { type: 'application/x-msdownload' });
    const result = await processUploadedFile(binaryFile, []);
    expect(result.kind).toBe('unsupported');
    expect(result.error).toContain('Formato não suportado');
  });
});
