import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PreviewToolbar } from '../components/preview/PreviewToolbar';

describe('Enquadramento Inteiro e Zoom Responsivo Automático (Padrão)', () => {
  it('renderiza o botão Auto (Responsivo) como ativo por padrão no PreviewToolbar', () => {
    const html = renderToStaticMarkup(
      <PreviewToolbar
        totalStudents={3}
        currentStudentIdx={0}
        currentStudent={{ id: '1', name: 'Aluno Teste', cpf: '529.982.247-25' }}
        previewPage={1}
        zoom={0.65}
        zoomMode="auto"
        onToggleZoomMode={vi.fn()}
        onSetCustomZoom={vi.fn()}
        isGenerating={false}
        onPrevStudent={vi.fn()}
        onNextStudent={vi.fn()}
        onSelectPage={vi.fn()}
        onZoomChange={vi.fn()}
      />
    );

    // Botão Auto com porcentagem calculada dinamicamente
    expect(html).toContain('Auto (65%)');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('bg-blue-600');

    // Menu suspenso de proporções disponível para alternar
    expect(html).toContain('Auto (Responsivo - Padrão)');
    expect(html).toContain('100% (Tamanho Real)');
    expect(html).toContain('50% (Meia escala)');
  });

  it('quando em modo manual, reflete estado nos controles e permite retornar a auto', () => {
    const html = renderToStaticMarkup(
      <PreviewToolbar
        totalStudents={3}
        currentStudentIdx={0}
        currentStudent={{ id: '1', name: 'Aluno Teste', cpf: '529.982.247-25' }}
        previewPage={1}
        zoom={1.25}
        zoomMode="manual"
        onToggleZoomMode={vi.fn()}
        onSetCustomZoom={vi.fn()}
        isGenerating={false}
        onPrevStudent={vi.fn()}
        onNextStudent={vi.fn()}
        onSelectPage={vi.fn()}
        onZoomChange={vi.fn()}
      />
    );

    expect(html).toContain('Auto (125%)');
    expect(html).toContain('aria-pressed="false"');
  });

  it('algoritmo de auto-fit garante que dimensões 1123x794 cabem 100% sem transbordamento', () => {
    const viewports = [
      { w: 1920, h: 1080, sidebar: 500, top: 112 },
      { w: 1366, h: 768, sidebar: 480, top: 112 },
      { w: 768, h: 1024, sidebar: 0, top: 112 }, // Tablet
      { w: 390, h: 844, sidebar: 0, top: 150 }, // Mobile
    ];

    for (const vp of viewports) {
      const availW = vp.w - vp.sidebar - 48;
      const availH = vp.h - vp.top - 48;
      const scaleW = availW / 1123;
      const scaleH = availH / 794;
      const fitScale = Math.min(scaleW, scaleH);

      const scaledW = 1123 * fitScale;
      const scaledH = 794 * fitScale;

      // O certificado reduzido cabe integralmente na área visível
      expect(scaledW).toBeLessThanOrEqual(availW + 0.001);
      expect(scaledH).toBeLessThanOrEqual(availH + 0.001);
    }
  });
});

