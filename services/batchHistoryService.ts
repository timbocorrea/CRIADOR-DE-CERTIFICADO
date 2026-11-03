import { CertificateData, Student } from '../types';
import { isCloudAvailable, saveBatchWithCertificates } from './supabaseService';

export interface SavedBatchSummary {
  id: string;
  courseName: string;
  completionDate: string;
  workloadHours: string;
  totalStudents: number;
  createdAt: string;
  syncedCloud: boolean;
  certificateData: CertificateData;
}

const STORAGE_KEY = 'certificamaster_batch_history';

export function getLocalBatchHistory(): SavedBatchSummary[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Erro ao carregar histórico de turmas:', err);
    return [];
  }
}

export function saveLocalBatchHistory(batches: SavedBatchSummary[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(batches.slice(0, 30)));
    }
  } catch (err) {
    console.warn('Erro ao gravar histórico de turmas:', err);
  }
}

export async function recordBatchInHistory(
  data: CertificateData,
  students: Student[]
): Promise<SavedBatchSummary> {
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

  const current = getLocalBatchHistory();
  const updated = [newEntry, ...current.filter((b) => b.id !== batchId)];
  saveLocalBatchHistory(updated);

  return newEntry;
}

export function deleteBatchFromHistory(id: string): SavedBatchSummary[] {
  const current = getLocalBatchHistory();
  const updated = current.filter((b) => b.id !== id);
  saveLocalBatchHistory(updated);
  return updated;
}
