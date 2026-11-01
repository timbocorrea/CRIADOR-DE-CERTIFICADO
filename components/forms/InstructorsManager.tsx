import React, { useState } from 'react';
import { Instructor } from '../../types';
import { MAX_INSTRUCTORS } from '../../hooks/useCertificateData';

interface InstructorsManagerProps {
  instructors: Instructor[];
  onAddInstructor: (name: string, competencies: string) => { success: boolean; error?: string };
  onRemoveInstructor: (id: string) => void;
}

export const InstructorsManager: React.FC<InstructorsManagerProps> = ({
  instructors,
  onAddInstructor,
  onRemoveInstructor,
}) => {
  const [newInstructorName, setNewInstructorName] = useState('');
  const [newInstructorCompetencies, setNewInstructorCompetencies] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleAdd = () => {
    setErrorNotice(null);
    if (!newInstructorName.trim()) {
      setErrorNotice('Informe o nome do instrutor.');
      return;
    }

    const result = onAddInstructor(newInstructorName, newInstructorCompetencies);
    if (result.success) {
      setNewInstructorName('');
      setNewInstructorCompetencies('');
    } else if (result.error) {
      setErrorNotice(result.error);
    }
  };

  return (
    <section className="pt-4 border-t space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
          <i className="fa-solid fa-chalkboard-user"></i> Instrutores ({instructors.length}/{MAX_INSTRUCTORS})
        </h2>
        <span className="text-[10px] text-gray-400 font-semibold uppercase">Até 4 assinaturas</span>
      </div>

      {errorNotice && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 animate-fadeIn">
          {errorNotice}
        </div>
      )}

      {instructors.length < MAX_INSTRUCTORS ? (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Nome do Instrutor"
            value={newInstructorName}
            onChange={(e) => setNewInstructorName(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="text"
            placeholder="Especialidades / Competências"
            value={newInstructorCompetencies}
            onChange={(e) => setNewInstructorCompetencies(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="w-full bg-blue-600 text-white py-2 rounded text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            Adicionar Instrutor
          </button>
        </div>
      ) : (
        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          <p className="font-bold">Capacidade máxima de instrutores atingida ({MAX_INSTRUCTORS}).</p>
          <p className="text-[11px] text-gray-600 mt-0.5">Remova um instrutor abaixo para adicionar outro.</p>
        </div>
      )}

      <div className="max-h-36 overflow-y-auto border rounded divide-y bg-white">
        {instructors.length === 0 ? (
          <p className="p-3 text-center text-xs text-gray-400 italic">Nenhum instrutor cadastrado.</p>
        ) : (
          instructors.map((inst, idx) => (
            <div key={inst.id} className="flex items-center justify-between p-2 text-xs hover:bg-gray-50 transition-colors">
              <div className="flex-1 pr-2">
                <p className="font-bold text-gray-800">
                  <span className="text-blue-600 mr-1">#{idx + 1}</span> {inst.name}
                </p>
                {inst.competencies && <p className="text-gray-500 truncate text-[11px]">{inst.competencies}</p>}
              </div>
              <button
                type="button"
                onClick={() => onRemoveInstructor(inst.id)}
                className="text-red-500 px-2 py-1 hover:text-red-700 transition-colors"
                title="Remover instrutor"
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
