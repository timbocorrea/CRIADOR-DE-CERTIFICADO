/**
 * CertificaMaster - Módulo de Segurança e Validação de Dados
 * Gate 02: Blindagem contra XSS e Validação Algorítmica de CPF
 */

/**
 * Escapa caracteres especiais de HTML para prevenir ataques XSS.
 * Converte &, <, >, ", ' para suas respectivas entidades seguras.
 */
export const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Remove qualquer caractere não numérico da string de CPF.
 */
export const cleanCPF = (cpf: string): string => {
  if (!cpf) return '';
  return cpf.replace(/\D/g, '');
};

/**
 * Formata um CPF para o padrão 000.000.000-00.
 * Se não possuir 11 dígitos numéricos, retorna a string original limpa.
 */
export const formatCPF = (cpf: string): string => {
  if (!cpf) return '';
  const numbers = cleanCPF(cpf);
  if (numbers.length !== 11) return cpf.trim();
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Validação algorítmica oficial de CPF brasileiro pelo método do Módulo 11.
 * - Rejeita strings com tamanho diferente de 11 dígitos numéricos.
 * - Rejeita sequências repetidas conhecidas (00000000000, 11111111111, etc.).
 * - Calcula e verifica os dois dígitos verificadores (DV1 e DV2).
 */
export const validateCPF = (cpf: string): boolean => {
  if (!cpf) return false;
  const numbers = cleanCPF(cpf);

  if (numbers.length !== 11) {
    return false;
  }

  // Rejeita sequências repetidas (ex: 000.000.000-00, 111.111.111-11, etc.)
  const isRepeated = numbers.split('').every(char => char === numbers[0]);
  if (isRepeated) {
    return false;
  }

  // Validação do Primeiro Dígito Verificador (DV1)
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i), 10) * (10 - i);
  }
  let firstCheck = (sum * 10) % 11;
  if (firstCheck === 10 || firstCheck === 11) {
    firstCheck = 0;
  }
  if (firstCheck !== parseInt(numbers.charAt(9), 10)) {
    return false;
  }

  // Validação do Segundo Dígito Verificador (DV2)
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i), 10) * (11 - i);
  }
  let secondCheck = (sum * 10) % 11;
  if (secondCheck === 10 || secondCheck === 11) {
    secondCheck = 0;
  }
  if (secondCheck !== parseInt(numbers.charAt(10), 10)) {
    return false;
  }

  return true;
};

/**
 * Identifica se um CPF já existe na lista de estudantes cadastrados.
 * Retorna true se houver duplicidade (comparando apenas números).
 */
export const isDuplicateCPF = (newCpf: string, existingList: { cpf: string; id?: string }[], currentStudentId?: string): boolean => {
  const cleanNew = cleanCPF(newCpf);
  if (!cleanNew) return false;
  return existingList.some(item => {
    if (currentStudentId && item.id === currentStudentId) {
      return false; // Permite edição do mesmo aluno
    }
    return cleanCPF(item.cpf) === cleanNew;
  });
};
