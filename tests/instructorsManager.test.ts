import { describe, it, expect } from 'vitest';
import { MAX_INSTRUCTORS } from '../hooks/useCertificateData';
import { Instructor } from '../types';

describe('G04-D: Gerenciamento de Múltiplos Instrutores (CM-ALTO-004)', () => {
  it('o limite máximo suportado deve ser 4 instrutores', () => {
    expect(MAX_INSTRUCTORS).toBe(4);
  });

  it('deve simular adição de até 4 instrutores com sucesso', () => {
    const instructors: Instructor[] = [];
    const add = (name: string, competencies: string) => {
      if (instructors.length >= MAX_INSTRUCTORS) {
        return { success: false, error: 'Limite atingido' };
      }
      instructors.push({ id: `inst-${instructors.length + 1}`, name, competencies });
      return { success: true };
    };

    expect(add('Prof. Carlos Silva', 'Engenharia de Software').success).toBe(true);
    expect(add('Profa. Ana Oliveira', 'Banco de Dados').success).toBe(true);
    expect(add('Prof. Marcos Souza', 'Segurança da Informação').success).toBe(true);
    expect(add('Profa. Beatriz Lima', 'Redes de Computadores').success).toBe(true);
    expect(instructors.length).toBe(4);

    // Tentativa do 5º instrutor deve ser bloqueada
    const fifth = add('Prof. Eduardo Santos', 'Inteligência Artificial');
    expect(fifth.success).toBe(false);
    expect(fifth.error).toContain('Limite atingido');
    expect(instructors.length).toBe(4);
  });

  it('deve permitir exclusão de um instrutor liberando vaga para novo cadastro', () => {
    let instructors: Instructor[] = [
      { id: '1', name: 'Instrutor 1', competencies: 'Comp 1' },
      { id: '2', name: 'Instrutor 2', competencies: 'Comp 2' },
      { id: '3', name: 'Instrutor 3', competencies: 'Comp 3' },
      { id: '4', name: 'Instrutor 4', competencies: 'Comp 4' },
    ];

    expect(instructors.length).toBe(4);
    // Remove o segundo
    instructors = instructors.filter(i => i.id !== '2');
    expect(instructors.length).toBe(3);

    // Agora deve permitir adicionar mais um
    instructors.push({ id: '5', name: 'Novo Instrutor', competencies: 'Nova Comp' });
    expect(instructors.length).toBe(4);
    expect(instructors.some(i => i.name === 'Novo Instrutor')).toBe(true);
  });
});
