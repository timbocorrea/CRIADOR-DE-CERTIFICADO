import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AppButton,
  AppBadge,
  AppInput,
  AppTextarea,
  AppSelect,
  AppCard,
  AppTabs,
  AppEmptyState,
} from '../components/ui';

describe('Design System: Componentes Base de UI (G05-B)', () => {
  it('AppButton renderiza com variante, ícone e classes acessíveis', () => {
    const html = renderToStaticMarkup(
      <AppButton variant="primary" icon="fa-solid fa-save">
        Salvar Certificado
      </AppButton>
    );

    expect(html).toContain('Salvar Certificado');
    expect(html).toContain('fa-solid fa-save');
    expect(html).toContain('bg-blue-600');
    expect(html).toContain('focus-visible:ring-2');
  });

  it('AppButton exibe estado de loading e desabilita interação', () => {
    const html = renderToStaticMarkup(
      <AppButton isLoading>
        Processando
      </AppButton>
    );

    expect(html).toContain('fa-circle-notch fa-spin');
    expect(html).toContain('disabled=""');
  });

  it('AppBadge exibe conteúdo com variantes e ícone acessível', () => {
    const html = renderToStaticMarkup(
      <AppBadge variant="success" icon="fa-solid fa-check">
        Aprovado
      </AppBadge>
    );

    expect(html).toContain('Aprovado');
    expect(html).toContain('fa-solid fa-check');
    expect(html).toContain('bg-emerald-50');
    expect(html).toContain('text-emerald-700');
  });

  it('AppInput associa rótulo semântico e reflete atributos acessíveis', () => {
    const html = renderToStaticMarkup(
      <AppInput
        id="nome-completo"
        label="Nome Completo"
        placeholder="Digite seu nome"
        required
      />
    );

    expect(html).toContain('for="nome-completo"');
    expect(html).toContain('id="nome-completo"');
    expect(html).toContain('Nome Completo');
    expect(html).toContain('required=""');
  });

  it('AppInput exibe mensagem de erro quando informada com aria-invalid', () => {
    const html = renderToStaticMarkup(
      <AppInput
        id="cpf-field"
        label="CPF"
        error="CPF inválido com dígito verificador incorreto"
      />
    );

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('CPF inválido com dígito verificador incorreto');
    expect(html).toContain('text-red-600');
  });

  it('AppTextarea renderiza com rótulo, linhas configuradas e helperText', () => {
    const html = renderToStaticMarkup(
      <AppTextarea
        id="base-text"
        label="Texto do Certificado"
        rows={5}
        helperText="Máximo de 500 caracteres"
      />
    );

    expect(html).toContain('for="base-text"');
    expect(html).toContain('rows="5"');
    expect(html).toContain('Máximo de 500 caracteres');
  });

  it('AppSelect renderiza opções configuradas e ícone de seleção', () => {
    const options = [
      { value: 'auto', label: 'Automático' },
      { value: 'manual', label: 'Manual' },
    ];
    const html = renderToStaticMarkup(
      <AppSelect
        id="modo-horas"
        label="Modo de Carga Horária"
        options={options}
      />
    );

    expect(html).toContain('for="modo-horas"');
    expect(html).toContain('value="auto"');
    expect(html).toContain('Automático');
    expect(html).toContain('value="manual"');
    expect(html).toContain('Manual');
  });

  it('AppCard renderiza título, ícone, badge e conteúdo', () => {
    const html = renderToStaticMarkup(
      <AppCard
        title="Configurações Avançadas"
        icon="fa-solid fa-gear"
        badge={<AppBadge variant="info">Beta</AppBadge>}
      >
        <div data-testid="card-content">Conteúdo da Seção</div>
      </AppCard>
    );

    expect(html).toContain('Configurações Avançadas');
    expect(html).toContain('fa-solid fa-gear');
    expect(html).toContain('Beta');
    expect(html).toContain('Conteúdo da Seção');
  });

  it('AppTabs renderiza tabs com papéis de acessibilidade (tablist/tab) e seleciona aba ativa', () => {
    const tabs = [
      { id: 'tab1', label: 'Curso' },
      { id: 'tab2', label: 'Alunos' },
    ];
    const html = renderToStaticMarkup(
      <AppTabs tabs={tabs} activeTab="tab1" onChange={() => {}} />
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('Curso');
    expect(html).toContain('Alunos');
  });

  it('AppEmptyState renderiza com ícone e texto de auxílio', () => {
    const html = renderToStaticMarkup(
      <AppEmptyState
        title="Nenhum aluno cadastrado"
        description="Adicione alunos individualmente ou importe uma lista."
      />
    );

    expect(html).toContain('Nenhum aluno cadastrado');
    expect(html).toContain('Adicione alunos individualmente ou importe uma lista.');
  });
});
