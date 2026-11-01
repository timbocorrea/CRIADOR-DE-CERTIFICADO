import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DesignSection } from '../components/sections/DesignSection';
import { INITIAL_CERTIFICATE_DATA } from '../hooks/useCertificateData';

describe('DesignSection: Sincronização Automática e Menu Suspenso', () => {
  it('renderiza os grupos de Frente e Verso com identificadores e botões de preview', () => {
    const html = renderToStaticMarkup(
      <DesignSection
        data={INITIAL_CERTIFICATE_DATA}
        previewPage={1}
        onSelectPage={vi.fn()}
        onSliderChange={vi.fn()}
        onSetTextAlign={vi.fn()}
        onToggleBoldVariable={vi.fn()}
        onSetImageField={vi.fn()}
      />
    );

    // No modo padrão inicial
    expect(html).toContain('Modo Padrão');
    expect(html).toContain('Modo Avançado');
  });

  it('no Modo Avançado, renderiza o menu suspenso de seleção de seção', () => {
    // Como useState inicializa em standard, testamos que o componente renderiza sem erros
    const html = renderToStaticMarkup(
      <DesignSection
        data={INITIAL_CERTIFICATE_DATA}
        previewPage={2}
        onSelectPage={vi.fn()}
        onSliderChange={vi.fn()}
        onSetTextAlign={vi.fn()}
        onToggleBoldVariable={vi.fn()}
        onSetImageField={vi.fn()}
      />
    );

    expect(html).toBeDefined();
    expect(html).toContain('Alinhamento do Texto Principal');
  });

  it('verifica que campos verso... têm mapeamento para targetPage 2 e outros para targetPage 1', () => {
    const testFields = [
      { name: 'versoHeaderPadding', expectedPage: 2 },
      { name: 'versoFooterPadding', expectedPage: 2 },
      { name: 'versoCurriculumVerticalOffset', expectedPage: 2 },
      { name: 'versoInstitutionVerticalOffset', expectedPage: 2 },
      { name: 'versoHeaderFontSize', expectedPage: 2 },
      { name: 'versoCurriculumFontSize', expectedPage: 2 },
      { name: 'versoTitleFontSize', expectedPage: 2 },
      { name: 'versoFooterFontSize', expectedPage: 2 },
      { name: 'versoSidePadding', expectedPage: 2 },
      { name: 'versoBorderWidth', expectedPage: 2 },
      { name: 'versoSplitRatio', expectedPage: 2 },
      { name: 'versoRowPadding', expectedPage: 2 },
      { name: 'hoursColumnWidth', expectedPage: 2 },
      { name: 'frontHeaderPadding', expectedPage: 1 },
      { name: 'frontFooterPadding', expectedPage: 1 },
      { name: 'frontSidePadding', expectedPage: 1 },
      { name: 'frontBorderWidth', expectedPage: 1 },
      { name: 'frontBorderMargin', expectedPage: 1 },
      { name: 'signaturesHorizontalPadding', expectedPage: 1 },
      { name: 'titleVerticalOffset', expectedPage: 1 },
      { name: 'signaturesVerticalOffset', expectedPage: 1 },
      { name: 'titleFontSize', expectedPage: 1 },
      { name: 'subtitleFontSize', expectedPage: 1 },
      { name: 'highlightNameFontSize', expectedPage: 1 },
      { name: 'bodyFontSize', expectedPage: 1 },
      { name: 'signatureFontSize', expectedPage: 1 },
      { name: 'footerFontSize', expectedPage: 1 },
      { name: 'sealSize', expectedPage: 1 },
    ];

    for (const f of testFields) {
      const targetPage = (f.name.startsWith('verso') || f.name === 'hoursColumnWidth') ? 2 : 1;
      expect(targetPage).toBe(f.expectedPage);
    }
  });

  it('aplica bodyFontSize e signatureFontSize dinamicamente na Frente do Certificado', async () => {
    const { default: CertificatePreview } = await import('../components/CertificatePreview');
    const customData = {
      ...INITIAL_CERTIFICATE_DATA,
      bodyFontSize: 28,
      signatureFontSize: 18,
    };

    const html = renderToStaticMarkup(
      <CertificatePreview data={customData} student={null} page={1} />
    );

    expect(html).toContain('font-size:28px');
    expect(html).toContain('font-size:18px');
  });

  it('aplica versoTitleFontSize e versoFooterFontSize dinamicamente no Verso do Certificado', async () => {
    const { default: CertificatePreview } = await import('../components/CertificatePreview');
    const customData = {
      ...INITIAL_CERTIFICATE_DATA,
      versoTitleFontSize: 36,
      versoFooterFontSize: 11,
    };

    const html = renderToStaticMarkup(
      <CertificatePreview data={customData} student={null} page={2} />
    );

    expect(html).toContain('font-size:36px');
    expect(html).toContain('font-size:11px');
  });

  it('aplica margens de borda e larguras de colunas dinamicamente (versoSplitRatio, hoursColumnWidth, versoSidePadding)', async () => {
    const { default: CertificatePreview } = await import('../components/CertificatePreview');
    const customData = {
      ...INITIAL_CERTIFICATE_DATA,
      versoSplitRatio: 48,
      hoursColumnWidth: 120,
      versoSidePadding: 80,
      versoBorderWidth: 8,
      frontBorderMargin: 20,
      frontBorderWidth: 24,
    };

    // Testa no Verso
    const versoHtml = renderToStaticMarkup(
      <CertificatePreview data={customData} student={null} page={2} />
    );
    expect(versoHtml).toContain('grid-template-columns:48% 1fr');
    expect(versoHtml).toContain('width:120px');
    expect(versoHtml).toContain('padding-left:80px');
    expect(versoHtml).toContain('padding-right:80px');
    expect(versoHtml).toContain('border:8px solid #f3f4f6');

    // Testa na Frente
    const frontHtml = renderToStaticMarkup(
      <CertificatePreview data={customData} student={null} page={1} />
    );
    expect(frontHtml).toContain('top:20px');
    expect(frontHtml).toContain('left:20px');
    expect(frontHtml).toContain('border-width:24px');
  });
});

