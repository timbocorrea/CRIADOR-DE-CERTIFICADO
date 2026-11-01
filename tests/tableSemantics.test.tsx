import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CurriculumTable from '../components/CurriculumTable';
import { CurriculumItem } from '../types';

describe('G04-G: Semântica e Estrutura da Tabela Curricular (CM-MED-004)', () => {
  const sampleItems: CurriculumItem[] = [
    { id: '1', subject: 'Lógica de Programação', hours: 40 },
    { id: '2', subject: 'Algoritmos Avançados', hours: 60 },
  ];

  it('quando showHoursColumn é verdadeiro, o thead e o tfoot devem ter exatamente 3 colunas', () => {
    const html = renderToStaticMarkup(
      <CurriculumTable
        items={sampleItems}
        totalHours="100"
        showHoursColumn={true}
        onAdd={() => {}}
        onRemove={() => {}}
        onUpdate={() => {}}
        onUpdateTotal={() => {}}
      />
    );

    // Contagem de <th> no cabeçalho (usando \b para não coincidir com <thead)
    const theadMatch = html.match(/<thead[\s\S]*?<\/thead>/);
    expect(theadMatch).not.toBeNull();
    const thCount = (theadMatch![0].match(/<th\b/g) || []).length;
    expect(thCount).toBe(3); // Disciplina, Horas, Ações

    // Contagem de <td> no rodapé (tfoot)
    const tfootMatch = html.match(/<tfoot[\s\S]*?<\/tfoot>/);
    expect(tfootMatch).not.toBeNull();
    const tdCount = (tfootMatch![0].match(/<td\b/g) || []).length;
    expect(tdCount).toBe(3); // Total label, Total input, Ações filler
  });

  it('quando showHoursColumn é falso, o thead e o tfoot devem ter exatamente 2 colunas', () => {
    const html = renderToStaticMarkup(
      <CurriculumTable
        items={sampleItems}
        totalHours="100"
        showHoursColumn={false}
        onAdd={() => {}}
        onRemove={() => {}}
        onUpdate={() => {}}
        onUpdateTotal={() => {}}
      />
    );

    // Contagem de <th> no cabeçalho (usando \b para não coincidir com <thead)
    const theadMatch = html.match(/<thead[\s\S]*?<\/thead>/);
    expect(theadMatch).not.toBeNull();
    const thCount = (theadMatch![0].match(/<th\b/g) || []).length;
    expect(thCount).toBe(2); // Disciplina, Ações

    // Contagem de <td> no rodapé (tfoot) deve ser 2 para evitar distorção semântica (CM-MED-004)
    const tfootMatch = html.match(/<tfoot[\s\S]*?<\/tfoot>/);
    expect(tfootMatch).not.toBeNull();
    const tdCount = (tfootMatch![0].match(/<td\b/g) || []).length;
    expect(tdCount).toBe(2); // Total label, Total input (sem célula excedente)
  });
});
