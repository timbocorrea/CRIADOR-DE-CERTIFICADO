import { describe, it, expect } from 'vitest';
import { validateAITextResponse, normalizeVariableKey, extractVariables } from '../utils/aiValidator';

describe('Validação de Resposta da Inteligência Artificial (Gate 02)', () => {
  const templatePadrao =
    "Certificamos que {{NOME}}, portador do CPF {{CPF}}, concluiu com êxito o curso de {{CURSO}}, realizado em {{DATA}}, com carga horária total de {{CARGA_HORARIA}} horas, sob a responsabilidade técnica de {{RAZAO_SOCIAL}}, inscrita no CNPJ {{CNPJ}}, com sede em {{ENDERECO}}.";

  describe('normalizeVariableKey', () => {
    it('deve normalizar aliases conhecidos para a forma canônica', () => {
      expect(normalizeVariableKey('{{EMPRESA}}')).toBe('RAZAO_SOCIAL');
      expect(normalizeVariableKey('{{RAZÃO_SOCIAL}}')).toBe('RAZAO_SOCIAL');
      expect(normalizeVariableKey('{{CARGA HORÁRIA}}')).toBe('CARGA_HORARIA');
      expect(normalizeVariableKey('{{ENDEREÇO}}')).toBe('ENDERECO');
      expect(normalizeVariableKey('{{NOME}}')).toBe('NOME');
    });
  });

  describe('extractVariables', () => {
    it('deve extrair todas as variáveis normalizadas do template padrão', () => {
      const vars = extractVariables(templatePadrao);
      expect(vars).toContain('NOME');
      expect(vars).toContain('CPF');
      expect(vars).toContain('CURSO');
      expect(vars).toContain('DATA');
      expect(vars).toContain('CARGA_HORARIA');
      expect(vars).toContain('RAZAO_SOCIAL');
      expect(vars).toContain('CNPJ');
      expect(vars).toContain('ENDERECO');
    });
  });

  describe('validateAITextResponse', () => {
    it('deve aprovar uma resposta reformulada que preserva 100% das variáveis obrigatórias', () => {
      const aiResponse =
        "Declaramos com honra que {{NOME}}, inscrito no CPF sob o nº {{CPF}}, finalizou o programa de capacitação em {{CURSO}} na data de {{DATA}}, perfazendo a carga horária de {{CARGA_HORARIA}} horas. A certificação é chancelada por {{RAZAO_SOCIAL}}, CNPJ {{CNPJ}}, localizada em {{ENDERECO}}.";

      const result = validateAITextResponse(templatePadrao, aiResponse);
      expect(result.valid).toBe(true);
      expect(result.sanitizedText).toBe(aiResponse.trim());
    });

    it('deve aprovar resposta que usa aliases aceitos (ex: {{EMPRESA}} no lugar de {{RAZAO_SOCIAL}})', () => {
      const aiResponseComAlias =
        "Certificamos que {{NOME}}, CPF {{CPF}}, completou {{CURSO}} em {{DATA}} com {{CARGA_HORÁRIA}} horas sob {{EMPRESA}}, CNPJ {{CNPJ}}, sediada em {{ENDEREÇO}}.";

      const result = validateAITextResponse(templatePadrao, aiResponseComAlias);
      expect(result.valid).toBe(true);
    });

    it('deve rejeitar e bloquear resposta caso uma variável obrigatória seja omitida pela IA', () => {
      // Omitiu {{CPF}}
      const aiResponseIncompleta =
        "Certificamos que {{NOME}} concluiu o curso de {{CURSO}}, em {{DATA}}, com {{CARGA_HORARIA}} horas, sob a responsabilidade de {{RAZAO_SOCIAL}}, CNPJ {{CNPJ}}, em {{ENDERECO}}.";

      const result = validateAITextResponse(templatePadrao, aiResponseIncompleta);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('{{CPF}}');
      expect(result.missingVariables).toContain('{{CPF}}');
    });

    it('deve rejeitar e bloquear resposta vazia ou composta apenas de espaços', () => {
      expect(validateAITextResponse(templatePadrao, '').valid).toBe(false);
      expect(validateAITextResponse(templatePadrao, '   ').valid).toBe(false);
    });

    it('deve rejeitar resposta que introduza variáveis desconhecidas ou inventadas', () => {
      const aiResponseComVariavelInventada =
        "Certificamos que {{NOME}}, CPF {{CPF}}, concluiu {{CURSO}} em {{DATA}}, carga {{CARGA_HORARIA}}, sob {{RAZAO_SOCIAL}}, CNPJ {{CNPJ}}, endereço {{ENDERECO}}, com nota {{NOTA_FINAL}}.";

      const result = validateAITextResponse(templatePadrao, aiResponseComVariavelInventada);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('{{NOTA_FINAL}}');
      expect(result.unknownVariables).toContain('{{NOTA_FINAL}}');
    });

    it('deve rejeitar resposta contendo injeções de script ou código HTML perigoso', () => {
      const aiResponseComScript =
        "Certificamos que {{NOME}} <script>alert('hack')</script> concluiu {{CURSO}}...";

      const result = validateAITextResponse(templatePadrao, aiResponseComScript);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('código HTML não permitido');
    });
  });
});
