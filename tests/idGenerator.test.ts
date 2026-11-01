import { describe, it, expect } from 'vitest';
import { generateId } from '../utils/helpers';

describe('G04-G: Geração de Identificadores Criptograficamente Seguros (CM-BAIXO-003)', () => {
  it('generateId deve retornar uma string não vazia', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(5);
  });

  it('deve gerar 1.000 identificadores com zero colisões', () => {
    const set = new Set<string>();
    const count = 1000;

    for (let i = 0; i < count; i++) {
      const id = generateId();
      expect(set.has(id)).toBe(false);
      set.add(id);
    }

    expect(set.size).toBe(count);
  });
});
