
import React, { useState } from 'react';
import { CurriculumItem } from '../types';

interface CurriculumTableProps {
  items: CurriculumItem[];
  totalHours: string;
  showHoursColumn: boolean;
  onAdd: (item: CurriculumItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updatedItem: Partial<CurriculumItem>) => void;
  onUpdateTotal: (value: string) => void;
}

const CurriculumTable: React.FC<CurriculumTableProps> = ({ 
  items, 
  totalHours, 
  showHoursColumn, 
  onAdd, 
  onRemove, 
  onUpdate,
  onUpdateTotal 
}) => {
  const [subject, setSubject] = useState('');
  const [hours, setHours] = useState('');
  const [bulkText, setBulkText] = useState('');
  
  // Estados para edição inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState('');
  const [editingHours, setEditingHours] = useState('');

  const handleAddSingle = () => {
    if (subject.trim()) {
      onAdd({
        id: Math.random().toString(36).substring(2, 9),
        subject: subject.trim(),
        hours: hours ? parseInt(hours) : 0,
      });
      setSubject('');
      setHours('');
    }
  };

  const handleBulkAdd = () => {
    if (!bulkText.trim()) return;
    
    const lines = bulkText.split('\n').filter(line => line.trim() !== '');
    lines.forEach(line => {
      const parts = line.split(/[;|,]/);
      const sub = parts[0]?.trim();
      const hr = parts[1]?.trim();
      
      if (sub) {
        onAdd({
          id: Math.random().toString(36).substring(2, 9),
          subject: sub,
          hours: hr ? parseInt(hr.replace(/\D/g, '')) || 0 : 0,
        });
      }
    });
    setBulkText('');
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
        hours: editingHours ? parseInt(editingHours) : 0
      });
      setEditingId(null);
    }
  };

  return (
    <div className="mt-4 animate-fadeIn">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
        <h3 className="text-sm font-bold text-blue-900 mb-3 uppercase flex items-center gap-2">
          <i className="fa-solid fa-plus-circle"></i> Adicionar Disciplina
        </h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Nome da Disciplina (Obrigatório)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {showHoursColumn && (
            <input
              type="number"
              placeholder="Horas"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          )}
          <button
            onClick={handleAddSingle}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>

        <div className="border-t border-blue-100 pt-3">
          <label className="block text-xs font-bold text-blue-800 mb-1 uppercase">Importação em Lote (Uma por linha)</label>
          <textarea
            placeholder={`Ex: Introdução ao Design${showHoursColumn ? ', 10' : ''}\nTeoria das Cores${showHoursColumn ? ', 20' : ''}`}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full h-24 text-xs p-2 border border-gray-300 rounded-md bg-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={handleBulkAdd}
            className="mt-2 text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            <i className="fa-solid fa-file-import"></i> Processar Lista de Disciplinas
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-2 font-bold text-gray-600 uppercase text-xs">Disciplina</th>
              {showHoursColumn && <th className="px-4 py-2 font-bold text-gray-600 uppercase text-xs w-24 text-center">Horas</th>}
              <th className="px-4 py-2 font-bold text-gray-600 uppercase text-xs w-24 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 ? (
              <tr>
                <td colSpan={showHoursColumn ? 3 : 2} className="px-4 py-8 text-center text-gray-400 italic text-xs">
                  Nenhuma disciplina adicionada à grade.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 text-gray-800">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editingSubject}
                        onChange={(e) => setEditingSubject(e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        autoFocus
                      />
                    ) : (
                      item.subject
                    )}
                  </td>
                  {showHoursColumn && (
                    <td className="px-4 py-2 text-gray-600 text-center font-mono">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editingHours}
                          onChange={(e) => setEditingHours(e.target.value)}
                          className="w-16 px-1 py-1 border rounded text-sm text-center focus:ring-1 focus:ring-blue-500 outline-none"
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
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                            title="Editar disciplina"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button 
                            onClick={() => onRemove(item.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
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
          <tfoot className="bg-gray-50 font-bold border-t">
            <tr>
              <td className="px-4 py-2 text-right uppercase text-xs text-gray-500">Total no Certificado:</td>
              {showHoursColumn ? (
                <td className="px-2 py-1 text-center">
                  <div className="flex items-center justify-center gap-1 group">
                    <input 
                      type="text" 
                      value={totalHours} 
                      onChange={(e) => onUpdateTotal(e.target.value)}
                      className="w-16 px-1 py-1 border border-transparent hover:border-blue-200 focus:border-blue-500 bg-transparent text-center text-blue-900 focus:bg-white rounded outline-none transition-all"
                      title="Clique para editar o total manualmente"
                    />
                    <span className="text-blue-900 text-sm">h</span>
                    <i className="fa-solid fa-pen text-[10px] text-gray-300 opacity-0 group-hover:opacity-100"></i>
                  </div>
                </td>
              ) : (
                <td className="px-2 py-1 text-center" colSpan={1}>
                   <div className="flex items-center justify-center gap-1 group">
                    <input 
                      type="text" 
                      value={totalHours} 
                      onChange={(e) => onUpdateTotal(e.target.value)}
                      className="w-16 px-1 py-1 border border-transparent hover:border-blue-200 focus:border-blue-500 bg-transparent text-center text-blue-900 focus:bg-white rounded outline-none transition-all"
                      title="Clique para editar o total manualmente"
                    />
                    <span className="text-blue-900 text-sm">h</span>
                  </div>
                </td>
              )}
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default CurriculumTable;
