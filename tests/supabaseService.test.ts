import { describe, it, expect, vi } from 'vitest';
import {
  isCloudAvailable,
  verifyCertificatePublic,
  saveBatchWithCertificates,
} from '../services/supabaseService';
import { DEFAULT_CERTIFICATE_DATA } from '../types';

describe('Supabase Service & Production Cloud Gateway', () => {
  it('isCloudAvailable deve retornar booleano consistente de disponibilidade', () => {
    expect(typeof isCloudAvailable()).toBe('boolean');
  });

  it('verifyCertificatePublic deve exigir código de validação preenchido', async () => {
    const res = await verifyCertificatePublic('');
    expect(res.isValid).toBe(false);
    expect(res.message).toContain('não informado');
  });

  it('verifyCertificatePublic deve retornar status inválido para código inexistente', async () => {
    const res = await verifyCertificatePublic('CM-2026-INEXISTENTE');
    expect(res.isValid).toBe(false);
    expect(res.message).toBeDefined();
  });

  it('saveBatchWithCertificates deve retornar erro claro quando usuário não autenticado ou sem conexão', async () => {
    const res = await saveBatchWithCertificates(DEFAULT_CERTIFICATE_DATA, [
      { id: '1', name: 'Aluno Teste', cpf: '123.456.789-00' },
    ]);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });
});
