import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppSidebar } from '../components/layout/AppSidebar';
import { AppDialog } from '../components/ui/AppDialog';
import { ToastProvider, useToast } from '../components/ui/AppToast';
import { AppCard } from '../components/ui/AppCard';
import { AppButton } from '../components/ui/AppButton';

describe('Gate 06: Responsividade e Acessibilidade WCAG 2.2 AA', () => {
  it('AppSidebar possui estrutura de tablist WAI-ARIA com tabs semânticas e min-h-[44px]', () => {
    const html = renderToStaticMarkup(
      <AppSidebar
        activeArea="course_issuer"
        onSelectArea={() => {}}
        studentsCount={5}
        curriculumCount={3}
      >
        <div>Painel Ativo</div>
      </AppSidebar>
    );

    // Contêiner tablist
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-orientation="horizontal"');

    // Tabs e controles
    expect(html).toContain('role="tab"');
    expect(html).toContain('id="tab-course_issuer"');
    expect(html).toContain('aria-controls="panel-course_issuer"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('tabindex="0"');

    // Aba inativa
    expect(html).toContain('id="tab-participants"');
    expect(html).toContain('aria-controls="panel-participants"');
    expect(html).toContain('aria-selected="false"');
    expect(html).toContain('tabindex="-1"');

    // Alvo de toque mínimo 44px
    expect(html).toContain('min-h-[44px]');
  });

  it('AppDialog renderiza atributos semânticos completos de diálogo e descrição acessível', () => {
    const html = renderToStaticMarkup(
      <AppDialog
        isOpen={true}
        onClose={() => {}}
        title="Exportar Certificados"
        description="Configure as opções de emissão em PDF"
        icon="fa-solid fa-print"
      >
        <div>Conteúdo Modal</div>
      </AppDialog>
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="dialog-title"');
    expect(html).toContain('aria-describedby="dialog-description"');
    expect(html).toContain('id="dialog-title"');
    expect(html).toContain('id="dialog-description"');
    expect(html).toContain('Exportar Certificados');
    expect(html).toContain('Configure as opções de emissão em PDF');
    expect(html).toContain('aria-label="Fechar diálogo"');
  });

  it('AppButton garante alvos de toque mínimos conformes com WCAG 2.2 AA (Target Size)', () => {
    const xsButton = renderToStaticMarkup(<AppButton size="xs">XS</AppButton>);
    expect(xsButton).toContain('min-h-[28px]');

    const smButton = renderToStaticMarkup(<AppButton size="sm">SM</AppButton>);
    expect(smButton).toContain('min-h-[36px]');

    const mdButton = renderToStaticMarkup(<AppButton size="md">MD</AppButton>);
    expect(mdButton).toContain('min-h-[40px]');

    const lgButton = renderToStaticMarkup(<AppButton size="lg">LG</AppButton>);
    expect(lgButton).toContain('min-h-[44px]');
  });

  it('AppCard com colapso implementa atributos de acessibilidade e gatilho de teclado', () => {
    const html = renderToStaticMarkup(
      <AppCard
        title="Configurações de Layout"
        isCollapsible={true}
        defaultExpanded={true}
      >
        <div>Opções de design</div>
      </AppCard>
    );

    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('Configurações de Layout');
  });

  it('Toast Notification contêiner possui atributos acessíveis aria-live', () => {
    const ToastTester: React.FC = () => {
      const toast = useToast();
      return (
        <div>
          <button onClick={() => toast.error('Erro de Validação', 'CPF incorreto')}>Disparar Erro</button>
          <button onClick={() => toast.success('Sucesso', 'Salvo')}>Disparar Sucesso</button>
        </div>
      );
    };

    const html = renderToStaticMarkup(
      <ToastProvider>
        <ToastTester />
      </ToastProvider>
    );

    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-atomic="true"');
  });
});
