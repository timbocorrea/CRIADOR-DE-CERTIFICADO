import { CurriculumItem } from '../types';

export interface WorkloadDivergenceInfo {
  hasDivergence: boolean;
  calculatedHours: number;
  declaredHoursNumber: number;
  message?: string;
}

/**
 * Calcula a soma total de horas de todas as disciplinas da grade curricular.
 */
export function calculateCurriculumHours(curriculum: CurriculumItem[]): number {
  if (!curriculum || !Array.isArray(curriculum)) return 0;
  return curriculum.reduce((sum, item) => sum + (Number(item.hours) || 0), 0);
}

/**
 * Determina a carga horária efetiva com base no modo ('auto' ou 'manual').
 */
export function getEffectiveWorkload(
  curriculum: CurriculumItem[],
  declaredHours: string,
  mode: 'auto' | 'manual' = 'auto'
): string {
  if (mode === 'auto') {
    return calculateCurriculumHours(curriculum).toString();
  }
  return declaredHours && declaredHours.trim() ? declaredHours.trim() : '0';
}

/**
 * Avalia se existe divergência entre a soma calculada da grade e o valor declarado manualmente.
 */
export function checkWorkloadDivergence(
  curriculum: CurriculumItem[],
  declaredHours: string,
  mode: 'auto' | 'manual' = 'auto'
): WorkloadDivergenceInfo {
  const calculatedHours = calculateCurriculumHours(curriculum);
  const declaredHoursNumber = Number(declaredHours) || 0;

  if (mode === 'auto') {
    return {
      hasDivergence: false,
      calculatedHours,
      declaredHoursNumber: calculatedHours
    };
  }

  const hasDivergence = calculatedHours !== declaredHoursNumber;
  return {
    hasDivergence,
    calculatedHours,
    declaredHoursNumber,
    message: hasDivergence
      ? `Atenção: A soma das disciplinas (${calculatedHours}h) difere da carga horária declarada (${declaredHoursNumber}h).`
      : undefined
  };
}
