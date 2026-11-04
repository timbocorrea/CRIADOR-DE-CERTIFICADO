import { CertificateData, Student } from '../types';
import { isCloudAvailable, saveBatchWithCertificates } from './supabaseService';
import { getCurrentOperatorSession } from './authService';

export interface SavedBatchSummary {
  id: string;
  ownerUsername: string;
  courseName: string;
  completionDate: string;
  workloadHours: string;
  totalStudents: number;
  createdAt: string;
  syncedCloud: boolean;
  certificateData: CertificateData;
}

const STORAGE_KEY = 'certificamaster_batch_history';
const USER_BATCH_STORAGE_PREFIX = 'certificamaster_batch_history_user_v1_';

function getNormalizedUserKey(username?: string): string {
  const activeUser = username || getCurrentOperatorSession()?.username || 'default';
  return activeUser.trim().toLowerCase().replace(/[^a-z0-9._@-]/g, '_') || 'default';
}

function getUserBatchStorageKey(username?: string): string {
  return `${USER_BATCH_STORAGE_PREFIX}${getNormalizedUserKey(username)}`;
}

/**
 * Obtém o banco de dados de certificados/turmas já gerados especificamente pelo usuário logado.
 */
export function getLocalBatchHistory(username?: string): SavedBatchSummary[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const userKey = getUserBatchStorageKey(username);
    const normalizedOwner = (username || getCurrentOperatorSession()?.username || 'default').trim().toLowerCase();

    const rawUser = localStorage.getItem(userKey);
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      if (Array.isArray(parsedUser)) {
        return parsedUser;
      }
    }

    // Compatibilidade com histórico anterior na chave global (filtra apenas os que pertencem ao usuário ou sem dono definido)
    const rawGlobal = localStorage.getItem(STORAGE_KEY);
    if (!rawGlobal) return [];
    const parsedGlobal = JSON.parse(rawGlobal);
    if (!Array.isArray(parsedGlobal)) return [];

    return parsedGlobal.filter(
      (b: SavedBatchSummary) => !b.ownerUsername || b.ownerUsername === normalizedOwner
    );
  } catch (err) {
    console.warn('Erro ao carregar histórico de turmas:', err);
    return [];
  }
}

export function saveLocalBatchHistory(batches: SavedBatchSummary[], username?: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      const trimmed = batches.slice(0, 50);
      localStorage.setItem(getUserBatchStorageKey(username), JSON.stringify(trimmed));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
  } catch (err) {
    console.warn('Erro ao gravar histórico de turmas:', err);
  }
}

export async function recordBatchInHistory(
  data: CertificateData,
  students: Student[],
  username?: string
): Promise<SavedBatchSummary> {
  const activeOwner = (username || getCurrentOperatorSession()?.username || 'default').trim().toLowerCase();
  const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const now = new Date().toISOString();

  let syncedCloud = false;
  if (isCloudAvailable()) {
    try {
      const cloudRes = await saveBatchWithCertificates(data, students);
      if (cloudRes.success) {
        syncedCloud = true;
      }
    } catch {
      // Mantém persistência local caso nuvem ainda não possua schema
    }
  }

  const newEntry: SavedBatchSummary = {
    id: batchId,
    ownerUsername: activeOwner,
    courseName: data.courseName || 'Curso Sem Nome',
    completionDate: data.courseDate || new Date().toLocaleDateString('pt-BR'),
    workloadHours: data.totalHours || '0',
    totalStudents: students.length,
    createdAt: now,
    syncedCloud,
    certificateData: {
      ...data,
      students: [...students],
    },
  };

  const current = getLocalBatchHistory(activeOwner);
  const updated = [newEntry, ...current.filter((b) => b.id !== batchId)];
  saveLocalBatchHistory(updated, activeOwner);

  return newEntry;
}

export function deleteBatchFromHistory(id: string, username?: string): SavedBatchSummary[] {
  const activeOwner = (username || getCurrentOperatorSession()?.username || 'default').trim().toLowerCase();
  const current = getLocalBatchHistory(activeOwner);
  const updated = current.filter((b) => b.id !== id);
  saveLocalBatchHistory(updated, activeOwner);
  return updated;
}
