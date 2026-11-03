import React, { useState, useEffect, useMemo } from 'react';
import { AppDialog, AppButton, AppBadge, AppInput } from '../ui';
import { Student, ExtractedStudentCandidate } from '../../types';
import { validateCPF, formatCPF, cleanCPF, isDuplicateCPF } from '../../utils/security';
import { generateId } from '../../utils/helpers';

interface EditableCandidate {
  tempId: string;
  name: string;
  cpf: string;
  selected: boolean;
}

interface ImportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: ExtractedStudentCandidate[];
  sourceDescription?: string;
  existingStudents: Student[];
  onConfirm: (students: Student[]) => void;
}

export const ImportReviewModal: React.FC<ImportReviewModalProps> = ({
  isOpen,
  onClose,
  candidates,
  sourceDescription = 'Extração Inteligente',
  existingStudents,
  onConfirm,
}) => {
  const [items, setItems] = useState<EditableCandidate[]>([]);

  // Inicializa a lista editável sempre que o modal abrir ou novos candidatos chegarem
  useEffect(() => {
    if (isOpen && candidates && candidates.length > 0) {
      setItems(
        candidates.map((c) => ({
          tempId: generateId(),
          name: c.name || '',
          cpf: c.cpf ? formatCPF(c.cpf) : '',
          selected: true,
        }))
      );
    } else if (isOpen && candidates.length === 0) {
      setItems([]);
    }
  }, [isOpen, candidates]);

  // Atualiza um campo de um candidato específico
  const handleUpdateField = (tempId: string, field: 'name' | 'cpf', value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.tempId !== tempId) return item;
        return {
          ...item,
          [field]: field === 'cpf' ? formatCPF(value) : value,
        };
      })
    );
  };

  // Alterna seleção de um candidato
  const handleToggleSelect = (tempId: string) => {
    setItems((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, selected: !item.selected } : item))
    );
  };

  // Remove um candidato da lista
  const handleRemove = (tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  // Adiciona nova linha em branco para inserção manual
  const handleAddRow = () => {
    const newItem: EditableCandidate = {
      tempId: generateId(),
      name: '',
      cpf: '',
      selected: true,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Seleciona ou desmarca todos
  const handleToggleAll = (selectAll: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: selectAll })));
  };

  // Remove todos os inválidos da lista
  const handleRemoveInvalid = () => {
    setItems((prev) =>
      prev.filter((item) => {
        const clean = cleanCPF(item.cpf);
        const hasValidCpf = clean.length === 11 && validateCPF(clean);
        const hasName = item.name.trim().length > 0;
        return hasValidCpf && hasName;
      })
    );
  };

  // Análise detalhada de cada item com detecção de duplicatas cruzadas
  const analyzedItems = useMemo(() => {
    const cpfCounts: { [clean: string]: number } = {};
    items.forEach((item) => {
      const clean = cleanCPF(item.cpf);
      if (clean) {
        cpfCounts[clean] = (cpfCounts[clean] || 0) + 1;
      }
    });

    return items.map((item) => {
      const trimmedName = item.name.trim();
      const clean = cleanCPF(item.cpf);
      const isClean11 = clean.length === 11;
      const isValidCpf = isClean11 && validateCPF(clean);
      const isAlreadyInEnrolled = isDuplicateCPF(item.cpf, existingStudents);
      const isDuplicateInBatch = clean && cpfCounts[clean] > 1;

      let status: 'valid' | 'duplicate' | 'invalid_cpf' | 'incomplete';
      let statusLabel: string;
      let statusVariant: 'success' | 'warning' | 'danger' | 'neutral';

      if (!trimmedName) {
        status = 'incomplete';
        statusLabel = 'Sem Nome';
        statusVariant = 'danger';
      } else if (!clean) {
        // Aluno com nome preenchido e sem CPF (CPF é opcional)
        status = 'valid';
        statusLabel = 'Sem CPF';
        statusVariant = 'neutral';
      } else if (!isValidCpf) {
        status = 'invalid_cpf';
        statusLabel = 'CPF Inválido';
        statusVariant = 'danger';
      } else if (isAlreadyInEnrolled) {
        status = 'duplicate';
        statusLabel = 'Já na Turma';
        statusVariant = 'warning';
      } else if (isDuplicateInBatch) {
        status = 'duplicate';
        statusLabel = 'Duplicado no Lote';
        statusVariant = 'warning';
      } else {
        status = 'valid';
        statusLabel = 'Válido';
        statusVariant = 'success';
      }

      return {
        ...item,
        status,
        statusLabel,
        statusVariant,
        canImport: status === 'valid' || status === 'duplicate', // permite duplicado se operador insistir, mas avisa
      };
    });
  }, [items, existingStudents]);

  // Contadores para o resumo do cabeçalho e botão
  const totalCount = analyzedItems.length;
  const validCount = analyzedItems.filter((i) => i.status === 'valid').length;
  const selectedCount = analyzedItems.filter((i) => i.selected).length;
  const readyToImportCount = analyzedItems.filter((i) => i.selected && i.name.trim() && (!cleanCPF(i.cpf) || validateCPF(i.cpf))).length;

  const handleConfirm = () => {
    const validStudentsToInsert: Student[] = analyzedItems
      .filter((i) => i.selected && i.name.trim() && (!cleanCPF(i.cpf) || validateCPF(i.cpf)))
      .map((i) => ({
        id: generateId(),
        name: i.name.trim(),
        cpf: cleanCPF(i.cpf) ? formatCPF(i.cpf) : '',
        displayName: i.name.trim(),
      }));

    if (validStudentsToInsert.length > 0) {
      onConfirm(validStudentsToInsert);
      onClose();
    }
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Revisão de Importação de Participantes"
      description="Revise, edite ou complemente os nomes e CPFs detectados antes de adicioná-los à turma."
      icon="fa-solid fa-user-check"
      maxWidth="2xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Total: <strong>{totalCount}</strong> | Válidos: <strong className="text-emerald-600 dark:text-emerald-400">{validCount}</strong> | Prontos: <strong className="text-blue-600 dark:text-blue-400">{readyToImportCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <AppButton variant="secondary" size="sm" onClick={onClose}>
              Cancelar
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              icon="fa-solid fa-check"
              disabled={readyToImportCount === 0}
              onClick={handleConfirm}
            >
              Inserir {readyToImportCount} Participante(s)
            </AppButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Banner do Provedor / Origem */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-sparkles text-blue-600 dark:text-blue-400 text-sm"></i>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Origem da Extração:
            </span>
            <AppBadge variant="primary" size="sm">
              {sourceDescription}
            </AppBadge>
          </div>

          {/* Ações em lote da tabela */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => handleToggleAll(true)}
              className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Marcar Todos
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              type="button"
              onClick={() => handleToggleAll(false)}
              className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Desmarcar
            </button>
            {analyzedItems.some((i) => i.status !== 'valid') && (
              <>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  type="button"
                  onClick={handleRemoveInvalid}
                  className="px-2 py-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 font-medium transition-colors"
                  title="Remove linhas com dados incompletos ou CPF inválido"
                >
                  Limpar Inválidos
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabela de Candidatos */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm max-h-[380px] overflow-y-auto">
          {analyzedItems.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <i className="fa-solid fa-inbox text-3xl text-slate-300 dark:text-slate-600"></i>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Nenhum participante na lista de revisão
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Adicione linhas manualmente ou tente processar outro arquivo/imagem.
              </p>
              <div className="pt-2">
                <AppButton variant="secondary" size="sm" icon="fa-solid fa-plus" onClick={handleAddRow}>
                  Adicionar Linha
                </AppButton>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedCount === totalCount && totalCount > 0}
                      onChange={(e) => handleToggleAll(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">
                    Nome Completo
                  </th>
                  <th className="p-2.5 w-44 font-semibold text-slate-700 dark:text-slate-300">
                    CPF
                  </th>
                  <th className="p-2.5 w-32 font-semibold text-slate-700 dark:text-slate-300 text-center">
                    Status
                  </th>
                  <th className="p-2.5 w-12 text-center font-semibold text-slate-700 dark:text-slate-300">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {analyzedItems.map((item, idx) => (
                  <tr
                    key={item.tempId}
                    className={`transition-colors ${
                      item.selected
                        ? 'bg-transparent hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                        : 'bg-slate-50/40 dark:bg-slate-900/30 opacity-60'
                    }`}
                  >
                    {/* Checkbox de Inclusão */}
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleSelect(item.tempId)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    {/* Campo Nome */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateField(item.tempId, 'name', e.target.value)}
                        placeholder="Nome Completo do Aluno"
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Campo CPF */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.cpf}
                        onChange={(e) => handleUpdateField(item.tempId, 'cpf', e.target.value)}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className="w-full px-2 py-1 font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Status Badge */}
                    <td className="p-2 text-center">
                      <AppBadge variant={item.statusVariant} size="sm">
                        {item.statusLabel}
                      </AppBadge>
                    </td>

                    {/* Botão Remover Linha */}
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemove(item.tempId)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Remover linha"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Rodapé Interno com Adição Manual */}
        <div className="flex items-center justify-between pt-1">
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            icon="fa-solid fa-plus"
            onClick={handleAddRow}
          >
            Adicionar Mais Uma Linha
          </AppButton>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Somente participantes com nome preenchido e CPF válido serão importados.
          </p>
        </div>
      </div>
    </AppDialog>
  );
};

