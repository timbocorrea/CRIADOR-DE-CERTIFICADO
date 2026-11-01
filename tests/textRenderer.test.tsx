import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderSafeCertificateText, resolveVariableValues } from '../utils/textRenderer';
import { replaceVariables } from '../utils/helpers';
import { CertificateData, Student, DEFAULT_BASE_TEXT } from '../types';

describe('Renderização e Interpolação Segura de Certificados (Gate 02 - XSS Elimination)', () => {
  const mockData: CertificateData = {
    students: [],
    companyName: 'Academia Tech & Inovação',
    companyCnpj: '12.345.678/0001-90',
    address: 'Av. Paulista, 1000 - São Paulo/SP',
    providerName: 'Instituto Educacional',
    providerCnpj: '98.765.432/0001-10',
    instructors: [
      { id: '1', name: 'Prof. Carlos Santos', competencies: 'Mestre em Computação' },
      { id: '2', name: 'Profa. Ana Lima', competencies: 'Doutora em Educação' }
    ],
    techResponsibleName: 'Eng. Roberto Silva',
    techResponsibleCompetencies: 'CREA 123456',
    showTechResponsible: true,
    courseName: 'Engenharia de Software Avançada',
    courseDate: '30/10/2026',
    totalHours: '120',
    baseText: DEFAULT_BASE_TEXT,
    curriculum: [],
    bgImage: null,
    signatureImage: null,
    digitalSeal: null,
    showHoursColumn: true,
    versoSplitRatio: 40,
    hoursColumnWidth: 80,
    versoRowPadding: 12,
    versoCurriculumFontSize: 12,
    versoHeaderFontSize: 16,
    footerFontSize: 9,
    versoInstitutionVerticalOffset: 0,
    versoCurriculumVerticalOffset: 0,
    mainTextVerticalOffset: 0,
    titleVerticalOffset: 0,
    titleFontSize: 100,
    subtitleFontSize: 24,
    titleSpacing: 24,
    bodyVerticalOffset: 0,
    highlightNameVerticalOffset: 0,
    highlightNameFontSize: 80,
    frontSidePadding: 128,
    signaturesVerticalOffset: 0,
    signaturesHorizontalPadding: 40,
    signatureFontSize: 14,
    frontTextAlign: 'center',
    boldVariables: ['{{NOME}}', '{{CURSO}}'],
    frontHeaderPadding: 60,
    frontFooterPadding: 24,
    versoHeaderPadding: 48,
    versoFooterPadding: 32,
    frontBorderWidth: 16,
  };

  const mockStudent: Student = {
    id: 's1',
    name: 'João Pedro da Silva',
    cpf: '52998224725',
    displayName: 'João Pedro'
  };

  describe('resolveVariableValues', () => {
    it('deve resolver todas as variáveis canônicas corretamente', () => {
      const resolved = resolveVariableValues(mockData, mockStudent);
      expect(resolved['NOME']).toBe('João Pedro da Silva');
      expect(resolved['CPF']).toBe('529.982.247-25');
      expect(resolved['CURSO']).toBe('Engenharia de Software Avançada');
      expect(resolved['CARGA_HORARIA']).toBe('120');
      expect(resolved['RAZAO_SOCIAL']).toBe('Academia Tech & Inovação');
      expect(resolved['INSTRUTORES']).toBe('Prof. Carlos Santos e Profa. Ana Lima');
    });
  });

  describe('renderSafeCertificateText (Componentes Nativos React)', () => {
    it('deve renderizar elementos React seguros com destaque em negrito onde configurado', () => {
      const template = "Certificamos que {{NOME}} concluiu o curso de {{CURSO}} com carga de {{CARGA_HORARIA}} horas.";
      const element = renderSafeCertificateText(template, mockData, mockStudent) as React.ReactElement;
      
      expect(element).toBeDefined();
      // Em JSX, os nós filhos são gerados sem perigo de injeção
      const children = element.props.children;
      expect(Array.isArray(children)).toBe(true);

      // {{NOME}} deve ser <strong> porque está em boldVariables
      const nomeElement = children.find((c: React.ReactElement) => c && c.key === '1');
      expect(nomeElement.type).toBe('strong');
      expect(nomeElement.props.children).toBe('João Pedro da Silva');

      // {{CARGA_HORARIA}} não está em boldVariables, então deve ser <span>
      const cargaElement = children.find((c: React.ReactElement) => c && c.key === '5');
      expect(cargaElement.type).toBe('span');
      expect(cargaElement.props.children).toBe('120');
    });

    it('deve neutralizar completamente payloads XSS no nome do aluno', () => {
      const maliciousStudent: Student = {
        id: 'bad',
        name: '<img src=x onerror=alert(document.cookie)>',
        cpf: '52998224725'
      };

      const template = "Aluno: {{NOME}}";
      const element = renderSafeCertificateText(template, mockData, maliciousStudent) as React.ReactElement;
      const children = element.props.children;
      const nomeElement = children.find((c: React.ReactElement) => c && c.key === '1');

      // O payload deve existir como texto literal dentro do nó React, JAMAIS como HTML interpretado
      expect(nomeElement.props.children).toBe('<img src=x onerror=alert(document.cookie)>');
      // Não existe atributo dangerouslySetInnerHTML no elemento
      expect(nomeElement.props.dangerouslySetInnerHTML).toBeUndefined();
    });
  });

  describe('replaceVariables (Função String com Escape Determinístico)', () => {
    it('deve escapar caracteres HTML e envolver em <strong> com segurança', () => {
      const maliciousStudent: Student = {
        id: 'bad',
        name: '<script>alert("hack")</script>',
        cpf: '52998224725'
      };

      const template = "Aluno: {{NOME}}";
      const output = replaceVariables(template, mockData, maliciousStudent);

      // Deve ter escapado as tags antes de aplicar o negrito
      expect(output).toContain('<strong>&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;</strong>');
      expect(output).not.toContain('<script>');
    });
  });
});
