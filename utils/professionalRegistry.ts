/**
 * Registro profissional do Responsável Técnico (ex: CREA-12345, CRM-9876, CRO-555).
 * O valor é armazenado em um único campo (`techResponsibleCompetencies`) no formato "SIGLA-NUMERO",
 * mantendo compatibilidade com projetos salvos anteriormente (apenas o número → assume CREA).
 */

export const REGISTRY_TYPES = [
  { value: 'CREA', label: 'CREA — Engenharia / Agronomia' },
  { value: 'CRM', label: 'CRM — Medicina' },
  { value: 'CRO', label: 'CRO — Odontologia' },
  { value: 'COREN', label: 'COREN — Enfermagem' },
  { value: 'CRF', label: 'CRF — Farmácia' },
  { value: 'CRQ', label: 'CRQ — Química' },
  { value: 'CFT', label: 'CFT/CRT — Técnicos Industriais' },
  { value: 'CRBio', label: 'CRBio — Biologia' },
  { value: 'CREFITO', label: 'CREFITO — Fisioterapia' },
  { value: 'CRP', label: 'CRP — Psicologia' },
  { value: 'CRN', label: 'CRN — Nutrição' },
  { value: 'CAU', label: 'CAU — Arquitetura' },
  { value: 'MTE', label: 'MTE — Registro no Ministério do Trabalho' },
] as const;

export const DEFAULT_REGISTRY_TYPE = 'CREA';

export interface ParsedRegistry {
  type: string;
  number: string;
}

/** Separa "CRM-12345/SP" em { type: 'CRM', number: '12345/SP' }. Valores sem sigla assumem CREA. */
export function parseRegistry(raw: string | undefined | null): ParsedRegistry {
  const value = (raw || '').trim();
  if (!value) return { type: DEFAULT_REGISTRY_TYPE, number: '' };

  const match = value.match(/^([A-Za-zÀ-ÿ]{2,10})(?:[\s\-:\/º°.]+|$)(.*)$/);
  if (match && !/^\d/.test(value)) {
    const sigla = match[1];
    const known = REGISTRY_TYPES.find((t) => t.value.toLowerCase() === sigla.toLowerCase());
    return { type: known ? known.value : sigla.toUpperCase(), number: match[2].trim() };
  }

  return { type: DEFAULT_REGISTRY_TYPE, number: value };
}

/** Monta o valor armazenado "SIGLA-NUMERO". */
export function buildRegistry(type: string, number: string): string {
  const t = (type || DEFAULT_REGISTRY_TYPE).trim();
  const n = (number || '').trim();
  if (!n) return t ? `${t}-` : '';
  return `${t}-${n}`;
}

/** Texto exibido no certificado, ex: "CREA-12345/D". Retorna vazio se não houver número. */
export function formatRegistryForDisplay(raw: string | undefined | null): string {
  const { type, number } = parseRegistry(raw);
  if (!number) return '';
  return `${type.toUpperCase()}-${number}`;
}

