
export interface Student {
  id: string;
  name: string;
  cpf: string;
  displayName?: string; // Nome que aparece em destaque (manuscrito)
}

export interface Instructor {
  id: string;
  name: string;
  competencies: string;
}

export interface CurriculumItem {
  id: string;
  subject: string;
  hours: number;
}

export interface CustomFontItem {
  id: string;
  name: string;
  fontFamily: string;
  dataUrl: string;
  format: 'truetype' | 'opentype' | 'woff' | 'woff2';
}

export interface CertificateData {
  students: Student[];
  companyName: string;
  companyCnpj: string;
  address: string;
  providerName: string;
  providerCnpj: string;
  instructors: Instructor[];
  techResponsibleName: string;
  techResponsibleCompetencies: string;
  showTechResponsible: boolean;
  courseName: string;
  certificateTitle?: string;
  certificateSubtitle?: string;
  courseDate: string;
  totalHours: string;
  workloadMode?: 'auto' | 'manual';
  baseText: string;
  curriculum: CurriculumItem[];
  bgImage: string | null;
  signatureImage: string | null;
  digitalSeal: string | null;
  titleFontFamily?: string;
  highlightNameFontFamily?: string;
  bodyFontFamily?: string;
  customFonts?: CustomFontItem[];
  showHoursColumn: boolean;
  versoSplitRatio: number;
  hoursColumnWidth: number;
  versoRowPadding: number;
  versoCurriculumFontSize: number;
  versoHeaderFontSize: number;
  versoTitleFontSize?: number;
  versoFooterFontSize?: number;
  footerFontSize: number;
  versoInstitutionVerticalOffset: number;
  versoInstitutionHorizontalOffset?: number;
  versoCurriculumVerticalOffset: number;
  versoCurriculumHorizontalOffset?: number;
  versoTitleVerticalOffset?: number;
  versoTitleHorizontalOffset?: number;
  versoFooterVerticalOffset?: number;
  versoFooterHorizontalOffset?: number;
  mainTextVerticalOffset: number;
  titleVerticalOffset: number;
  titleHorizontalOffset?: number;
  subtitleVerticalOffset?: number;
  subtitleHorizontalOffset?: number;
  titleFontSize: number;
  subtitleFontSize: number;
  titleSpacing: number;
  bodyVerticalOffset: number;
  bodyHorizontalOffset?: number;
  bodyFontSize?: number;
  highlightNameVerticalOffset: number;
  highlightNameHorizontalOffset?: number;
  highlightNameFontSize: number;
  showHighlightName?: boolean;
  frontSidePadding: number;
  signaturesVerticalOffset: number;
  signaturesHorizontalOffset?: number;
  signaturesHorizontalPadding: number;
  signatureFontSize: number;
  footerVerticalOffset?: number;
  footerHorizontalOffset?: number;
  frontTextAlign: 'left' | 'center' | 'right' | 'justify';
  boldVariables: string[];
  frontHeaderPadding: number;
  frontFooterPadding: number;
  versoHeaderPadding: number;
  versoFooterPadding: number;
  frontBorderWidth: number; // Nova propriedade para espessura da borda
  versoBorderWidth?: number;
  versoSidePadding?: number;
  frontBorderMargin?: number;
}

export const DEFAULT_BASE_TEXT = "Certificamos que {{NOME}}, portador do CPF {{CPF}}, concluiu com êxito o curso de {{CURSO}}, realizado em {{DATA}}, com carga horária total de {{CARGA_HORARIA}} horas, sob a responsabilidade técnica de {{RAZAO_SOCIAL}}, inscrita no CNPJ {{CNPJ}}, com sede em {{ENDERECO}}.";

export type AIProviderId = 'gemini' | 'groq' | 'openrouter';

export interface AISettings {
  geminiApiKey: string;
  groqApiKey: string;
  openrouterApiKey: string;
  preferredProvider: 'auto' | 'gemini' | 'groq' | 'openrouter';
  disableSystemFallback?: boolean;
}

export interface ExtractedStudentCandidate {
  name: string;
  cpf: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface AIExtractionResult {
  success: boolean;
  students: ExtractedStudentCandidate[];
  providerUsed?: AIProviderId | 'local';
  modelUsed?: string;
  error?: string;
  message?: string;
}

// Zonas interativas do certificado no Preview (Clique direto no elemento -> abre controles daquele elemento)
export type CertificateElementZone =
  | 'front_header'         // Título e Subtítulo da Frente ("CERTIFICADO", "DE PARTICIPAÇÃO")
  | 'front_highlight_name' // Nome de Destaque Manuscrito
  | 'front_body'           // Corpo do Texto de Certificação
  | 'front_signatures'     // Bloco de Assinaturas, Instrutores, Aluno e Selo/Resp. Técnico
  | 'front_footer'         // Rodapé Institucional da Frente
  | 'verso_header'         // Título do Verso ("CONTEÚDO PROGRAMÁTICO")
  | 'verso_institution'    // Coluna Esquerda do Verso (Empresa Fornecedora / Curso Ministrado)
  | 'verso_curriculum'     // Tabela da Grade Curricular no Verso
  | 'verso_footer';        // Rodapé do Verso


