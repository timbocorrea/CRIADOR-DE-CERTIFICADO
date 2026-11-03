import React, { useState } from 'react';
import { Student } from '../../types';
import { validateCPF, isDuplicateCPF } from '../../utils/security';
import { parseStudentsBulkInput } from '../../utils/importParser';

interface StudentsManagerProps {
  students: Student[];
  currentStudent: Student | null;
  currentStudentIdx: number;
  onSelectStudentIdx: (index: number) => void;
  onAddStudent: (name: string, cpf: string) => { success: boolean; error?: string };
  onBulkAddStudents: (students: Student[]) => void;
  onUpdateStudentDisplayName: (id: string, name: string) => void;
  onRemoveStudent: (id: string) => void;
}

export const StudentsManager: React.FC<StudentsManagerProps> = ({
  students,
  currentStudent,
  currentStudentIdx,
  onSelectStudentIdx,
  onAddStudent,
  onBulkAddStudents,
  onUpdateStudentDisplayName,
  onRemoveStudent,
}) => {
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCpf, setNewStudentCpf] = useState('');
  const [bulkInput, setBulkInput] = useState('');

  const handleAddSingle = () => {
    const trimmedName = newStudentName.trim();
    const trimmedCpf = newStudentCpf.trim();

    if (!trimmedName) {
      alert('O nome completo do aluno é obrigatório.');
      return;
    }
    // CPF é opcional
    if (trimmedCpf) {
      if (isDuplicateCPF(trimmedCpf, students)) {
        alert('Este CPF já está cadastrado para outro aluno nesta turma.');
        return;
      }
    }

    const res = onAddStudent(trimmedName, trimmedCpf);
    if (res.success) {
      setNewStudentName('');
      setNewStudentCpf('');
    }
  };

  const handleProcessBulk = () => {
    if (!bulkInput.trim()) return;
    const result = parseStudentsBulkInput(bulkInput, students);

    if (result.validStudents.length > 0) {
      onBulkAddStudents(result.validStudents);
      setBulkInput('');
    }

    if (result.errors.length > 0) {
      const summary = `${result.validStudents.length} aluno(s) válido(s) importado(s).\n\n${result.errors.length} registro(s) rejeitado(s):\n${result.errors.slice(0, 8).join('\n')}${result.errors.length > 8 ? `\n...e mais ${result.errors.length - 8} erro(s).` : ''}`;
      alert(summary);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
          <i className="fa-solid fa-users"></i> Alunos ({students.length})
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Nome Completo"
          value={newStudentName}
          onChange={(e) => setNewStudentName(e.target.value)}
          className="px-3 py-2 text-sm border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          type="text"
          placeholder="CPF (000.000.000-00)"
          value={newStudentCpf}
          onChange={(e) => setNewStudentCpf(e.target.value)}
          className="px-3 py-2 text-sm border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <button
        type="button"
        onClick={handleAddSingle}
        className="w-full bg-blue-600 text-white py-2 rounded text-sm font-bold hover:bg-blue-700 transition-colors"
      >
        Adicionar Aluno
      </button>

      {currentStudent && (
        <div className="bg-blue-50 p-3 rounded border border-blue-100 animate-fadeIn">
          <label className="block text-[10px] font-bold text-blue-800 mb-1 uppercase">
            Nome de Destaque (Manuscrito no Certificado)
          </label>
          <input
            type="text"
            value={currentStudent.displayName || ''}
            onChange={(e) => onUpdateStudentDisplayName(currentStudent.id, e.target.value)}
            className="w-full px-2 py-1.5 text-xs border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      )}

      {/* Importação Massiva com Suporte a Aspas e Delimitadores (CM-MED-003) */}
      <div className="bg-gray-50 p-3 rounded border border-dashed space-y-2">
        <label className="block text-xs font-bold text-gray-500 uppercase">
          Importação em Lote (Nome, CPF)
        </label>
        <textarea
          placeholder="João Silva, 123.456.789-00&#10;&quot;Souza, Maria&quot;, 987.654.321-11&#10;Carlos Pereira&#9;111.444.777-35"
          className="w-full h-24 text-xs p-2 border rounded font-mono bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
        />
        <button
          type="button"
          onClick={handleProcessBulk}
          className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
        >
          <i className="fa-solid fa-file-import"></i> Processar Lista
        </button>
      </div>

      <div className="max-h-40 overflow-y-auto border rounded divide-y bg-white">
        {students.length === 0 ? (
          <p className="p-4 text-center text-xs text-gray-400 italic">Nenhum aluno cadastrado.</p>
        ) : (
          students.map((s, idx) => (
            <div
              key={s.id}
              className={`flex items-center justify-between p-2 text-xs transition-colors ${
                currentStudentIdx === idx ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <div className="cursor-pointer flex-1 font-medium truncate pr-2" onClick={() => onSelectStudentIdx(idx)}>
                <span className="font-bold text-blue-900">{idx + 1}.</span> {s.name}
              </div>
              <button
                type="button"
                onClick={() => onRemoveStudent(s.id)}
                className="text-red-500 px-2 py-1 hover:text-red-700 transition-colors"
                title="Remover aluno"
              >
                <i className="fa-solid fa-trash-can"></i>
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
