import { useEffect, useRef, useState, useCallback } from 'react';
import { CertificateData } from '../types';
import { INITIAL_CERTIFICATE_DATA } from './useCertificateData';
import {
  saveNonSensitiveConfig,
  loadNonSensitiveConfig,
  clearSavedConfig,
  saveFullUserWorkspace,
  loadFullUserWorkspace,
  clearFullUserWorkspace,
  exportProjectPackage,
  importProjectPackage,
  ImportProjectResult
} from '../utils/projectPersistence';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'disabled';

export function useProjectPersistence(
  data: CertificateData,
  onRestoreConfig?: (restored: Partial<CertificateData>) => void,
  userId: string = 'default'
) {
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const debounceTimerRef = useRef<any>(null);
  const loadedUserRef = useRef<string | null>(null);
  const latestDataRef = useRef<CertificateData>(data);
  const latestUserIdRef = useRef<string>(userId);

  latestDataRef.current = data;
  latestUserIdRef.current = userId;

  // Restaura o projeto completo salvo para o usuário logado ao entrar ou trocar de usuário
  useEffect(() => {
    const normalizedUser = (userId || 'default').trim().toLowerCase();
    if (loadedUserRef.current !== normalizedUser) {
      loadedUserRef.current = normalizedUser;
      const savedWorkspace = loadFullUserWorkspace(normalizedUser);
      if (savedWorkspace && onRestoreConfig) {
        onRestoreConfig({
          ...INITIAL_CERTIFICATE_DATA,
          ...savedWorkspace
        });
        setAutoSaveStatus('saved');
        setLastSavedTime(new Date());
      } else {
        const savedConfig = loadNonSensitiveConfig();
        if (savedConfig && onRestoreConfig) {
          onRestoreConfig({
            ...INITIAL_CERTIFICATE_DATA,
            ...savedConfig
          });
        } else if (onRestoreConfig) {
          onRestoreConfig({ ...INITIAL_CERTIFICATE_DATA });
        }
      }
    }
  }, [userId, onRestoreConfig]);

  // Auto-save imediato a cada alteração para o usuário logado
  useEffect(() => {
    const normalizedUser = (userId || 'default').trim().toLowerCase();
    if (loadedUserRef.current !== normalizedUser) return;

    setAutoSaveStatus('saving');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const fullSaved = saveFullUserWorkspace(normalizedUser, data);
      saveNonSensitiveConfig(data);
      if (fullSaved) {
        setAutoSaveStatus('saved');
        setLastSavedTime(new Date());
      } else {
        setAutoSaveStatus('idle');
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, userId]);

  // Garantia contra fechamento acidental da aba/navegador: grava sincronamente antes de fechar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const flushSaveSynchronously = () => {
      const activeUser = (latestUserIdRef.current || 'default').trim().toLowerCase();
      saveFullUserWorkspace(activeUser, latestDataRef.current);
      saveNonSensitiveConfig(latestDataRef.current);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushSaveSynchronously();
      }
    };

    window.addEventListener('beforeunload', flushSaveSynchronously);
    window.addEventListener('pagehide', flushSaveSynchronously);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', flushSaveSynchronously);
      window.removeEventListener('pagehide', flushSaveSynchronously);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Exportar Projeto Completo como arquivo para download
  const exportFullProject = useCallback(async (password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const jsonContent = await exportProjectPackage(data, password);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeCourse = (data.courseName || 'Projeto').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.href = url;
      a.download = `CertificaMaster_${safeCourse}_${new Date().toISOString().slice(0, 10)}.certproj`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }, [data]);

  // Importar Projeto Completo a partir de string JSON ou arquivo
  const importFullProject = useCallback(async (
    jsonText: string,
    password?: string
  ): Promise<ImportProjectResult> => {
    return importProjectPackage(jsonText, password);
  }, []);

  // Limpar Rascunho do LocalStorage (do usuário atual)
  const resetSavedDraft = useCallback(() => {
    const normalizedUser = (userId || 'default').trim().toLowerCase();
    clearFullUserWorkspace(normalizedUser);
    clearSavedConfig();
    setAutoSaveStatus('idle');
    setLastSavedTime(null);
  }, [userId]);

  return {
    autoSaveStatus,
    lastSavedTime,
    exportFullProject,
    importFullProject,
    resetSavedDraft
  };
}
