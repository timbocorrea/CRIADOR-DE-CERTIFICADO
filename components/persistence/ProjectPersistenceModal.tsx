import React, { useState } from 'react';
import { CertificateData } from '../../types';
import { AutoSaveStatus } from '../../hooks/useProjectPersistence';
import { ImportProjectResult } from '../../utils/projectPersistence';
import {
  AppDialog,
  AppButton,
  AppInput,
  AppBadge,
} from '../ui';

interface ProjectPersistenceModalProps {
  isOpen: boolean;
  autoSaveStatus: AutoSaveStatus;
  lastSavedTime: Date | null;
  onClose: () => void;
  onExportProject: (password?: string) => Promise<{ success: boolean; error?: string }>;
  onImportProject: (jsonText: string, password?: string) => Promise<ImportProjectResult>;
  onApplyImportedData: (data: CertificateData) => void;
  onResetDraft: () => void;
}

export const ProjectPersistenceModal: React.FC<ProjectPersistenceModalProps> = ({
  isOpen,
  autoSaveStatus,
  lastSavedTime,
  onClose,
  onExportProject,
  onImportProject,
  onApplyImportedData,
  onResetDraft,
}) => {
  const [exportPassword, setExportPassword] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingImportJson, setPendingImportJson] = useState<string | null>(null);
  const [importRequiresPassword, setImportRequiresPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsExporting(true);
    try {
      const res = await onExportProject(exportPassword.trim() || undefined);
      if (res.success) {
        setSuccessMessage('Projeto exportado com sucesso! Arquivo .certproj baixado.');
        setExportPassword('');
      } else {
        setErrorMessage(res.error || 'Falha ao exportar projeto.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const text = reader.result as string;
      setPendingImportJson(text);
      await processImport(text, importPassword);
    };
    reader.readAsText(file);
  };

  const processImport = async (jsonText: string, pwd?: string) => {
    setIsImporting(true);
    try {
      const res = await onImportProject(jsonText, pwd);
      if (res.success && res.data) {
        onApplyImportedData(res.data);
        setSuccessMessage('Projeto importado com sucesso! Todos os dados e participantes foram restaurados.');
        setPendingImportJson(null);
        setImportRequiresPassword(false);
        setImportPassword('');
      } else if (res.requiresPassword) {
        setImportRequiresPassword(true);
        setErrorMessage(res.error || 'Este projeto está criptografado e requer a senha para abertura.');
      } else {
        setErrorMessage(res.error || 'Erro ao importar arquivo.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleRetryWithPassword = async () => {
    if (!pendingImportJson) return;
    await processImport(pendingImportJson, importPassword);
  };

  const handleClearDraft = () => {
    if (confirm('Deseja realmente limpar as configurações visuais salvas no navegador?')) {
      onResetDraft();
      setSuccessMessage('Preferências locais removidas.');
    }
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Gerenciamento de Projetos & Segurança"
      description="Persistência local segura, backup completo em .certproj e conformidade LGPD"
      icon="fa-solid fa-floppy-disk"
      maxWidth="lg"
      footer={
        <AppButton type="button" variant="secondary" onClick={onClose}>
          Fechar
        </AppButton>
      }
    >
      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2 animate-fadeIn">
            <i className="fa-solid fa-circle-exclamation text-red-600 mt-0.5"></i>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 animate-fadeIn">
            <i className="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i>
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. Status da Persistência Local */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Preferências Visuais Salvas Localmente
              </span>
              <AppBadge
                variant={autoSaveStatus === 'saved' ? 'success' : 'neutral'}
                size="sm"
              >
                {autoSaveStatus === 'saved' ? 'Ativo' : 'Pendente'}
              </AppBadge>
            </div>
            <button
              type="button"
              onClick={handleClearDraft}
              className="text-xs text-red-600 hover:text-red-700 font-semibold"
            >
              Limpar Rascunho
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Margens, alinhamentos e dados da instituição são salvos automaticamente no navegador.
            <strong className="text-slate-700 ml-1">
              Dados pessoais de alunos (CPFs e nomes) e assinaturas NÃO são gravados no navegador por privacidade (LGPD).
            </strong>
          </p>
        </div>

        {/* 2. Exportar Projeto Completo (.certproj) */}
        <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <i className="fa-solid fa-download text-blue-600"></i>
                Exportar Projeto Completo (.certproj)
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Gera um arquivo contendo todos os dados, turma de alunos, grade e imagens.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <AppInput
              id="exportPassword"
              type="password"
              label="Senha de Proteção (Opcional - Criptografia AES-GCM 256 bits)"
              placeholder="Digite uma senha forte ou deixe em branco"
              value={exportPassword}
              onChange={(e) => setExportPassword(e.target.value)}
              helperText={
                exportPassword
                  ? 'O arquivo será cifrado com AES-GCM (PBKDF2 com 100.000 iterações).'
                  : 'Sem senha, o arquivo conterá JSON legível por qualquer pessoa que tenha acesso.'
              }
              className="bg-white"
            />

            <div className="flex justify-end pt-1">
              <AppButton
                type="button"
                size="sm"
                variant="primary"
                icon="fa-solid fa-file-arrow-down"
                isLoading={isExporting}
                onClick={handleExport}
              >
                Baixar Pacote do Projeto
              </AppButton>
            </div>
          </div>
        </div>

        {/* 3. Importar Projeto (.certproj) */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div>
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <i className="fa-solid fa-upload text-slate-600"></i>
              Importar / Restaurar Projeto (.certproj)
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Selecione um arquivo previamente exportado para restaurar o estado completo.
            </p>
          </div>

          <label className="block">
            <span className="sr-only">Escolher arquivo de projeto</span>
            <input
              type="file"
              accept=".certproj,.json"
              onChange={handleFileSelect}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </label>

          {importRequiresPassword && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-2 animate-fadeIn">
              <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <i className="fa-solid fa-lock text-amber-600"></i>
                Arquivo Criptografado — Informe a Senha
              </p>
              <div className="flex gap-2">
                <AppInput
                  type="password"
                  placeholder="Senha definida na exportação"
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  className="bg-white text-xs"
                />
                <AppButton
                  type="button"
                  size="sm"
                  variant="primary"
                  isLoading={isImporting}
                  onClick={handleRetryWithPassword}
                >
                  Descriptografar
                </AppButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppDialog>
  );
};
