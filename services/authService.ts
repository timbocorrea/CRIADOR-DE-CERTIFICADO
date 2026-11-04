/**
 * Serviço de Autenticação Personalizada da Tela Operacional (CertificaMaster)
 * Permite criar e autenticar operadores por Login + Senha para isolar o Auto-Save
 * individualmente para o usuário que estava editando.
 */

export const OPERATORS_STORAGE_KEY = 'certificamaster_operators_v1';
export const ACTIVE_SESSION_STORAGE_KEY = 'certificamaster_active_session_v1';

export interface OperatorRecord {
  username: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
}

export interface OperatorSession {
  username: string;
  displayName: string;
  loggedAt: string;
}

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return null;
}

/**
 * Gera um hash determinístico seguro para a senha do operador.
 */
export function hashOperatorPassword(username: string, password: string): string {
  const input = `certificamaster_salt_v1::${username.trim().toLowerCase()}::${password}`;
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

export function listOperators(): OperatorRecord[] {
  try {
    const storage = getStorage();
    if (!storage) return [];
    const raw = storage.getItem(OPERATORS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOperators(operators: OperatorRecord[]): void {
  try {
    const storage = getStorage();
    if (storage) {
      storage.setItem(OPERATORS_STORAGE_KEY, JSON.stringify(operators));
    }
  } catch {}
}

export function getCurrentOperatorSession(): OperatorSession | null {
  try {
    const storage = getStorage();
    if (!storage) return null;
    const raw = storage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.username === 'string' && parsed.username.trim()) {
      return parsed as OperatorSession;
    }
    return null;
  } catch {
    return null;
  }
}

export function logoutOperator(): void {
  try {
    const storage = getStorage();
    if (storage) {
      storage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    }
  } catch {}
}

export interface AuthResult {
  success: boolean;
  session?: OperatorSession;
  error?: string;
}

/**
 * Cadastra um novo operador com login e senha personalizados e inicia a sessão.
 */
export function registerOperator(
  username: string,
  password: string,
  displayName?: string
): AuthResult {
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanUser || cleanUser.length < 3) {
    return { success: false, error: 'O login deve ter pelo menos 3 caracteres.' };
  }
  if (!cleanPass || cleanPass.length < 4) {
    return { success: false, error: 'A senha deve ter pelo menos 4 caracteres.' };
  }

  const operators = listOperators();
  if (operators.some((op) => op.username === cleanUser)) {
    return { success: false, error: 'Este login já está cadastrado. Use a aba "Entrar" com sua senha.' };
  }

  const newOperator: OperatorRecord = {
    username: cleanUser,
    displayName: (displayName || username).trim(),
    passwordHash: hashOperatorPassword(cleanUser, cleanPass),
    createdAt: new Date().toISOString(),
  };

  saveOperators([...operators, newOperator]);

  const session: OperatorSession = {
    username: newOperator.username,
    displayName: newOperator.displayName,
    loggedAt: new Date().toISOString(),
  };

  try {
    getStorage()?.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {}

  return { success: true, session };
}

/**
 * Autentica um operador existente. Se for o primeiro acesso daquele login no dispositivo,
 * permite criar ou autenticar verificando a senha.
 */
export function loginOperator(username: string, password: string): AuthResult {
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanUser) {
    return { success: false, error: 'Informe seu login ou usuário.' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Informe sua senha de acesso.' };
  }

  const operators = listOperators();
  const existing = operators.find((op) => op.username === cleanUser);

  if (!existing) {
    return {
      success: false,
      error: 'Usuário ainda não cadastrado neste dispositivo. Clique em "Criar Meu Acesso" para definir seu login e senha.',
    };
  }

  const expectedHash = hashOperatorPassword(cleanUser, cleanPass);
  if (existing.passwordHash !== expectedHash) {
    return { success: false, error: 'Senha incorreta para este usuário.' };
  }

  const session: OperatorSession = {
    username: existing.username,
    displayName: existing.displayName,
    loggedAt: new Date().toISOString(),
  };

  try {
    getStorage()?.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {}

  return { success: true, session };
}

