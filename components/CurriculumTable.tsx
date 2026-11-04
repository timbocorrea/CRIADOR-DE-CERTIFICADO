import React, { useState, useRef } from 'react';
import { CurriculumItem } from '../types';
import { generateId } from '../utils/helpers';
import { fileToBase64 } from '../utils/fileParser';
import {
  extractCurriculumFromImage,
  extractCurriculumFromTextWithAI,
  parseCurriculumBulkTextLocal,
  loadAISettings,
  hasAvailableAIKey,
} from '../services/unifiedAIService';
import { AISettingsModal } from './ai/AISettingsModal';

interface CurriculumTableProps {
  items: CurriculumItem[];
  totalHours: string;
  showHoursColumn: boolean;
  workloadMode?: 'auto' | 'manual';
  calculatedHours?: number;
  onToggleWorkloadMode?: (mode: 'auto' | 'manual') => void;
  onAdd: (item: CurriculumItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updatedItem: Partial<CurriculumItem>) => void;
  onUpdateTotal: (value: string) => void;
  onOpenAISettings?: () => void;
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

const CurriculumTable: React.FC<CurriculumTableProps> = ({
  items,
  totalHours,
  showHoursColumn,
  workloadMode = 'auto',
  calculatedHours,
  onToggleWorkloadMode,
  onAdd,
  onRemove,
  onUpdate,
  onUpdateTotal,
  onOpenAISettings,
  onNotify,
}) => {
  const [subject, setSubject] = useState('');
  const [hours, setHours] = useState('');
  const [bulkText, setBulkText] = useState('');

  // Estados para Captura Inteligente com IA (OCR / Arquivos / Colagem)
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isLocalAISettingsOpen, setIsLocalAISettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para edição inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState('');
  const [editingHours, setEditingHours] = useState('');

  const handleOpenAISettingsModal = () => {
    if (onOpenAISettings) {
      onOpenAISettings();
    } else {
      setIsLocalAISettingsOpen(true);
    }
  };

  const handleAddSingle = () => {
    if (subject.trim()) {
      onAdd({
        id: generateId(),
        subject: subject.trim(),
        hours: hours ? parseInt(hours, 10) || 0 : 0,
      });
      setSubject('');
      setHours('');
    }
  };

  const handleBulkAdd = () => {
    if (!bulkText.trim()) return;

    const parsedItems = parseCurriculumBulkTextLocal(bulkText);
    if (parsedItems.length === 0) {
      onNotify?.('warning', 'Nenhuma Disciplina Detectada', 'Verifique o texto informado.');
      return;
    }

    parsedItems.forEach((item) => {
      onAdd({
        id: generateId(),
        subject: item.subject,
        hours: item.hours,
      });
    });

    setBulkText('');
    onNotify?.(
      'success',
      'Disciplinas Adicionadas',
      `${parsedItems.length} disciplina(s) adicionada(s) à grade curricular.`
    );
  };

  const handleOrganizeTextWithAI = async () => {
    if (!bulkText.trim()) return;

    setIsProcessingAI(true);
    setProcessingStatus('Analisando e organizando disciplinas e cargas horárias com IA...');

    try {
      const settings = loadAISettings();
      const result = await extractCurriculumFromTextWithAI(bulkText, settings);

      if (result.success && result.items.length > 0) {
        result.items.forEach((item) => {
          onAdd({
            id: generateId(),
            subject: item.subject,
            hours: item.hours,
          });
        });
        setBulkText('');
        const providerName =
          result.providerUsed === 'gemini'
            ? 'Google Gemini'
            : result.providerUsed === 'groq'
            ? 'Groq AI'
            : result.providerUsed === 'openrouter'
            ? 'OpenRouter'
            : 'Parser Inteligente';

        onNotify?.(
          'success',
          'Grade Extraída com IA',
          `${result.items.length} disciplina(s) estruturada(s) e inserida(s) via ${providerName}.`
        );
      } else {
        onNotify?.(
          'warning',
          'Falha na Extração',
          result.message || 'Não foi possível identificar disciplinas no texto.'
        );
      }
    } catch (err: unknown) {
      onNotify?.(
        'error',
        'Erro ao Processar com IA',
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setIsProcessingAI(false);
      setProcessingStatus('');
    }
  };

  const handleProcessImageWithAI = async (file: File, sourceLabel: string) => {
    const settings = loadAISettings();
    if (!hasAvailableAIKey(settings)) {
      handleOpenAISettingsModal();
      onNotify?.(
        'info',
        'Configure sua Chave de IA',
        'Adicione uma chave gratuita do Google Gemini, Groq ou OpenRouter para extrair grades por foto ou print.'
      );
      return;
    }

    setIsProcessingAI(true);
    setProcessingStatus('Lendo módulos e horas na imagem com IA Vision...');

    try {
      const { base64, mimeType } = await fileToBase64(file);
      const result = await extractCurriculumFromImage(base64, mimeType, settings);

      if (result.success && result.items.length > 0) {
        result.items.forEach((item) => {
          onAdd({
            id: generateId(),
            subject: item.subject,
            hours: item.hours,
          });
        });

        const providerName =
          result.providerUsed === 'gemini'
            ? 'Google Gemini Flash'
            : result.providerUsed === 'groq'
            ? 'Groq Vision'
            : result.providerUsed === 'openrouter'
            ? 'OpenRouter Vision'
            : 'IA Vision';

        onNotify?.(
          'success',
          'Grade Extraída por IA!',
          `${result.items.length} disciplina(s) capturada(s) de "${sourceLabel}" via ${providerName}.`
        );
      } else if (result.error === 'NO_KEY_CONFIGURED') {
        handleOpenAISettingsModal();
        onNotify?.('warning', 'Chave Ausente', result.message);
      } else {
        onNotify?.(
          'error',
          'Nenhuma Disciplina Identificada',
          result.message || 'Tente enviar uma foto ou print mais nítido da grade curricular.'
        );
      }
    } catch (err: unknown) {
      onNotify?.(
        'error',
        'Erro na Leitura Visual',
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setIsProcessingAI(false);
      setProcessingStatus('');
    }
  };

  const handleProcessTextFile = async (file: File) => {
    setIsProcessingAI(true);
    setProcessingStatus('Lendo arquivo de disciplinas...');

    try {
      const text = await file.text();
      const parsedItems = parseCurriculumBulkTextLocal(text);

      if (parsedItems.length > 0) {
        parsedItems.forEach((item) => {
          onAdd({
            id: generateId(),
            subject: item.subject,
            hours: item.hours,
          });
        });
        onNotify?.(
          'success',
          'Arquivo Importado',
          `${parsedItems.length} disciplina(s) carregada(s) do arquivo "${file.name}".`
        );
      } else {
        onNotify?.(
          'warning',
          'Arquivo Vazio ou Sem Formato Válido',
          'Não foram encontradas disciplinas válidas no arquivo selecionado.'
        );
      }
    } catch (err: unknown) {
      onNotify?.(
        'error',
        'Erro ao Ler Arquivo',
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setIsProcessingAI(false);
      setProcessingStatus('');
    }
  };

  const handleFileSelected = (file: File) => {
    const isImage =
      file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif)$/i.test(file.name);
    const isText =
      file.type.startsWith('text/') || /\.(csv|tsv|txt)$/i.test(file.name);

    if (isImage) {
      void handleProcessImageWithAI(file, file.name);
    } else if (isText) {
      void handleProcessTextFile(file);
    } else {
      onNotify?.(
        'warning',
        'Formato Não Suportado',
        'Envie uma foto/print (.png, .jpg, .webp) ou planilha/texto (.csv, .tsv, .txt).'
      );
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const clipboardItems = e.clipboardData?.items;
    if (!clipboardItems) return;

    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          void handleProcessImageWithAI(file, 'Print Colado (Ctrl+V)');
          return;
        }
      }
    }
  };

  const startEditing = (item: CurriculumItem) => {
    setEditingId(item.id);
    setEditingSubject(item.subject);
    setEditingHours(item.hours.toString());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingSubject('');
    setEditingHours('');
  };

  const saveEditing = () => {
    if (editingId && editingSubject.trim()) {
      onUpdate(editingId, {
        subject: editingSubject.trim(),
        hours: editingHours ? parseInt(editingHours, 10) || 0 : 0,
      });
      setEditingId(null);
    }
  };

  return (
    <div className="mt-2 animate-fadeIn" onPaste={handlePaste}>
      <div className="bg-blue-50/60 dark:bg-slate-900/70 p-4 rounded-xl border border-blue-100 dark:border-slate-800 mb-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase flex items-center gap-2">
            <i className="fa-solid fa-plus-circle text-blue-600 dark:text-blue-400"></i>
            <span>Adicionar Disciplina</span>
          </h3>
          <button
            type="button"
            onClick={handleOpenAISettingsModal}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100/70 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Configurar chaves gratuitas de IA (Google Gemini, Groq, OpenRouter)"
          >
            <i className="fa-solid fa-microchip"></i>
            <span>Configurar IAs</span>
          </button>
        </div>

        {/* 1. Adição Manual Rápida */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nome da Disciplina (Obrigatório)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSingle();
              }
            }}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
          />
          {showHoursColumn && (
            <input
              type="number"
              placeholder="Horas"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSingle();
                }
              }}
              className="w-24 px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            />
          )}
          <button
            type="button"
            onClick={handleAddSingle}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer"
          >
            Add
          </button>
        </div>

        {/* 2. Captura Inteligente com IA (OCR por Foto/Print, Ctrl+V ou Planilha) */}
        <div className="border-t border-blue-100 dark:border-slate-800 pt-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase flex items-center gap-1.5">
              <i className="fa-solid fa-wand-magic-sparkles text-indigo-500 dark:text-indigo-400"></i>
              <span>Captura Inteligente com IA (Foto, Print ou Planilha)</span>
            </label>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
              OCR & IA Ativo
            </span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelected(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-50/90 dark:bg-blue-950/50 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white/80 dark:bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.csv,.tsv,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelected(e.target.files[0]);
                }
                e.target.value = '';
              }}
              className="hidden"
            />

            {isProcessingAI ? (
              <div className="py-2 space-y-1.5">
                <i className="fa-solid fa-circle-notch fa-spin text-xl text-blue-600 dark:text-blue-400"></i>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {processingStatus || 'Extraindo disciplinas com IA...'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Roteamento inteligente Multi-IA (Gemini / Groq / OpenRouter)
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="w-8 h-8 mx-auto rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm">
                  <i className="fa-solid fa-camera-retro"></i>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Clique ou arraste print/foto da ementa, PDF ou planilha (.CSV/.TXT)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  💡 Você também pode dar <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px] font-mono border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">Ctrl+V</kbd> direto com um print do conteúdo programático!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Importação em Lote por Texto ou Ementa Colada */}
        <div className="border-t border-blue-100 dark:border-slate-800 pt-3">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 uppercase">
              Importação em Lote ou Ementa (Uma por linha ou texto livre)
            </label>
          </div>
          <textarea
            placeholder={`Ex: Introdução ao Design${showHoursColumn ? ', 10' : ''}\nTeoria das Cores${showHoursColumn ? ' - 20h' : ''}\nOu cole qualquer ementa/conteúdo e clique em "Extrair com IA"`}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full h-24 text-xs p-2.5 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleBulkAdd}
              disabled={!bulkText.trim() || isProcessingAI}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-file-import"></i>
              <span>Processar Lista de Disciplinas</span>
            </button>

            <button
              type="button"
              onClick={() => void handleOrganizeTextWithAI()}
              disabled={!bulkText.trim() || isProcessingAI}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Usa Inteligência Artificial para ler qualquer ementa ou texto livre colado acima e separar cada disciplina com sua carga horária"
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span>Extrair / Organizar Texto com IA</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-2 font-bold text-gray-600 dark:text-slate-300 uppercase text-xs">Disciplina</th>
              {showHoursColumn && <th className="px-4 py-2 font-bold text-gray-600 dark:text-slate-300 uppercase text-xs w-24 text-center">Horas</th>}
              <th className="px-4 py-2 font-bold text-gray-600 dark:text-slate-300 uppercase text-xs w-24 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.length === 0 ? (
              <tr>
                <td colSpan={showHoursColumn ? 3 : 2} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500 italic text-xs">
                  Nenhuma disciplina adicionada à grade.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-2 text-gray-800 dark:text-slate-200">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editingSubject}
                        onChange={(e) => setEditingSubject(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        autoFocus
                      />
                    ) : (
                      item.subject
                    )}
                  </td>
                  {showHoursColumn && (
                    <td className="px-4 py-2 text-gray-600 dark:text-slate-400 text-center font-mono">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editingHours}
                          onChange={(e) => setEditingHours(e.target.value)}
                          className="w-16 px-1 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm text-center focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      ) : (
                        item.hours > 0 ? `${item.hours}h` : '--'
                      )}
                    </td>
                  )}
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {editingId === item.id ? (
                        <>
                          <button
                            onClick={saveEditing}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Salvar"
                          >
                            <i className="fa-solid fa-check"></i>
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Cancelar"
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(item)}
                            className="text-blue-500 hover:text-blue-400 transition-colors"
                            title="Editar disciplina"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => onRemove(item.id)}
                            className="text-red-500 hover:text-red-400 transition-colors"
                            title="Remover disciplina"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-800">
            <tr>
              <td className="px-4 py-2 text-right uppercase text-xs text-gray-500 dark:text-slate-400">
                <div className="flex items-center justify-end gap-2">
                  {onToggleWorkloadMode && (
                    <button
                      type="button"
                      onClick={() => onToggleWorkloadMode(workloadMode === 'auto' ? 'manual' : 'auto')}
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold border transition-all ${
                        workloadMode === 'auto'
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}
                      title={workloadMode === 'auto' ? 'Modo Automático (soma da grade). Clique para alterar para manual.' : 'Modo Manual. Clique para alternar para automático.'}
                    >
                      {workloadMode === 'auto' ? 'Auto (Soma)' : 'Manual'}
                    </button>
                  )}
                  <span>Total no Certificado:</span>
                </div>
              </td>
              {showHoursColumn ? (
                <>
                  <td className="px-2 py-1 text-center">
                    <div className="flex items-center justify-center gap-1 group">
                      <input
                        type="text"
                        value={totalHours}
                        onChange={(e) => onUpdateTotal(e.target.value)}
                        className="w-16 px-1 py-1 border border-transparent hover:border-blue-200 focus:border-blue-500 bg-transparent text-center text-blue-900 dark:text-blue-300 focus:bg-white dark:focus:bg-slate-800 rounded outline-none transition-all"
                        title="Carga horária total no certificado"
                      />
                      <span className="text-blue-900 dark:text-blue-300 text-sm">h</span>
                      <i className="fa-solid fa-pen text-[10px] text-gray-300 dark:text-slate-600 opacity-0 group-hover:opacity-100"></i>
                    </div>
                  </td>
                  <td></td>
                </>
              ) : (
                <td className="px-2 py-1 text-center">
                  <div className="flex items-center justify-center gap-1 group">
                    <input
                      type="text"
                      value={totalHours}
                      onChange={(e) => onUpdateTotal(e.target.value)}
                      className="w-16 px-1 py-1 border border-transparent hover:border-blue-200 focus:border-blue-500 bg-transparent text-center text-blue-900 dark:text-blue-300 focus:bg-white dark:focus:bg-slate-800 rounded outline-none transition-all"
                      title="Carga horária total no certificado"
                    />
                    <span className="text-blue-900 dark:text-blue-300 text-sm">h</span>
                  </div>
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modal de Configurações de IA (Fallback Local) */}
      <AISettingsModal
        isOpen={isLocalAISettingsOpen}
        onClose={() => setIsLocalAISettingsOpen(false)}
        onNotify={onNotify}
      />
    </div>
  );
};

export default CurriculumTable;
