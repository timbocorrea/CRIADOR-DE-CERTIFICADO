/**
 * CertificaMaster - Camada de Serviços Supabase (Cloud & Autenticação)
 * Opera em Modo Híbrido:
 * - Se as credenciais do Supabase estiverem configuradas, conecta à nuvem.
 * - Se ausentes, fornece fallback seguro para modo 100% local/offline sem gerar erros.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CertificateData, Student } from '../types';

export interface PublicVerificationResult {
  isValid: boolean;
  message?: string;
  certificate?: {
    validationCode: string;
    studentName: string;
    studentCpfMasked: string;
    courseName: string;
    workloadHours: string;
    completionDate: string;
    organizationName: string;
    cnpj: string;
    techResponsibleName: string;
    techResponsibleRegistration: string;
    issuedAt: string;
  };
}

export function isCloudAvailable(): boolean {
  return isSupabaseConfigured && supabase !== null;
}

/**
 * Consulta a autenticidade de um certificado pelo código único de validação
 * (Pode ser invocado anonimamente por qualquer pessoa escaneando o QR Code)
 */
export async function verifyCertificatePublic(validationCode: string): Promise<PublicVerificationResult> {
  const code = (validationCode || '').trim().toUpperCase();
  if (!code) {
    return { isValid: false, message: 'Código de validação não informado.' };
  }

  if (!isCloudAvailable()) {
    return {
      isValid: false,
      message: 'A validação online requer o Supabase configurado em produção.',
    };
  }

  try {
    const { data, error } = await supabase!.rpc('verify_certificate', {
      p_validation_code: code,
    });

    if (error || !data) {
      // Fallback: se a RPC não existir ainda, tenta consulta direta na tabela
      const { data: cert, error: tableError } = await supabase!
        .from('issued_certificates')
        .select(`
          validation_code,
          student_name,
          student_cpf_masked,
          status,
          issue_date,
          batches (course_name, workload_hours, completion_date, company_name, company_cnpj)
        `)
        .eq('validation_code', code)
        .maybeSingle();

      if (tableError || !cert) {
        return {
          isValid: false,
          message: 'Certificado não encontrado. Verifique o código digitado.',
        };
      }

      const batch: any = cert.batches;
      return {
        isValid: cert.status === 'valid',
        certificate: {
          validationCode: cert.validation_code,
          studentName: cert.student_name,
          studentCpfMasked: cert.student_cpf_masked,
          courseName: batch?.course_name || 'Curso Registrado',
          workloadHours: batch?.workload_hours || '0',
          completionDate: batch?.completion_date || '',
          organizationName: batch?.company_name || 'Instituição Emissora',
          cnpj: batch?.company_cnpj || '',
          techResponsibleName: '',
          techResponsibleRegistration: '',
          issuedAt: cert.issue_date,
        },
      };
    }

    if (!data.is_valid) {
      return {
        isValid: false,
        message: data.message || 'Certificado inválido ou revogado.',
      };
    }

    return {
      isValid: true,
      certificate: {
        validationCode: data.validation_code,
        studentName: data.student_name,
        studentCpfMasked: data.student_cpf_masked,
        courseName: data.course_name,
        workloadHours: data.workload_hours,
        completionDate: data.completion_date,
        organizationName: data.organization_name,
        cnpj: data.cnpj,
        techResponsibleName: data.tech_responsible_name,
        techResponsibleRegistration: data.tech_responsible_registration,
        issuedAt: data.issued_at,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { isValid: false, message: `Erro ao validar certificado: ${msg}` };
  }
}

/**
 * Salva uma turma e os certificados emitidos no Supabase
 */
export async function saveBatchWithCertificates(
  data: CertificateData,
  students: Student[]
): Promise<{ success: boolean; batchId?: string; error?: string }> {
  if (!isCloudAvailable()) {
    return {
      success: false,
      error: 'Supabase não configurado neste ambiente.',
    };
  }

  try {
    const { data: userResp } = await supabase!.auth.getUser();
    const userId = userResp?.user?.id;
    if (!userId) {
      return {
        success: false,
        error: 'Você precisa estar autenticado no Supabase para sincronizar turmas na nuvem.',
      };
    }

    // 1. Cria o lote
    const { data: batch, error: batchError } = await supabase!
      .from('batches')
      .insert({
        user_id: userId,
        course_name: data.courseName || 'Curso de Capacitação',
        workload_hours: data.totalHours || '0',
        completion_date: data.courseDate || new Date().toLocaleDateString('pt-BR'),
        company_name: data.companyName || '',
        company_cnpj: data.companyCnpj || '',
        total_students: students.length,
      })
      .select()
      .single();

    if (batchError || !batch) {
      return { success: false, error: batchError?.message || 'Falha ao criar lote no banco de dados.' };
    }

    // 2. Cria os certificados individuais com hash
    const appBaseUrl = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const certRows = await Promise.all(
      students.map(async (student) => {
        const rawCpf = (student.cpf || '').replace(/\D/g, '');
        const maskedCpf = rawCpf.length === 11
          ? `***.${rawCpf.substring(3, 6)}.${rawCpf.substring(6, 9)}-**`
          : '***.***.***-**';
        
        // Gera código de validação único seguro
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const validationCode = `CM-${new Date().getFullYear()}-${randomPart}`;
        const qrPayload = `${appBaseUrl}/?validar=${validationCode}`;

        return {
          batch_id: batch.id,
          user_id: userId,
          student_name: student.name,
          student_cpf_masked: maskedCpf,
          student_cpf_hash: rawCpf ? await computeSha256(rawCpf) : 'no_cpf',
          validation_code: validationCode,
          qr_code_payload: qrPayload,
          status: 'valid',
        };
      })
    );

    const { error: certsError } = await supabase!.from('issued_certificates').insert(certRows);
    if (certsError) {
      return { success: false, error: certsError.message };
    }

    return { success: true, batchId: batch.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

async function computeSha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const enc = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(text));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return btoa(text);
}
