import React, { useState, useEffect } from 'react';
import { CertificateData, Student } from '../../types';
import {
  getLocalBatchHistory,
  deleteBatchFromHistory,
  SavedBatchSummary,
} from '../../services/batchHistoryService';
import { AppDialog, AppButton, AppInput, AppBadge } from '../ui';

interface GeneratedCertificatesDatabaseModalProps {
  isOpen: boolean;
  currentUsername: string;
  onClose: () => void;
  onRestoreAndEdit: (data: CertificateData, selectedStudentIndex?: number) => void;
  onRestoreAndExportNow: (data: CertificateData, mode: 'duplex' | 'individual', selectedStudentIndex?: number) => void;
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const GeneratedCertificatesDatabaseModal: React.FC<GeneratedCertificatesDatabaseModalProps> = ({
  isOpen,
  currentUsername,
  onClose,
  onRestoreAndEdit,
  onRestoreAndExportNow,
  onNotify,
}) => {
  const [batches, setBatches] = useState<SavedBatchSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const list = getLocalBatchHistory(currentUsername);
      setBatches(list);
      if (list.length > 0 && !expandedBatchId) {
        setExpandedBatchId(list[0].id);
      }
    }
  }, [isOpen, currentUsername]);

  if (!isOpen) return null;

  const handleDelete = (id: string, courseName: string) => {
    const updated = deleteBatchFromHistory(id, currentUsername);
    setBatches(updated);
    onNotify?.('info', 'Registro Removido', `O registro de "${courseName}" foi removido do seu histórico.`);
  };

  const filteredBatches = batches.filter((b) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const matchCourse = (b.courseName || '').toLowerCase().includes(q);
    const matchDate = (b.completionDate || '').toLowerCase().includes(q);
    const matchStudent = (b.certificateData?.students || []).some(
      (s: Student) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.cpf || '').toLowerCase().includes(q)
    );
    return matchCourse || matchDate || matchStudent;
  });

  const totalCertificatesCount = batches.reduce((acc, b) => acc + (b.totalStudents || 0), 0);

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Banco de Certificados Já Gerados"
      description={`Histórico exclusivo dos certificados emitidos por ${currentUsername}`}
      icon="fa-solid fa-database"
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Total acumulado: <strong>{batches.length}</strong> turma(s) / <strong>{totalCertificatesCount}</strong> certificado(s)
          </span>
          <AppButton variant="secondary" size="sm" onClick={onClose}>
            Fechar
          </AppButton>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Barra de Pesquisa */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-blue-50/50 dark:bg-slate-800/70 border border-blue-200/70 dark:border-slate-700">
          <div className="flex-1">
            <AppInput
              id="db-certificates-search"
              placeholder="Pesquisar por nome do aluno, CPF, nome do curso ou data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon="fa-solid fa-magnifying-glass"
            />
          </div>
        </div>

        {/* Lista de Lotes e Certificados */}
        {filteredBatches.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-lg">
              <i className="fa-solid fa-folder-open"></i>
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Nenhum certificado exportado encontrado
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Sempre que você exportar um certificado em PDF (individual ou turma completa), ele ficará salvo automaticamente aqui no seu banco pessoal para que você possa recuperar ou exportar novamente a qualquer momento.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {filteredBatches.map((batch) => {
              const isExpanded = expandedBatchId === batch.id;
              const students = batch.certificateData?.students || [];

              return (
                <div
                  key={batch.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
                >
                  {/* Cabeçalho da Turma/Emissão */}
                  <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div
                      onClick={() => setExpandedBatchId(isExpanded ? null : batch.id)}
                      className="cursor-pointer space-y-1 min-w-0 flex-1"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {batch.courseName || 'Curso Sem Nome'}
                        </span>
                        <AppBadge variant="info" size="sm" icon="fa-solid fa-users">
                          {batch.totalStudents} aluno(s)
                        </AppBadge>
                        <AppBadge variant="neutral" size="sm" icon="fa-solid fa-clock">
                          {batch.workloadHours}h
                        </AppBadge>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
                        <span>
                          <i className="fa-solid fa-calendar-check mr-1 text-blue-500"></i>
                          Data do Curso: <strong>{batch.completionDate}</strong>
                        </span>
                        <span>
                          <i className="fa-solid fa-file-pdf mr-1 text-emerald-500"></i>
                          Gerado em: {new Date(batch.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {/* Ações Rápidas do Lote */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreAndEdit(batch.certificateData, 0);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white flex items-center gap-1.5 transition-all"
                        title="Carregar todos os dados desta turma no editor para revisar ou alterar"
                      >
                        <i className="fa-solid fa-pen-to-square text-[11px] text-blue-500"></i>
                        <span>Carregar no Editor</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onRestoreAndExportNow(batch.certificateData, 'duplex', 0);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-xs transition-all"
                        title="Exportar novamente o PDF de toda a turma agora"
                      >
                        <i className="fa-solid fa-file-export text-[11px]"></i>
                        <span>Exportar Novamente (PDF)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedBatchId(isExpanded ? null : batch.id)}
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        title="Ver alunos deste lote"
                      >
                        <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-[10px]`}></i>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(batch.id, batch.courseName)}
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/60"
                        title="Excluir registro do histórico"
                      >
                        <i className="fa-solid fa-trash-can text-[11px]"></i>
                      </button>
                    </div>
                  </div>

                  {/* Lista Individual de Participantes para Re-exportação Individual */}
                  {isExpanded && students.length > 0 && (
                    <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      <div className="pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>Participantes Emitidos nesta Turma ({students.length})</span>
                        <span>Ação Individual</span>
                      </div>
                      {students.map((student, idx) => (
                        <div
                          key={student.id || idx}
                          className="py-2 flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 dark:text-slate-100 block truncate">
                              {idx + 1}. {student.name}
                            </span>
                            {student.cpf && (
                              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                CPF: {student.cpf}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                onRestoreAndEdit(batch.certificateData, idx);
                                onClose();
                              }}
                              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                            >
                              <i className="fa-solid fa-eye text-[10px] text-blue-500"></i>
                              <span>Abrir Aluno</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onRestoreAndExportNow(batch.certificateData, 'individual', idx);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow-2xs"
                            >
                              <i className="fa-solid fa-download text-[10px]"></i>
                              <span>Exportar PDF Individual</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppDialog>
  );
};

