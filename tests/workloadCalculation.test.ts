import { describe, it, expect } from 'vitest';
import {
  calculateCurriculumHours,
  getEffectiveWorkload,
  checkWorkloadDivergence
} from '../utils/workloadCalculator';
import { CurriculumItem } from '../types';

describe('G04-C: Cálculo e Integridade de Carga Horária (CM-ALTO-005)', () => {
  const sampleCurriculum: CurriculumItem[] = [
    { id: '1', subject: 'Matemática Financeira', hours: 20 },
    { id: '2', subject: 'Estatística Aplicada', hours: 30 },
    { id: '3', subject: 'Gestão de Projetos', hours: 10 },
  ];

  it('deve calcular a soma correta de horas das disciplinas', () => {
    const total = calculateCurriculumHours(sampleCurriculum);
    expect(total).toBe(60);
  });

  it('deve retornar 0 para grade curricular vazia', () => {
    expect(calculateCurriculumHours([])).toBe(0);
  });

  it('no modo automático, a carga horária efetiva deve ser a soma das disciplinas', () => {
    const effective = getEffectiveWorkload(sampleCurriculum, '100', 'auto');
    expect(effective).toBe('60');
  });

  it('no modo manual, a carga horária efetiva deve ser o valor informado pelo operador', () => {
    const effective = getEffectiveWorkload(sampleCurriculum, '80', 'manual');
    expect(effective).toBe('80');
  });

  it('deve detectar ausência de divergência quando os valores coincidem', () => {
    const div = checkWorkloadDivergence(sampleCurriculum, '60', 'manual');
    expect(div.hasDivergence).toBe(false);
    expect(div.calculatedHours).toBe(60);
    expect(div.declaredHoursNumber).toBe(60);
    expect(div.message).toBeUndefined();
  });

  it('deve detectar e alertar divergência quando a carga manual difere da soma da grade', () => {
    const div = checkWorkloadDivergence(sampleCurriculum, '100', 'manual');
    expect(div.hasDivergence).toBe(true);
    expect(div.calculatedHours).toBe(60);
    expect(div.declaredHoursNumber).toBe(100);
    expect(div.message).toContain('difere da carga horária declarada');
    expect(div.message).toContain('60h');
    expect(div.message).toContain('100h');
  });

  it('no modo automático, não deve acusar divergência mesmo com valor textual anterior diferente', () => {
    const div = checkWorkloadDivergence(sampleCurriculum, '999', 'auto');
    expect(div.hasDivergence).toBe(false);
    expect(div.calculatedHours).toBe(60);
  });
});
