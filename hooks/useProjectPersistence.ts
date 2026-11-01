import { useEffect, useRef, useState, useCallback } from 'react';
import { CertificateData } from '../types';
import {
  saveNonSensitiveConfig,
  loadNonSensitiveConfig,
  clearSavedConfig,
  exportProjectPackage,
  importProjectPackage,
  ImportProjectResult
} from '../utils/projectPersistence';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'disabled';

export function useProjectPersistence(
  data: CertificateData,
  onRestoreConfig?: (restored: Partial<CertificateData>) => void
) {
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const debounceTimerRef = useRef<any>(null);
  const hasInitializedRef = useRef<boolean>(false);

  // Restaura configurações salvas automaticamente na montagem inicial
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const savedConfig = loadNonSensitiveConfig();
      if (savedConfig && onRestoreConfig) {
        onRestoreConfig(savedConfig);
      }
    }
  }, [onRestoreConfig]);

  // Auto-save debounced apenas de configurações não sensíveis
  useEffect(() => {
    if (!hasInitializedRef.current) return;

    setAutoSaveStatus('saving');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const success = saveNonSensitiveConfig(data);
      if (success) {
        setAutoSaveStatus('saved');
        setLastSavedTime(new Date());
      } else {
        setAutoSaveStatus('idle');
      }
    }, 1200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data]);

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

  // Limpar Rascunho do LocalStorage
  const resetSavedDraft = useCallback(() => {
    clearSavedConfig();
    setAutoSaveStatus('idle');
    setLastSavedTime(null);
  }, []);

  return {
    autoSaveStatus,
    lastSavedTime,
    exportFullProject,
    importFullProject,
    resetSavedDraft
  };
}
