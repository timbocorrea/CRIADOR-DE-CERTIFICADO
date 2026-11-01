import React from 'react';
import { CertificateData, Student } from '../types';
import { formatCPF } from './security';
import { normalizeVariableKey } from './aiValidator';

/**
 * Mapeia e resolve os valores dinâmicos das variáveis do certificado.
 */
export const resolveVariableValues = (data: CertificateData, student: Student | null): Record<string, string> => {
  const instructorNames = data.instructors.map(i => i.name.trim()).filter(Boolean);
  let formattedInstructors = '[INSTRUTORES]';

  if (instructorNames.length > 0) {
    if (instructorNames.length === 1) {
      formattedInstructors = instructorNames[0];
    } else {
      const last = instructorNames.pop();
      formattedInstructors = `${instructorNames.join(', ')} e ${last}`;
    }
  }

  return {
    'NOME': student?.name || '[NOME DO ALUNO]',
    'CPF': student ? formatCPF(student.cpf) : '[CPF]',
    'RAZAO_SOCIAL': data.companyName || '[EMPRESA]',
    'CNPJ': data.companyCnpj || '[CNPJ]',
    'ENDERECO': data.address || '[ENDEREÇO]',
    'INSTRUTORES': formattedInstructors,
    'CURSO': data.courseName || '[NOME DO CURSO]',
    'DATA': data.courseDate || '[DATA]',
    'CARGA_HORARIA': data.totalHours || '0',
    'PROVEDORA_NOME': data.providerName || '[PROVEDORA]',
    'PROVEDORA_CNPJ': data.providerCnpj || '[CNPJ PROVEDORA]',
  };
};

/**
 * Renderização 100% segura do texto do certificado utilizando nós nativos do React.
 * Elimina completamente a necessidade de dangerouslySetInnerHTML.
 * Todos os textos de alunos, empresas e cursos são escapados nativamente pelo JSX do React.
 * Preserva:
 * - Destaque em negrito (<strong>) nas variáveis selecionadas pelo usuário.
 * - Quebras de linha e caracteres especiais (&, <, >, ", ').
 * - Aliases de variáveis (ex: {{EMPRESA}}, {{ENDEREÇO}}, {{CARGA HORÁRIA}}).
 */
export const renderSafeCertificateText = (
  text: string,
  data: CertificateData,
  student: Student | null
): React.ReactNode => {
  if (!text) return null;

  const resolvedMap = resolveVariableValues(data, student);
  // Split dividindo o texto em literais e placeholders {{...}}
  const tokens = text.split(/(\{\{[^{}]+\}\})/g);

  return (
    <>
      {tokens.map((token, index) => {
        if (/^\{\{[^{}]+\}\}$/.test(token)) {
          const canonical = normalizeVariableKey(token);
          const hasResolved = Object.prototype.hasOwnProperty.call(resolvedMap, canonical);

          if (hasResolved) {
            const value = resolvedMap[canonical];
            const isBold = data.boldVariables.some(bv => normalizeVariableKey(bv) === canonical);

            if (isBold) {
              return <strong key={index}>{value}</strong>;
            }
            return <span key={index}>{value}</span>;
          }

          // Variável desconhecida: renderiza textualmente e com segurança
          return <span key={index}>{token}</span>;
        }

        // Texto literal do certificado (preserva quebras de linha e pontuação)
        return <React.Fragment key={index}>{token}</React.Fragment>;
      })}
    </>
  );
};
