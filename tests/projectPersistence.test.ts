import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveNonSensitiveConfig,
  loadNonSensitiveConfig,
  clearSavedConfig,
  exportProjectPackage,
  importProjectPackage,
  CONFIG_STORAGE_KEY
} from '../utils/projectPersistence';
import { CertificateData } from '../types';
import { INITIAL_CERTIFICATE_DATA } from '../hooks/useCertificateData';

class MockStorage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] ?? null; }
  key(index: number) { return Object.keys(this.store)[index] ?? null; }
  removeItem(key: string) { delete this.store[key]; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
}

if (!(globalThis as any).localStorage) {
  (globalThis as any).localStorage = new MockStorage();
}

describe('G04-E: Persistência Segura e Proteção de Dados Pessoais', () => {
  beforeEach(() => {
    (globalThis as any).localStorage.clear();
  });

  const testData: CertificateData = {
    ...INITIAL_CERTIFICATE_DATA,
    courseName: 'Curso de Especialização em React',
    courseDate: '31/10/2026',
    totalHours: '120',
    companyName: 'Instituição de Ensino Superior',
    // Dados sensíveis que JAMAIS devem ser salvos em localStorage:
    students: [
      { id: '1', name: 'João da Silva', cpf: '529.982.247-25', displayName: 'João' },
      { id: '2', name: 'Maria Souza', cpf: '714.287.938-60', displayName: 'Maria' }
    ],
    signatureImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    digitalSeal: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  };

  it('saveNonSensitiveConfig deve salvar apenas configurações e layout', () => {
    const success = saveNonSensitiveConfig(testData);
    expect(success).toBe(true);

    const raw = (globalThis as any).localStorage.getItem(CONFIG_STORAGE_KEY);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw!);
    expect(parsed.courseName).toBe('Curso de Especialização em React');
    expect(parsed.totalHours).toBe('120');

    // VERIFICAÇÃO CRÍTICA DE SEGURANÇA: Dados sensíveis AUSENTES
    expect(parsed.students).toBeUndefined();
    expect(parsed.signatureImage).toBeUndefined();
    expect(parsed.digitalSeal).toBeUndefined();
    expect(parsed.bgImage).toBeUndefined();
    expect(raw).not.toContain('529.982.247-25');
    expect(raw).not.toContain('714.287.938-60');
    expect(raw).not.toContain('João da Silva');
  });

  it('loadNonSensitiveConfig deve restaurar preferências salvas', () => {
    saveNonSensitiveConfig(testData);
    const restored = loadNonSensitiveConfig();
    expect(restored).not.toBeNull();
    expect(restored?.courseName).toBe('Curso de Especialização em React');
    expect(restored?.totalHours).toBe('120');
    expect((restored as any)?.students).toBeUndefined();
  });

  it('clearSavedConfig deve remover o rascunho do localStorage', () => {
    saveNonSensitiveConfig(testData);
    expect((globalThis as any).localStorage.getItem(CONFIG_STORAGE_KEY)).not.toBeNull();

    clearSavedConfig();
    expect((globalThis as any).localStorage.getItem(CONFIG_STORAGE_KEY)).toBeNull();
  });

  it('exportação e importação de pacote completo sem senha (formato aberto)', async () => {
    const jsonString = await exportProjectPackage(testData);
    expect(jsonString).toContain('CERTIFICAMASTER_PROJECT');

    const imported = await importProjectPackage(jsonString);
    expect(imported.success).toBe(true);
    expect(imported.data?.courseName).toBe('Curso de Especialização em React');
    expect(imported.data?.students.length).toBe(2);
    expect(imported.data?.students[0].name).toBe('João da Silva');
  });

  it('exportação e importação de pacote completo criptografado com senha (AES-GCM)', async () => {
    const password = 'MinhaSenhaSegura123!';
    const encryptedJson = await exportProjectPackage(testData, password);

    // O arquivo exportado não deve conter CPFs ou nomes em texto claro
    expect(encryptedJson).not.toContain('529.982.247-25');
    expect(encryptedJson).not.toContain('João da Silva');
    expect(encryptedJson).toContain('"isEncrypted": true');

    // Import sem senha deve indicar necessidade de senha
    const noPwdAttempt = await importProjectPackage(encryptedJson);
    expect(noPwdAttempt.success).toBe(false);
    expect(noPwdAttempt.requiresPassword).toBe(true);

    // Import com senha incorreta deve falhar
    const wrongPwdAttempt = await importProjectPackage(encryptedJson, 'senha_errada');
    expect(wrongPwdAttempt.success).toBe(false);
    expect(wrongPwdAttempt.error).toContain('Senha incorreta');

    // Import com senha correta deve descriptografar integralmente
    const correctAttempt = await importProjectPackage(encryptedJson, password);
    expect(correctAttempt.success).toBe(true);
    expect(correctAttempt.data?.students.length).toBe(2);
    expect(correctAttempt.data?.students[0].cpf).toBe('529.982.247-25');
  });

  it('deve rejeitar arquivo com JSON corrompido ou formato não suportado', async () => {
    const corrupted = await importProjectPackage('{ json invalido ...');
    expect(corrupted.success).toBe(false);
    expect(corrupted.error).toContain('corrompido ou inválido');

    const wrongMagic = await importProjectPackage(JSON.stringify({ magic: 'OTHER_APP', schemaVersion: 1 }));
    expect(wrongMagic.success).toBe(false);
    expect(wrongMagic.error).toContain('não é um arquivo de projeto do CertificaMaster');
  });
});
