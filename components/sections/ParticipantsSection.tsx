import React, { useState, useMemo, useRef } from 'react';
import { Student, ExtractedStudentCandidate } from '../../types';
import { validateCPF, isDuplicateCPF } from '../../utils/security';
import { parseStudentsBulkInput, splitDelimitedLine } from '../../utils/importParser';
import { processUploadedFile, fileToBase64 } from '../../utils/fileParser';
import { extractStudentsFromImage, loadAISettings, hasAvailableAIKey } from '../../services/unifiedAIService';
import { AISettingsModal } from '../ai/AISettingsModal';
import { ImportReviewModal } from '../forms/ImportReviewModal';
import {
  AppCard,
  AppInput,
  AppButton,
  AppBadge,
  AppEmptyState,
} from '../ui';

interface ParticipantsSectionProps {
  students: Student[];
  currentStudent: Student | null;
  currentStudentIdx: number;
  onSelectStudentIdx: (index: number) => void;
  onAddStudent: (name: string, cpf: string) => { success: boolean; error?: string };
  onBulkAddStudents: (students: Student[]) => void;
  onUpdateStudentDisplayName: (id: string, name: string) => void;
  onRemoveStudent: (id: string) => void;
  onOpenAISettings?: () => void;
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const ParticipantsSection: React.FC<ParticipantsSectionProps> = ({
  students,
  currentStudent,
  currentStudentIdx,
  onSelectStudentIdx,
  onAddStudent,
  onBulkAddStudents,
  onUpdateStudentDisplayName,
  onRemoveStudent,
  onOpenAISettings,
  onNotify,
}) => {
  // Estados para cadastro individual
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCpf, setNewStudentCpf] = useState('');
  const [individualError, setIndividualError] = useState<string | null>(null);

  // Estados para importação em lote e área de texto
  const [bulkInput, setBulkInput] = useState('');
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);

  // Estados para Drag & Drop e Processamento Inteligente
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados dos Modais
  const [isLocalAISettingsOpen, setIsLocalAISettingsOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewCandidates, setReviewCandidates] = useState<ExtractedStudentCandidate[]>([]);
  const [reviewSource, setReviewSource] = useState<string>('');

  // Estado para busca/filtro
  const [searchTerm, setSearchTerm] = useState('');

  // Abre o modal de configurações de IA (global ou local)
  const handleOpenAISettingsModal = () => {
    if (onOpenAISettings) {
      onOpenAISettings();
    } else {
      setIsLocalAISettingsOpen(true);
    }
  };

  // Validação informativa do CPF digitado
  const cpfValidation = useMemo(() => {
    const trimmed = newStudentCpf.trim();
    if (!trimmed) return { isValid: true, message: 'CPF opcional' };
    const isValid = validateCPF(trimmed);
    const isDup = isDuplicateCPF(trimmed, students);
    if (isDup) return { isValid: false, message: 'CPF já cadastrado nesta turma' };
    if (!isValid) return { isValid: true, message: 'CPF informado (formato livre)' };
    return { isValid: true, message: 'CPF válido' };
  }, [newStudentCpf, students]);

  // Lista filtrada preservando os índices originais da turma
  const filteredStudentsWithIndex = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return students
      .map((student, originalIdx) => ({ student, originalIdx }))
      .filter(({ student }) => {
        if (!term) return true;
        const nameMatch = (student.name || '').toLowerCase().includes(term);
        const cpfMatch = (student.cpf || '').replace(/\D/g, '').includes(term.replace(/\D/g, ''));
        const displayMatch = (student.displayName || '').toLowerCase().includes(term);
        return nameMatch || cpfMatch || displayMatch;
      });
  }, [students, searchTerm]);

  // Handler de cadastro individual
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    setIndividualError(null);

    const trimmedName = newStudentName.trim();
    const trimmedCpf = newStudentCpf.trim();

    if (!trimmedName) {
      setIndividualError('O nome completo do aluno é obrigatório.');
      return;
    }
    // CPF é opcional
    if (trimmedCpf) {
      if (isDuplicateCPF(trimmedCpf, students)) {
        setIndividualError('Este CPF já foi cadastrado para outro aluno nesta turma.');
        return;
      }
    }

    const res = onAddStudent(trimmedName, trimmedCpf);
    if (res.success) {
      setNewStudentName('');
      setNewStudentCpf('');
      if (onNotify) onNotify('success', 'Participante Adicionado', `${trimmedName} cadastrado com sucesso.`);
    } else {
      setIndividualError(res.error || 'Erro ao adicionar aluno.');
    }
  };

  // Handler de importação em lote direta (RFC 4180)
  const handleProcessBulk = () => {
    if (!bulkInput.trim()) return;
    const result = parseStudentsBulkInput(bulkInput, students);

    if (result.validStudents.length > 0) {
      onBulkAddStudents(result.validStudents);
      setBulkInput('');
      setBulkErrors([]);
      if (onNotify) {
        onNotify(
          'success',
          'Importação Concluída',
          `${result.validStudents.length} participante(s) importado(s) com sucesso.`
        );
      }
    }

    if (result.errors.length > 0) {
      setBulkErrors(result.errors);
      if (onNotify) {
        onNotify(
          'warning',
          'Registros Rejeitados',
          `${result.errors.length} linha(s) continham erros de formatação ou CPF inválido.`
        );
      }
    }
  };

  // Abre a tabela de revisão a partir do texto digitado/colado
  const handleOpenReviewFromText = () => {
    if (!bulkInput.trim()) return;
    const lines = bulkInput.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const candidates: ExtractedStudentCandidate[] = [];

    lines.forEach((line) => {
      const parts = splitDelimitedLine(line);
      const firstCol = parts[0]?.trim().toLowerCase();
      const secondCol = parts.length > 1 ? parts[1]?.trim().toLowerCase() : '';
      const isHeader =
        (firstCol === 'nome' || firstCol === 'aluno' || firstCol === 'participante' || firstCol === 'nome do aluno') &&
        (!secondCol || secondCol === 'cpf' || secondCol === 'documento' || secondCol === 'doc');

      if (isHeader) return;

      let name = '';
      let cpf = '';
      if (parts.length === 1) {
        name = parts[0];
      } else if (parts.length === 2) {
        name = parts[0];
        cpf = parts[1];
      } else {
        name = parts.slice(0, parts.length - 1).join(', ');
        cpf = parts[parts.length - 1];
      }

      if (name.trim()) {
        candidates.push({
          name: name.trim(),
          cpf: cpf.trim(),
          confidence: 'high',
        });
      }
    });

    if (candidates.length > 0) {
      setReviewCandidates(candidates);
      setReviewSource('Texto / Planilha Colada');
      setIsReviewOpen(true);
    } else {
      if (onNotify) {
        onNotify('warning', 'Nenhum Aluno Válido', 'Não foi possível encontrar linhas no texto colado.');
      }
    }
  };

  // Processamento de imagens com IA Vision e Fallback Multi-Provedor
  const handleProcessImage = async (file: File, sourceLabel: string) => {
    const settings = loadAISettings();
    const hasAnyKey = hasAvailableAIKey(settings);

    if (!hasAnyKey) {
      if (onNotify) {
        onNotify(
          'warning',
          'Chave de IA Necessária',
          'Configure uma chave gratuita do Google Gemini, Groq ou OpenRouter para realizar leitura visual de imagens.'
        );
      }
      handleOpenAISettingsModal();
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Lendo e convertendo imagem...');

    try {
      const { base64, mimeType } = await fileToBase64(file);
      setProcessingStatus('Analisando participantes com IA...');

      const result = await extractStudentsFromImage(base64, mimeType, settings);

      if (result.success && result.students.length > 0) {
        const providerName =
          result.providerUsed === 'gemini'
            ? 'Google Gemini Flash'
            : result.providerUsed === 'groq'
            ? 'Groq Cloud (Llama 3.2 Vision)'
            : result.providerUsed === 'openrouter'
            ? 'OpenRouter (Qwen 2.5 VL)'
            : 'IA Vision';

        setReviewCandidates(result.students);
        setReviewSource(`${sourceLabel} • ${providerName}`);
        setIsReviewOpen(true);

        if (onNotify) {
          onNotify(
            'success',
            'Participantes Extraídos',
            `${result.students.length} participante(s) detectado(s) via ${providerName}.`
          );
        }
      } else if (result.error === 'NO_KEY_CONFIGURED') {
        handleOpenAISettingsModal();
        if (onNotify) onNotify('warning', 'Chave Ausente', result.message);
      } else {
        if (onNotify) {
          onNotify(
            'error',
            'Falha na Extração Visual',
            result.message || 'Nenhum nome/CPF foi identificado na imagem. Tente uma foto com maior resolução ou nitidez.'
          );
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (onNotify) {
        onNotify('error', 'Erro no Processamento', `Falha ao processar imagem: ${msg}`);
      }
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Processamento de arquivos tabulares locais (.csv, .tsv, .txt)
  const handleProcessTextFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingStatus('Lendo e analisando arquivo...');

    try {
      const res = await processUploadedFile(file, students);
      if (res.kind === 'text' && res.parseResult) {
        const candidates: ExtractedStudentCandidate[] = res.parseResult.validStudents.map((s) => ({
          name: s.name,
          cpf: s.cpf,
          confidence: 'high',
        }));

        if (candidates.length > 0) {
          setReviewCandidates(candidates);
          setReviewSource(`Arquivo: ${file.name}`);
          setIsReviewOpen(true);
          if (onNotify) {
            onNotify(
              'success',
              'Arquivo Lido com Sucesso',
              `${candidates.length} participante(s) identificado(s) na planilha/texto.`
            );
          }
        } else {
          if (onNotify) {
            onNotify(
              'warning',
              'Nenhum Registro Válido',
              'O arquivo não continha linhas válidas no formato esperado (Nome, CPF).'
            );
          }
        }
      } else if (res.error) {
        if (onNotify) onNotify('error', 'Formato Não Suportado', res.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (onNotify) onNotify('error', 'Erro na Leitura', msg);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Roteador de arquivos (Imagem vs Documento)
  const handleFileSelected = (file: File) => {
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif)$/i.test(file.name);
    const isText = file.type.startsWith('text/') || /\.(csv|tsv|txt)$/i.test(file.name);

    if (isImage) {
      handleProcessImage(file, file.name);
    } else if (isText) {
      handleProcessTextFile(file);
    } else {
      if (onNotify) {
        onNotify(
          'warning',
          'Formato Não Suportado',
          'Envie uma imagem (.png, .jpg), foto ou arquivo (.csv, .tsv, .txt).'
        );
      }
    }
  };

  // Captura de imagem colada via Ctrl+V da Área de Transferência
  const handlePaste = (e: React.ClipboardEvent) => {
    const clipboardItems = e.clipboardData?.items;
    if (!clipboardItems) return;

    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleProcessImage(file, 'Print Colado (Ctrl+V)');
          return;
        }
      }
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn" onPaste={handlePaste}>
      {/* 1. Formulário de Cadastro Individual */}
      <AppCard
        title="Novo Participante"
        description="Cadastro manual de estudante para a turma"
        icon="fa-solid fa-user-plus"
        defaultExpanded={true}
      >
        <form onSubmit={handleAddSingle} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AppInput
              id="studentName"
              label="Nome Completo"
              placeholder="Ex: Carlos Eduardo de Oliveira"
              value={newStudentName}
              onChange={(e) => {
                setNewStudentName(e.target.value);
                if (individualError) setIndividualError(null);
              }}
              required
              icon="fa-solid fa-user"
            />

            <div>
              <AppInput
                id="studentCpf"
                label="CPF do Aluno (Opcional)"
                placeholder="000.000.000-00 (Opcional)"
                value={newStudentCpf}
                onChange={(e) => {
                  setNewStudentCpf(e.target.value);
                  if (individualError) setIndividualError(null);
                }}
                icon="fa-solid fa-id-card"
                rightElement={
                  newStudentCpf.trim().length > 0 ? (
                    <AppBadge
                      variant={cpfValidation.isValid ? 'success' : 'danger'}
                      size="sm"
                    >
                      {cpfValidation.isValid ? 'Válido' : 'Inválido'}
                    </AppBadge>
                  ) : null
                }
              />
            </div>
          </div>

          {individualError && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-fadeIn">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{individualError}</span>
            </p>
          )}

          <div className="flex justify-end pt-1">
            <AppButton
              type="submit"
              variant="primary"
              size="sm"
              icon="fa-solid fa-plus"
            >
              Adicionar Participante
            </AppButton>
          </div>
        </form>
      </AppCard>

      {/* 2. Importação Massiva / Em Lote Inteligente */}
      <AppCard
        title="Importação em Lote & Conversor Inteligente"
        description="Importe por arrastar arquivos, fotos/prints de WhatsApp ou planilhas"
        icon="fa-solid fa-file-import"
        isCollapsible={true}
        defaultExpanded={true}
        action={
          <AppButton
            type="button"
            variant="ghost"
            size="sm"
            icon="fa-solid fa-microchip"
            onClick={handleOpenAISettingsModal}
            className="text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            title="Configurar chaves gratuitas de IA (Gemini, Groq, OpenRouter)"
          >
            Configurar IAs
          </AppButton>
        }
      >
        <div className="space-y-4">
          {/* Zona Drag & Drop e Ctrl+V */}
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
            className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer relative ${
              isDragging
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/60 dark:bg-slate-900/40'
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

            {isProcessing ? (
              <div className="py-4 space-y-2">
                <i className="fa-solid fa-circle-notch fa-spin text-2xl text-blue-600 dark:text-blue-400"></i>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {processingStatus || 'Processando arquivo...'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Usando roteamento inteligente com fallback automático.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg shadow-sm">
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Arraste imagens ou arquivos aqui, ou clique para selecionar
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    💡 Dica: Você também pode tirar um print do WhatsApp e pressionar <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px] font-mono border border-slate-300 dark:border-slate-700">Ctrl+V</kbd> nesta tela.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  <AppBadge variant="neutral" size="sm">
                    🖼️ Fotos / Prints (WhatsApp)
                  </AppBadge>
                  <AppBadge variant="neutral" size="sm">
                    📊 Planilhas CSV / TSV
                  </AppBadge>
                  <AppBadge variant="neutral" size="sm">
                    📄 Documentos TXT
                  </AppBadge>
                </div>
              </div>
            )}
          </div>

          {/* Área de Colagem Manual / Alternativa */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold flex items-center gap-1.5">
                <i className="fa-solid fa-paste text-slate-400"></i>
                Ou cole a lista de participantes manualmente:
              </span>
              <span className="text-[11px] text-slate-400">
                (Apenas nomes ou Nome, CPF por linha)
              </span>
            </div>

            <textarea
              rows={3}
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="Exemplo:&#10;Alexandre Correa dos Santos&#10;Janaina da Silva, 123.456.789-00&#10;Ana Cristina Lima"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-3 font-mono text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
            />

            {bulkErrors.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-800 dark:text-red-300 space-y-1 max-h-32 overflow-y-auto">
                <p className="font-bold flex items-center gap-1.5">
                  <i className="fa-solid fa-triangle-exclamation text-red-600 dark:text-red-400"></i>
                  {bulkErrors.length} erro(s) encontrados na importação:
                </p>
                {bulkErrors.slice(0, 5).map((err, i) => (
                  <p key={i} className="text-[11px] font-mono pl-4">• {err}</p>
                ))}
                {bulkErrors.length > 5 && (
                  <p className="text-[10px] text-red-600 dark:text-red-400 italic pl-4">...e mais {bulkErrors.length - 5} erros.</p>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 self-start sm:self-auto">
                {bulkInput.trim() ? `${bulkInput.trim().split('\n').length} linha(s) digitada(s)` : ''}
              </span>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <AppButton
                  type="button"
                  size="sm"
                  variant="outline"
                  icon="fa-solid fa-table-list"
                  onClick={handleOpenReviewFromText}
                  disabled={!bulkInput.trim()}
                  title="Abrir tabela de revisão para editar antes de confirmar"
                >
                  Revisar na Tabela
                </AppButton>
                <AppButton
                  type="button"
                  size="sm"
                  variant="primary"
                  icon="fa-solid fa-arrow-down-to-bracket"
                  onClick={handleProcessBulk}
                  disabled={!bulkInput.trim()}
                  title="Importar diretamente as linhas válidas"
                >
                  Processar e Inserir
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      {/* 3. Lista e Busca de Participantes Cadastrados */}
      <AppCard
        title="Turma de Participantes"
        description="Lista de estudantes para os quais serão emitidos os certificados"
        icon="fa-solid fa-users"
        badge={
          <AppBadge variant={students.length > 0 ? 'default' : 'neutral'} size="sm">
            {students.length} cadastrado(s)
          </AppBadge>
        }
        defaultExpanded={true}
      >
        <div className="space-y-3">
          {/* Campo de Busca Rápida */}
          {students.length > 0 && (
            <div className="relative">
              <AppInput
                placeholder="Buscar por nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon="fa-solid fa-magnifying-glass"
                rightElement={
                  searchTerm ? (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="text-slate-400 hover:text-slate-600 text-xs p-1"
                      aria-label="Limpar busca"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  ) : null
                }
              />
            </div>
          )}

          {/* Nome de Destaque / Manuscrito do Aluno Atualmente Selecionado */}
          {currentStudent && (
            <div className="p-3 bg-blue-50/70 dark:bg-slate-900/60 border border-blue-200/70 dark:border-blue-950 rounded-xl space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="currentStudentDisplayName"
                  className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-pen-fancy text-blue-600 dark:text-blue-400"></i>
                  Nome de Destaque na Frente ({currentStudent.name})
                </label>
                <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded">
                  Editando Ativo
                </span>
              </div>
              <AppInput
                id="currentStudentDisplayName"
                value={currentStudent.displayName || ''}
                onChange={(e) => onUpdateStudentDisplayName(currentStudent.id, e.target.value)}
                placeholder="Nome formatado para a caligrafia de destaque"
                className="text-xs"
              />
              <p className="text-[10px] text-blue-700 dark:text-blue-400">
                Se preenchido, substitui o nome padrão na tipografia cursiva do anverso.
              </p>
            </div>
          )}

          {/* Lista de Alunos */}
          {students.length === 0 ? (
            <AppEmptyState
              icon="fa-solid fa-user-group"
              title="Nenhum aluno cadastrado"
              description="Cadastre os participantes acima ou importe uma lista completa."
            />
          ) : filteredStudentsWithIndex.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
              Nenhum participante encontrado para &quot;{searchTerm}&quot;.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
              {filteredStudentsWithIndex.map(({ student, originalIdx }) => {
                const isSelected = currentStudentIdx === originalIdx;
                return (
                  <div
                    key={student.id}
                    onClick={() => onSelectStudentIdx(originalIdx)}
                    className={`flex items-center justify-between p-3 text-xs transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600 pl-2.5'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {originalIdx + 1}. {student.name}
                        </span>
                        {isSelected && (
                          <AppBadge variant="info" size="sm">
                            Na Prévia
                          </AppBadge>
                        )}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] font-mono mt-0.5">
                        CPF: {student.cpf}
                        {student.displayName && (
                          <span className="ml-2 text-blue-600 dark:text-blue-400 italic">
                            ({student.displayName})
                          </span>
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Deseja realmente remover o aluno ${student.name}?`)) {
                          onRemoveStudent(student.id);
                          if (onNotify) onNotify('info', 'Participante Removido', `${student.name} foi removido da turma.`);
                        }
                      }}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center justify-center transition-colors shrink-0"
                      title={`Remover ${student.name}`}
                      aria-label={`Remover ${student.name}`}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppCard>

      {/* Modal de Revisão de Candidatos Extraídos */}
      <ImportReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        candidates={reviewCandidates}
        sourceDescription={reviewSource}
        existingStudents={students}
        onConfirm={(newStudents) => {
          onBulkAddStudents(newStudents);
          if (onNotify) {
            onNotify(
              'success',
              'Participantes Importados',
              `${newStudents.length} participante(s) adicionado(s) com sucesso à turma.`
            );
          }
        }}
      />

      {/* Modal de Configurações de IA (Fallback Local se não aberto via Header) */}
      <AISettingsModal
        isOpen={isLocalAISettingsOpen}
        onClose={() => setIsLocalAISettingsOpen(false)}
        onNotify={onNotify}
      />
    </div>
  );
};
