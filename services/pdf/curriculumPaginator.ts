/**
 * CertificaMaster - Paginador e Gestor de Overflow da Grade Curricular
 * Gate 03: Tratamento de grades extensas e prevenção de cortes (CM-ALTO-003)
 */

import { CurriculumItem } from '../../types';

export const DEFAULT_MAX_ITEMS_PER_PAGE = 12;

/**
 * Divide uma lista de disciplinas em páginas de conteúdo programático,
 * garantindo que nenhuma disciplina seja cortada por restrições de altura.
 *
 * @param items Lista de disciplinas cadastradas
 * @param maxPerPage Número máximo de disciplinas por folha (padrão: 12)
 * @returns Array de páginas, onde cada página é um array de CurriculumItem
 */
export const paginateCurriculum = (
  items: CurriculumItem[],
  maxPerPage: number = DEFAULT_MAX_ITEMS_PER_PAGE
): CurriculumItem[][] => {
  if (!items || items.length === 0) {
    return [[]];
  }

  if (items.length <= maxPerPage) {
    return [items];
  }

  const pages: CurriculumItem[][] = [];
  // Para distribuição equilibrada entre as páginas
  const pageCount = Math.ceil(items.length / maxPerPage);
  const itemsPerChunk = Math.ceil(items.length / pageCount);

  for (let i = 0; i < items.length; i += itemsPerChunk) {
    pages.push(items.slice(i, i + itemsPerChunk));
  }

  return pages;
};

/**
 * Calcula a quantidade de páginas de verso necessárias para uma grade curricular.
 */
export const calculateVersoPageCount = (
  itemCount: number,
  maxPerPage: number = DEFAULT_MAX_ITEMS_PER_PAGE
): number => {
  if (itemCount <= 0) return 1;
  return Math.ceil(itemCount / maxPerPage);
};

/**
 * Determina se um certificado individual requer página de preenchimento (filler page)
 * para manter o número total de páginas PAR no modo duplex.
 *
 * No modo duplex, folhas físicas A4 têm 2 faces (Frente e Verso).
 * Se o aluno tem 1 Frente + 1 Verso = 2 páginas (1 folha física, sem filler).
 * Se o aluno tem 1 Frente + 2 Versos = 3 páginas (requer 1 filler page para totalizar 4 páginas / 2 folhas físicas).
 */
export const needsDuplexFillerPage = (pagesForStudent: number): boolean => {
  return pagesForStudent % 2 !== 0;
};
