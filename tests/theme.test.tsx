import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppHeader } from '../components/layout/AppHeader';

class MockStorage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] ?? null; }
  key(index: number) { return Object.keys(this.store)[index] ?? null; }
  removeItem(key: string) { delete this.store[key]; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
}

if (!(globalThis as any).localStorage) {
  (globalThis as any).localStorage = new MockStorage();
}

if (!(globalThis as any).window) {
  (globalThis as any).window = globalThis;
}

describe('Sistema de Tema Claro / Escuro (Theme System)', () => {
  beforeEach(() => {
    (globalThis as any).localStorage.clear();
  });

  it('renderiza o botão de alternância de tema no cabeçalho (AppHeader)', () => {
    const onToggleTheme = vi.fn();
    const htmlLight = renderToStaticMarkup(
      <AppHeader
        courseName="Curso Teste"
        studentsCount={5}
        autoSaveStatus="saved"
        lastSavedTime={new Date()}
        onOpenProjectModal={vi.fn()}
        onOpenExportModal={vi.fn()}
        onExportIndividual={vi.fn()}
        theme="light"
        onToggleTheme={onToggleTheme}
      />
    );

    // No modo claro, deve exibir o botão para mudar para modo escuro (com ícone de lua)
    expect(htmlLight).toContain('aria-label="Mudar para Modo Escuro"');
    expect(htmlLight).toContain('fa-moon');

    const htmlDark = renderToStaticMarkup(
      <AppHeader
        courseName="Curso Teste"
        studentsCount={5}
        autoSaveStatus="saved"
        lastSavedTime={new Date()}
        onOpenProjectModal={vi.fn()}
        onOpenExportModal={vi.fn()}
        onExportIndividual={vi.fn()}
        theme="dark"
        onToggleTheme={onToggleTheme}
      />
    );

    // No modo escuro, deve exibir o botão para mudar para modo claro (com ícone de sol)
    expect(htmlDark).toContain('aria-label="Mudar para Modo Claro"');
    expect(htmlDark).toContain('fa-sun');
  });

  it('gerencia getInitialTheme e persistência no localStorage', async () => {
    const { getInitialTheme } = await import('../hooks/useTheme');
    
    // Padrão sem localStorage
    expect(getInitialTheme()).toBe('light');

    // Com localStorage salvo como 'dark'
    (globalThis as any).localStorage.setItem('certificamaster_theme', 'dark');
    expect(getInitialTheme()).toBe('dark');

    // Com localStorage salvo como 'light'
    (globalThis as any).localStorage.setItem('certificamaster_theme', 'light');
    expect(getInitialTheme()).toBe('light');
  });
});
