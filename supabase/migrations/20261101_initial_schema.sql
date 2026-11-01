-- ==============================================================================
-- CERTIFICAMASTER - SCHEMA DE PRODUÇÃO (SUPABASE POSTGRESQL + RLS)
-- ==============================================================================

-- 1. Extensões essenciais
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Perfis das Instituições / Emissores
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_name TEXT,
  cnpj TEXT,
  address TEXT,
  tech_responsible_name TEXT,
  tech_responsible_registration TEXT,
  logo_url TEXT,
  signature_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. Tabela de Modelos de Certificado (Templates Salvos na Nuvem)
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  course_name TEXT,
  base_text TEXT,
  layout_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  curriculum_topics JSONB DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. Tabela de Turmas / Lotes Emitidos (Batches)
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_name TEXT NOT NULL,
  workload_hours TEXT NOT NULL,
  completion_date TEXT NOT NULL,
  company_name TEXT,
  company_cnpj TEXT,
  total_students INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5. Tabela de Certificados Emitidos com Hash Criptográfico e Código Único de Validação
CREATE TABLE IF NOT EXISTS public.issued_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  student_cpf_masked TEXT NOT NULL,
  student_cpf_hash TEXT NOT NULL,
  validation_code TEXT UNIQUE NOT NULL,
  qr_code_payload TEXT NOT NULL,
  issue_date TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'revoked', 'pending')) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices de Alta Performance para Busca Pública e Consulta por Código/CPF
CREATE INDEX IF NOT EXISTS idx_certificates_validation_code ON public.issued_certificates(validation_code);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.issued_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_batch_id ON public.issued_certificates(batch_id);
CREATE INDEX IF NOT EXISTS idx_certificates_cpf_hash ON public.issued_certificates(student_cpf_hash);

-- ==============================================================================
-- 6. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issued_certificates ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Usuários podem visualizar o próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar o próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem criar o próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas para Templates
CREATE POLICY "Emissores gerenciam seus próprios templates"
  ON public.certificate_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para Turmas (Batches)
CREATE POLICY "Emissores gerenciam suas próprias turmas"
  ON public.batches FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para Certificados Emitidos (Privado para o Emissor)
CREATE POLICY "Emissores gerenciam seus próprios certificados"
  ON public.issued_certificates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Consulta Pública de Certificados: Qualquer pessoa pode consultar certificados pelo validation_code
CREATE POLICY "Público pode validar certificados existentes"
  ON public.issued_certificates FOR SELECT
  TO anon, authenticated
  USING (true);

-- ==============================================================================
-- 7. FUNÇÃO RPC DE VALIDAÇÃO PÚBLICA SEGURA (LGPD COMPLIANT)
-- ==============================================================================
-- Permite que qualquer pessoa ou empresa consulte um certificado escaneando o QR Code
-- sem expor o CPF completo do participante.

CREATE OR REPLACE FUNCTION public.verify_certificate(p_validation_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cert RECORD;
  v_batch RECORD;
  v_profile RECORD;
  v_result JSONB;
BEGIN
  -- Busca o certificado pelo código único
  SELECT * INTO v_cert
  FROM public.issued_certificates
  WHERE validation_code = UPPER(TRIM(p_validation_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'is_valid', FALSE,
      'message', 'Certificado não localizado ou código de autenticidade inválido.'
    );
  END IF;

  -- Busca informações da turma associada
  SELECT * INTO v_batch
  FROM public.batches
  WHERE id = v_cert.batch_id
  LIMIT 1;

  -- Busca informações da instituição emissora
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_cert.user_id
  LIMIT 1;

  v_result := jsonb_build_object(
    'is_valid', (v_cert.status = 'valid'),
    'status', v_cert.status,
    'validation_code', v_cert.validation_code,
    'student_name', v_cert.student_name,
    'student_cpf_masked', v_cert.student_cpf_masked,
    'course_name', COALESCE(v_batch.course_name, 'Curso de Capacitação Profissional'),
    'workload_hours', COALESCE(v_batch.workload_hours, '0'),
    'completion_date', COALESCE(v_batch.completion_date, ''),
    'organization_name', COALESCE(v_profile.organization_name, v_batch.company_name, 'Instituição de Ensino Registrada'),
    'cnpj', COALESCE(v_profile.cnpj, v_batch.company_cnpj, ''),
    'tech_responsible_name', COALESCE(v_profile.tech_responsible_name, ''),
    'tech_responsible_registration', COALESCE(v_profile.tech_responsible_registration, ''),
    'issued_at', v_cert.issue_date
  );

  RETURN v_result;
END;
$$;

-- Libera execução pública da verificação
GRANT EXECUTE ON FUNCTION public.verify_certificate(TEXT) TO anon, authenticated;
