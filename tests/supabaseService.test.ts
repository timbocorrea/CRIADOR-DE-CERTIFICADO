import { describe, it, expect, vi } from 'vitest';
import {
  isCloudAvailable,
  verifyCertificatePublic,
  saveBatchWithCertificates,
} from '../services/supabaseService';
import { DEFAULT_CERTIFICATE_DATA } from '../types';

describe('Supabase Service & Production Cloud Gateway', () => {
  it('isCloudAvailable deve retornar false quando as credenciais não estiverem configuradas', () => {
    expect(isCloudAvailable()).toBe(false);
  });

  it('verifyCertificatePublic deve exigir código de validação preenchido', async () => {
    const res = await verifyCertificatePublic('');
    expect(res.isValid).toBe(false);
    expect(res.message).toContain('não informado');
  });

  it('verifyCertificatePublic deve alertar de forma amigável quando executado sem Supabase configurado', async () => {
    const res = await verifyCertificatePublic('CM-2026-TESTE');
    expect(res.isValid).toBe(false);
    expect(res.message).toContain('Supabase configurado');
  });

  it('saveBatchWithCertificates deve retornar erro claro e seguro se Supabase não estiver conectado', async () => {
    const res = await saveBatchWithCertificates(DEFAULT_CERTIFICATE_DATA, [
      { id: '1', name: 'Aluno Teste', cpf: '123.456.789-00' },
    ]);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Supabase não configurado');
  });
});
