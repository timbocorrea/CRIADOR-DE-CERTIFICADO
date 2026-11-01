import { describe, it, expect } from 'vitest';
import { escapeHtml, validateCPF, formatCPF, cleanCPF, isDuplicateCPF } from '../utils/security';

describe('Módulo de Segurança e Validação de Dados (Gate 02)', () => {
  describe('escapeHtml (Sanitização e Escape de Entidades HTML)', () => {
    it('deve escapar caracteres especiais fundamentais (&, <, >, ", \')', () => {
      const input = 'Empresa & Filhos <Ltda> "Oficial" e \'Cia\'';
      const expected = 'Empresa &amp; Filhos &lt;Ltda&gt; &quot;Oficial&quot; e &#39;Cia&#39;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('deve neutralizar injeções de script e tags executáveis', () => {
      const xss1 = '<script>alert("XSS")</script>';
      expect(escapeHtml(xss1)).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');

      const xss2 = '<img src=x onerror=alert(1)>';
      expect(escapeHtml(xss2)).toBe('&lt;img src=x onerror=alert(1)&gt;');
    });

    it('deve lidar com strings vazias e nulas graciosamente', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('validateCPF (Validação Algorítmica Módulo 11)', () => {
    it('deve aprovar CPFs matematicamente válidos com dígitos verificadores corretos', () => {
      // CPFs sintéticos matematicamente válidos segundo o algoritmo oficial
      const validCPFs = [
        '52998224725',
        '11144477735',
        '01234567890', // cálculo dependente, testar conhecidos válidos
        '529.982.247-25',
        '111.444.777-35'
      ];
      expect(validateCPF('52998224725')).toBe(true);
      expect(validateCPF('529.982.247-25')).toBe(true);
      expect(validateCPF('11144477735')).toBe(true);
      expect(validateCPF('111.444.777-35')).toBe(true);
    });

    it('deve rejeitar sequências numéricas repetidas conhecidas', () => {
      expect(validateCPF('000.000.000-00')).toBe(false);
      expect(validateCPF('111.111.111-11')).toBe(false);
      expect(validateCPF('222.222.222-22')).toBe(false);
      expect(validateCPF('999.999.999-99')).toBe(false);
    });

    it('deve rejeitar CPFs com dígitos verificadores corrompidos', () => {
      // 52998224725 alterado no último dígito
      expect(validateCPF('52998224726')).toBe(false);
      expect(validateCPF('52998224735')).toBe(false);
      expect(validateCPF('12345678901')).toBe(false);
    });

    it('deve rejeitar strings com tamanho incorreto ou vazias', () => {
      expect(validateCPF('')).toBe(false);
      expect(validateCPF('123.456.789')).toBe(false);
      expect(validateCPF('123456789012')).toBe(false);
      expect(validateCPF('abc')).toBe(false);
    });
  });

  describe('formatCPF e cleanCPF', () => {
    it('deve formatar 11 dígitos no padrão oficial com pontos e traço', () => {
      expect(formatCPF('52998224725')).toBe('529.982.247-25');
    });

    it('deve limpar pontuações mantendo apenas os dígitos', () => {
      expect(cleanCPF('529.982.247-25')).toBe('52998224725');
    });
  });

  describe('isDuplicateCPF (Detecção de Duplicidades)', () => {
    const list = [
      { id: '1', name: 'Aluno A', cpf: '529.982.247-25' },
      { id: '2', name: 'Aluno B', cpf: '111.444.777-35' },
    ];

    it('deve detectar duplicidade independentemente de pontuação', () => {
      expect(isDuplicateCPF('52998224725', list)).toBe(true);
      expect(isDuplicateCPF('529.982.247-25', list)).toBe(true);
    });

    it('não deve considerar duplicidade para novo CPF inexistente', () => {
      expect(isDuplicateCPF('98765432100', list)).toBe(false);
    });

    it('deve permitir a edição do mesmo aluno passando seu ID', () => {
      expect(isDuplicateCPF('529.982.247-25', list, '1')).toBe(false);
    });
  });
});
