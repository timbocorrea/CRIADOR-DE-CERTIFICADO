
import { CertificateData, Student } from '../types';

export const formatCPF = (cpf: string): string => {
  if (!cpf) return '';
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return cpf;
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const replaceVariables = (text: string, data: CertificateData, student: Student | null): string => {
  const instructorNames = data.instructors.map(i => i.name);
  let formattedInstructors = '[INSTRUTORES]';
  
  if (instructorNames.length > 0) {
    if (instructorNames.length === 1) {
      formattedInstructors = instructorNames[0];
    } else {
      const last = instructorNames.pop();
      formattedInstructors = `${instructorNames.join(', ')} e ${last}`;
    }
  }

  // Mapeamento de variáveis e seus aliases (variações comuns)
  const vars: Record<string, string> = {
    '{{NOME}}': student?.name || '[NOME DO ALUNO]',
    '{{CPF}}': student ? formatCPF(student.cpf) : '[CPF]',
    '{{RAZAO_SOCIAL}}': data.companyName || '[EMPRESA]',
    '{{EMPRESA}}': data.companyName || '[EMPRESA]',
    '{{CNPJ}}': data.companyCnpj || '[CNPJ]',
    '{{ENDERECO}}': data.address || '[ENDEREÇO]',
    '{{ENDEREÇO}}': data.address || '[ENDEREÇO]',
    '{{INSTRUTORES}}': formattedInstructors,
    '{{CURSO}}': data.courseName || '[NOME DO CURSO]',
    '{{DATA}}': data.courseDate || '[DATA]',
    '{{CARGA_HORARIA}}': data.totalHours || '0',
    '{{CARGA HORARIA}}': data.totalHours || '0',
    '{{CARGA_HORÁRIA}}': data.totalHours || '0',
    '{{CARGA HORÁRIA}}': data.totalHours || '0',
    '{{PROVEDORA_NOME}}': data.providerName || '[PROVEDORA]',
    '{{PROVEDORA_CNPJ}}': data.providerCnpj || '[CNPJ PROVEDORA]',
  };

  let result = text;
  
  // Escapar o texto original para evitar injeção de HTML acidental antes de processar as variáveis
  
  Object.entries(vars).forEach(([key, value]) => {
    // Verificar se esta chave (ou suas variações) deve estar em negrito
    const shouldBold = data.boldVariables.some(bv => bv.toUpperCase() === key.toUpperCase());
    const finalValue = shouldBold ? `<strong>${value}</strong>` : value;

    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKey, 'gi');
    result = result.replace(regex, finalValue);
  });
  
  return result;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
