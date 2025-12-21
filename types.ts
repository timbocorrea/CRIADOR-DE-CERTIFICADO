
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
  courseDate: string;
  totalHours: string;
  baseText: string;
  curriculum: CurriculumItem[];
  bgImage: string | null;
  signatureImage: string | null;
  digitalSeal: string | null;
  showHoursColumn: boolean;
  versoSplitRatio: number;
  hoursColumnWidth: number;
  versoRowPadding: number;
  versoCurriculumFontSize: number;
  versoHeaderFontSize: number;
  footerFontSize: number;
  versoInstitutionVerticalOffset: number;
  versoCurriculumVerticalOffset: number;
  mainTextVerticalOffset: number;
  titleVerticalOffset: number;
  titleFontSize: number;
  subtitleFontSize: number;
  titleSpacing: number;
  bodyVerticalOffset: number;
  highlightNameVerticalOffset: number;
  highlightNameFontSize: number;
  frontSidePadding: number;
  signaturesVerticalOffset: number;
  signaturesHorizontalPadding: number;
  signatureFontSize: number;
  frontTextAlign: 'left' | 'center' | 'right' | 'justify';
  boldVariables: string[];
  frontHeaderPadding: number;
  frontFooterPadding: number;
  versoHeaderPadding: number;
  versoFooterPadding: number;
  frontBorderWidth: number; // Nova propriedade para espessura da borda
}

export const DEFAULT_BASE_TEXT = "Certificamos que {{NOME}}, portador do CPF {{CPF}}, concluiu com êxito o curso de {{CURSO}}, realizado em {{DATA}}, com carga horária total de {{CARGA_HORARIA}} horas, sob a responsabilidade técnica de {{RAZAO_SOCIAL}}, inscrita no CNPJ {{CNPJ}}, com sede em {{ENDERECO}}.";
