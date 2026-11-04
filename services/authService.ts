/**
 * Serviço de Autenticação Personalizada e Governança Administrativa (CertificaMaster)
 * - Identifica o usuário Master ("timbo.correa@gmail.com") com privilégios de Administrador.
 * - Gerencia usuários comuns ("user"), que possuem permissão apenas para criar e editar
 *   seus próprios certificados (com Auto-Save isolado) quando liberados pelo Admin.
 * - Permite ao Master bloquear, permitir (aprovar), criar, alterar senha e remover usuários
 *   diretamente no Painel Administrativo integrado ao editor, sincronizando com Supabase quando disponível.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const OPERATORS_STORAGE_KEY = 'certificamaster_operators_v1';
export const ACTIVE_SESSION_STORAGE_KEY = 'certificamaster_active_session_v1';
export const ADMIN_SETTINGS_STORAGE_KEY = 'certificamaster_admin_settings_v1';
export const MASTER_ADMIN_EMAIL = 'timbo.correa@gmail.com';

export type OperatorRole = 'master' | 'user';
export type OperatorStatus = 'active' | 'blocked' | 'pending';

export interface OperatorRecord {
  username: string;
  displayName: string;
  passwordHash: string;
  role: OperatorRole;
  status: OperatorStatus;
  createdAt: string;
  lastLoginAt?: string;
}

export interface OperatorSession {
  username: string;
  displayName: string;
  role: OperatorRole;
  status: OperatorStatus;
  loggedAt: string;
}

export interface AdminGovernanceSettings {
  requireApprovalForNewUsers: boolean;
  allowSelfRegistration: boolean;
}

const DEFAULT_ADMIN_SETTINGS: AdminGovernanceSettings = {
  requireApprovalForNewUsers: false,
  allowSelfRegistration: true,
};

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return null;
}

export function isMasterUsername(username: string): boolean {
  return (username || '').trim().toLowerCase() === MASTER_ADMIN_EMAIL;
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

export function getAdminGovernanceSettings(): AdminGovernanceSettings {
  try {
    const storage = getStorage();
    if (!storage) return DEFAULT_ADMIN_SETTINGS;
    const raw = storage.getItem(ADMIN_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_ADMIN_SETTINGS;
    return { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

export function saveAdminGovernanceSettings(settings: Partial<AdminGovernanceSettings>): AdminGovernanceSettings {
  const updated = { ...getAdminGovernanceSettings(), ...settings };
  try {
    getStorage()?.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

function normalizeOperatorRecord(raw: any): OperatorRecord {
  const cleanUser = String(raw?.username || '').trim().toLowerCase();
  const isMaster = isMasterUsername(cleanUser);
  return {
    username: cleanUser,
    displayName: String(raw?.displayName || cleanUser),
    passwordHash: String(raw?.passwordHash || ''),
    role: isMaster ? 'master' : 'user',
    status: isMaster ? 'active' : (raw?.status === 'blocked' || raw?.status === 'pending' ? raw.status : 'active'),
    createdAt: raw?.createdAt || new Date().toISOString(),
    lastLoginAt: raw?.lastLoginAt,
  };
}

export function listOperators(): OperatorRecord[] {
  try {
    const storage = getStorage();
    if (!storage) return [];
    const raw = storage.getItem(OPERATORS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeOperatorRecord);
  } catch {
    return [];
  }
}

function saveOperators(operators: OperatorRecord[]): void {
  try {
    const storage = getStorage();
    if (storage) {
      const normalized = operators.map(normalizeOperatorRecord);
      storage.setItem(OPERATORS_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch {}
}

/**
 * Sincroniza opcionalmente o registro do operador com o Supabase caso a tabela `app_operators` exista.
 */
async function syncOperatorToCloud(record: OperatorRecord): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('app_operators').upsert(
      {
        username: record.username,
        display_name: record.displayName,
        password_hash: record.passwordHash,
        role: record.role,
        status: record.status,
        created_at: record.createdAt,
        last_login_at: record.lastLoginAt || null,
      },
      { onConflict: 'username' }
    );
  } catch {
    // Silencioso caso a tabela ainda não tenha sido criada no banco
  }
}

export async function syncOperatorsFromCloud(): Promise<OperatorRecord[]> {
  const localOps = listOperators();
  if (!isSupabaseConfigured || !supabase) return localOps;

  try {
    const { data, error } = await supabase.from('app_operators').select('*');
    if (error || !Array.isArray(data)) return localOps;

    const mergedMap = new Map<string, OperatorRecord>();
    for (const op of localOps) {
      mergedMap.set(op.username, op);
    }
    for (const row of data) {
      const username = String(row.username || '').trim().toLowerCase();
      if (!username) continue;
      mergedMap.set(
        username,
        normalizeOperatorRecord({
          username,
          displayName: row.display_name || username,
          passwordHash: row.password_hash || mergedMap.get(username)?.passwordHash || '',
          role: row.role,
          status: row.status,
          createdAt: row.created_at,
          lastLoginAt: row.last_login_at,
        })
      );
    }
    const mergedList = Array.from(mergedMap.values());
    saveOperators(mergedList);
    return mergedList;
  } catch {
    return localOps;
  }
}

export function getCurrentOperatorSession(): OperatorSession | null {
  try {
    const storage = getStorage();
    if (!storage) return null;
    const raw = storage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.username !== 'string' || !parsed.username.trim()) {
      return null;
    }

    const cleanUser = parsed.username.trim().toLowerCase();
    const operators = listOperators();
    const record = operators.find((op) => op.username === cleanUser);

    // Se o usuário foi bloqueado pelo Master ou removido, encerra imediatamente a sessão
    if (record && !isMasterUsername(cleanUser) && record.status !== 'active') {
      storage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      return null;
    }

    return {
      username: cleanUser,
      displayName: record?.displayName || parsed.displayName || cleanUser,
      role: isMasterUsername(cleanUser) ? 'master' : 'user',
      status: isMasterUsername(cleanUser) ? 'active' : (record?.status || 'active'),
      loggedAt: parsed.loggedAt || new Date().toISOString(),
    };
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
 * Cadastra um novo operador com login e senha personalizados.
 * - O usuário "timbo.correa@gmail.com" recebe automaticamente o papel 'master' e status 'active'.
 * - Demais usuários recebem sempre o papel 'user' (acesso restrito à edição dos próprios certificados).
 */
export function registerOperator(
  username: string,
  password: string,
  displayName?: string
): AuthResult {
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanUser || cleanUser.length < 3) {
    return { success: false, error: 'O login/e-mail deve ter pelo menos 3 caracteres.' };
  }
  if (!cleanPass || cleanPass.length < 4) {
    return { success: false, error: 'A senha deve ter pelo menos 4 caracteres.' };
  }

  const isMaster = isMasterUsername(cleanUser);
  const settings = getAdminGovernanceSettings();

  if (!isMaster && !settings.allowSelfRegistration) {
    return {
      success: false,
      error: 'O cadastro automático está desativado pelo Administrador Master. Solicite a criação do seu usuário ao administrador.',
    };
  }

  const operators = listOperators();
  if (operators.some((op) => op.username === cleanUser)) {
    return { success: false, error: 'Este usuário já está cadastrado. Use a aba "Entrar" com sua senha.' };
  }

  const initialStatus: OperatorStatus = isMaster
    ? 'active'
    : settings.requireApprovalForNewUsers
    ? 'pending'
    : 'active';

  const newOperator: OperatorRecord = {
    username: cleanUser,
    displayName: (displayName || (isMaster ? 'Administrador Master' : username)).trim(),
    passwordHash: hashOperatorPassword(cleanUser, cleanPass),
    role: isMaster ? 'master' : 'user',
    status: initialStatus,
    createdAt: new Date().toISOString(),
    lastLoginAt: initialStatus === 'active' ? new Date().toISOString() : undefined,
  };

  saveOperators([...operators, newOperator]);
  void syncOperatorToCloud(newOperator);

  if (initialStatus === 'pending') {
    return {
      success: false,
      error: 'Cadastro realizado! Sua conta aguarda liberação do Administrador Master (timbo.correa@gmail.com) para acessar o sistema.',
    };
  }

  const session: OperatorSession = {
    username: newOperator.username,
    displayName: newOperator.displayName,
    role: newOperator.role,
    status: newOperator.status,
    loggedAt: new Date().toISOString(),
  };

  try {
    getStorage()?.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {}

  return { success: true, session };
}

/**
 * Autentica um operador existente verificando permissões e bloqueios administrativos.
 */
export function loginOperator(username: string, password: string): AuthResult {
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanUser) {
    return { success: false, error: 'Informe seu login ou e-mail.' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Informe sua senha de acesso.' };
  }

  const operators = listOperators();
  const existing = operators.find((op) => op.username === cleanUser);

  if (!existing) {
    // Se for o usuário Master (timbo.correa@gmail.com) acessando pela primeira vez neste navegador,
    // cria automaticamente o registro Master com a senha informada para facilitar o acesso imediato
    if (isMasterUsername(cleanUser) && cleanPass.length >= 4) {
      return registerOperator(cleanUser, cleanPass, 'Administrador Master');
    }

    return {
      success: false,
      error: 'Usuário ainda não cadastrado neste dispositivo. Clique em "Criar Meu Acesso" ou solicite liberação ao Administrador Master.',
    };
  }

  const expectedHash = hashOperatorPassword(cleanUser, cleanPass);
  if (existing.passwordHash !== expectedHash) {
    return { success: false, error: 'Senha incorreta para este usuário.' };
  }

  // Verifica se o usuário (não-master) está bloqueado ou pendente de liberação pelo Admin
  if (!isMasterUsername(cleanUser)) {
    if (existing.status === 'blocked') {
      return {
        success: false,
        error: 'Acesso bloqueado pelo Administrador Master. Entre em contato com a administração para liberação.',
      };
    }
    if (existing.status === 'pending') {
      return {
        success: false,
        error: 'Sua conta está aguardando liberação do Administrador Master para acessar o sistema.',
      };
    }
  }

  const updatedRecord: OperatorRecord = {
    ...existing,
    role: isMasterUsername(cleanUser) ? 'master' : 'user',
    status: isMasterUsername(cleanUser) ? 'active' : existing.status,
    lastLoginAt: new Date().toISOString(),
  };

  saveOperators(operators.map((op) => (op.username === cleanUser ? updatedRecord : op)));
  void syncOperatorToCloud(updatedRecord);

  const session: OperatorSession = {
    username: updatedRecord.username,
    displayName: updatedRecord.displayName,
    role: updatedRecord.role,
    status: updatedRecord.status,
    loggedAt: new Date().toISOString(),
  };

  try {
    getStorage()?.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {}

  return { success: true, session };
}

/* ========================================================================= */
/* FUNÇÕES EXCLUSIVAS DO PAINEL ADMINISTRATIVO MASTER                        */
/* ========================================================================= */

/**
 * Permite ao Administrador Master bloquear ou liberar ("active" / "blocked") o acesso de um usuário "user".
 */
export function adminSetOperatorStatus(
  targetUsername: string,
  newStatus: OperatorStatus
): { success: boolean; error?: string; operators?: OperatorRecord[] } {
  const cleanTarget = targetUsername.trim().toLowerCase();
  if (isMasterUsername(cleanTarget)) {
    return { success: false, error: 'O usuário Master principal não pode ser bloqueado.' };
  }

  const operators = listOperators();
  const target = operators.find((op) => op.username === cleanTarget);
  if (!target) {
    return { success: false, error: 'Usuário não encontrado.' };
  }

  const updatedRecord: OperatorRecord = {
    ...target,
    role: 'user',
    status: newStatus,
  };

  const updatedList = operators.map((op) => (op.username === cleanTarget ? updatedRecord : op));
  saveOperators(updatedList);
  void syncOperatorToCloud(updatedRecord);

  return { success: true, operators: updatedList };
}

/**
 * Permite ao Administrador Master cadastrar diretamente um novo usuário "user" já liberado ou bloqueado.
 */
export function adminCreateUserOperator(
  username: string,
  password: string,
  displayName?: string,
  initialStatus: OperatorStatus = 'active'
): { success: boolean; error?: string; operators?: OperatorRecord[] } {
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanUser || cleanUser.length < 3) {
    return { success: false, error: 'O login/e-mail deve ter pelo menos 3 caracteres.' };
  }
  if (!cleanPass || cleanPass.length < 4) {
    return { success: false, error: 'A senha deve ter pelo menos 4 caracteres.' };
  }

  const operators = listOperators();
  if (operators.some((op) => op.username === cleanUser)) {
    return { success: false, error: 'Já existe um usuário cadastrado com este login/e-mail.' };
  }

  const isMaster = isMasterUsername(cleanUser);
  const newOp: OperatorRecord = {
    username: cleanUser,
    displayName: (displayName || cleanUser).trim(),
    passwordHash: hashOperatorPassword(cleanUser, cleanPass),
    role: isMaster ? 'master' : 'user',
    status: isMaster ? 'active' : initialStatus,
    createdAt: new Date().toISOString(),
  };

  const updatedList = [...operators, newOp];
  saveOperators(updatedList);
  void syncOperatorToCloud(newOp);

  return { success: true, operators: updatedList };
}

/**
 * Permite ao Administrador Master redefinir a senha de qualquer usuário.
 */
export function adminResetOperatorPassword(
  targetUsername: string,
  newPassword: string
): { success: boolean; error?: string } {
  const cleanTarget = targetUsername.trim().toLowerCase();
  const cleanPass = newPassword.trim();
  if (!cleanPass || cleanPass.length < 4) {
    return { success: false, error: 'A nova senha deve ter pelo menos 4 caracteres.' };
  }

  const operators = listOperators();
  const target = operators.find((op) => op.username === cleanTarget);
  if (!target) {
    return { success: false, error: 'Usuário não encontrado.' };
  }

  const updatedRecord: OperatorRecord = {
    ...target,
    passwordHash: hashOperatorPassword(cleanTarget, cleanPass),
  };

  saveOperators(operators.map((op) => (op.username === cleanTarget ? updatedRecord : op)));
  void syncOperatorToCloud(updatedRecord);

  return { success: true };
}

/**
 * Permite ao Administrador Master excluir um usuário "user" do sistema.
 */
export function adminDeleteOperator(
  targetUsername: string
): { success: boolean; error?: string; operators?: OperatorRecord[] } {
  const cleanTarget = targetUsername.trim().toLowerCase();
  if (isMasterUsername(cleanTarget)) {
    return { success: false, error: 'A conta Master (timbo.correa@gmail.com) não pode ser removida.' };
  }

  const operators = listOperators();
  const updatedList = operators.filter((op) => op.username !== cleanTarget);
  saveOperators(updatedList);

  if (isSupabaseConfigured && supabase) {
    void supabase.from('app_operators').delete().eq('username', cleanTarget);
  }

  return { success: true, operators: updatedList };
}
