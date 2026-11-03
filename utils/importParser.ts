import { Student } from '../types';
import { validateCPF, formatCPF, cleanCPF } from './security';
import { generateId } from './helpers';

export interface ImportParseResult {
  validStudents: Student[];
  errors: string[];
  summary: {
    totalLines: number;
    validCount: number;
    errorCount: number;
  };
}

/**
 * Divide uma linha delimitada respeitando aspas duplas (RFC 4180 simplificada).
 * Permite campos entre aspas contendo delimitadores (vírgulas, ponto-e-vírgula, tab).
 */
export function splitDelimitedLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  
  // Detecta delimitador principal fora de aspas se houver ponto-e-vírgula ou tab
  const hasTabs = line.includes('\t');
  const hasSemicolons = line.includes(';');
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Aspas duplas escapadas ("") dentro de campo entre aspas
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // pula a próxima aspa
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && (char === '\t' || char === ';' || (char === ',' && !hasTabs && !hasSemicolons))) {
      fields.push(current.trim());
      current = '';
    } else if (!inQuotes && (char === ',' && (hasTabs || hasSemicolons))) {
      // Se a linha tem tab ou ;, preserva a vírgula como parte do nome
      current += char;
    } else {
      current += char;
    }
  }
  
  fields.push(current.trim());
  return fields.map(f => {
    // Remove aspas envolventes se restarem
    if (f.startsWith('"') && f.endsWith('"') && f.length >= 2) {
      return f.substring(1, f.length - 1).trim();
    }
    return f.trim();
  });
}

/**
 * Processa texto em lote para cadastro de alunos (CM-MED-003).
 * Suporta nomes com pontuação, campos entre aspas e múltiplos delimitadores.
 */
export function parseStudentsBulkInput(
  rawText: string,
  existingStudents: Student[] = []
): ImportParseResult {
  if (!rawText || !rawText.trim()) {
    return {
      validStudents: [],
      errors: [],
      summary: { totalLines: 0, validCount: 0, errorCount: 0 }
    };
  }

  const lines = rawText.split('\n').filter(line => line.trim() !== '');
  const validStudents: Student[] = [];
  const errors: string[] = [];
  const seenCPFs = new Set<string>(existingStudents.map(s => cleanCPF(s.cpf)));

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const parts = splitDelimitedLine(line);

    if (parts.length === 0 || (parts.length === 1 && !parts[0])) {
      return;
    }

    let name = '';
    let rawCpf = '';

    if (parts.length === 1) {
      // Nome avulso sem CPF (CPF é opcional)
      name = parts[0];
      rawCpf = '';
    } else if (parts.length === 2) {
      name = parts[0];
      rawCpf = parts[1];
    } else {
      // Mais de 2 campos: o CPF é tipicamente o último campo se for numérico/formatado
      const lastPart = parts[parts.length - 1];
      const digitsOnly = cleanCPF(lastPart);
      if (digitsOnly.length === 11) {
        rawCpf = lastPart;
        name = parts.slice(0, parts.length - 1).join(', ').trim();
      } else {
        // Assume primeiro campo como nome e segundo como CPF
        name = parts[0];
        rawCpf = parts[1];
      }
    }

    name = name.trim();
    rawCpf = rawCpf.trim();

    if (!name) {
      errors.push(`Linha ${lineNum}: Nome do aluno não informado.`);
      return;
    }

    // CPF é opcional: valida e checa duplicidade somente se preenchido
    let formattedCpf = '';
    if (rawCpf) {
      if (!validateCPF(rawCpf)) {
        errors.push(`Linha ${lineNum} (${name}): CPF inválido (${rawCpf}).`);
        return;
      }

      const clean = cleanCPF(rawCpf);
      if (seenCPFs.has(clean)) {
        errors.push(`Linha ${lineNum} (${name}): CPF já cadastrado (${formatCPF(rawCpf)}).`);
        return;
      }

      seenCPFs.add(clean);
      formattedCpf = formatCPF(rawCpf);
    }

    validStudents.push({
      id: generateId(),
      name: name,
      cpf: formattedCpf,
      displayName: name
    });
  });

  return {
    validStudents,
    errors,
    summary: {
      totalLines: lines.length,
      validCount: validStudents.length,
      errorCount: errors.length
    }
  };
}
