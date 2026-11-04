import React, { useEffect, useState, useRef } from 'react';
import CertificatePreview from '../CertificatePreview';
import { CertificateData, Student } from '../../types';
import { AppButton } from '../ui';

interface FinalPreviewModalProps {
  isOpen: boolean;
  data: CertificateData;
  currentStudent: Student | null;
  onClose: () => void;
  onOpenExportModal: () => void;
}

export const FinalPreviewModal: React.FC<FinalPreviewModalProps> = ({
  isOpen,
  data,
  currentStudent,
  onClose,
  onOpenExportModal,
}) => {
  const [modalScale, setModalScale] = useState(0.5);
  const closedByPopStateRef = useRef(false);

  // Intercepta o botão Voltar do navegador/celular para fechar o modal sem sair do sistema
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    closedByPopStateRef.current = false;
    window.history.pushState({ modal: 'final-preview' }, '');

    const handlePopState = () => {
      closedByPopStateRef.current = true;
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (!closedByPopStateRef.current && window.history.state?.modal === 'final-preview') {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const updateScale = () => {
      if (isOpen) {
        const isDesktop = window.innerWidth >= 1280;
        const availableWidth = Math.max(window.innerWidth - 32, 260);
        const availableHeight = Math.max(window.innerHeight - 140, 320);

        if (isDesktop) {
          // Desktop: 2 páginas lado a lado (2 * 1123 + gap)
          const scaleW = availableWidth / 2320;
          const scaleH = availableHeight / 820;
          setModalScale(Math.min(scaleH, scaleW, 0.9));
        } else {
          // Mobile / Tablet: páginas empilhadas ocupando a largura útil da tela
          const scaleW = availableWidth / 1123;
          setModalScale(Math.min(scaleW, 0.85));
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('resize', updateScale);
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) updateScale();
    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const scaledW = Math.round(1123 * modalScale);
  const scaledH = Math.round(794 * modalScale);

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Pré-visualização do Certificado em Tela Cheia"
    >
      {/* Barra Superior Fixa (Sempre visível no topo da tela em mobile e desktop) */}
      <div className="w-full shrink-0 bg-slate-900/95 border-b border-slate-800 px-3 sm:px-6 py-3 flex items-center justify-between gap-2 z-20 shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5 text-xs font-bold transition-colors shrink-0 shadow-xs"
            title="Voltar para a tela de edição (Esc)"
            aria-label="Voltar para a tela de edição"
          >
            <i className="fa-solid fa-arrow-left text-xs text-blue-400"></i>
            <span>Voltar</span>
          </button>

          <div className="min-w-0 hidden xs:block">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
              <i className="fa-solid fa-expand text-blue-400 hidden sm:inline"></i>
              <span>Pré-visualização (Frente e Verso)</span>
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {currentStudent ? `Aluno: ${currentStudent.name}` : 'Visualização de modelo'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <AppButton
            type="button"
            size="sm"
            variant="primary"
            icon="fa-solid fa-print"
            onClick={() => {
              onClose();
              onOpenExportModal();
            }}
          >
            <span>Exportar PDF</span>
          </AppButton>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-800/70 text-red-200 hover:text-white flex items-center justify-center text-sm transition-colors shrink-0"
            title="Fechar tela cheia (Esc)"
            aria-label="Fechar pré-visualização"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      {/* Área de Visualização com Rolagem Suave e Dimensionamento Exato */}
      <div
        className="flex-1 w-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 flex flex-col xl:flex-row items-center xl:justify-center gap-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Página 1: Frente */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-slate-800">
            Frente (Página 1)
          </span>
          <div
            style={{ width: `${scaledW}px`, height: `${scaledH}px` }}
            className="relative shadow-2xl rounded-sm overflow-hidden border border-slate-700 bg-white shrink-0"
          >
            <div
              style={{
                width: '1123px',
                height: '794px',
                transform: `scale(${modalScale})`,
                transformOrigin: 'top left',
              }}
            >
              <CertificatePreview data={data} student={currentStudent} page={1} />
            </div>
          </div>
        </div>

        {/* Página 2: Verso */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-slate-800">
            Verso — Conteúdo Programático (Página 2)
          </span>
          <div
            style={{ width: `${scaledW}px`, height: `${scaledH}px` }}
            className="relative shadow-2xl rounded-sm overflow-hidden border border-slate-700 bg-white shrink-0"
          >
            <div
              style={{
                width: '1123px',
                height: '794px',
                transform: `scale(${modalScale})`,
                transformOrigin: 'top left',
              }}
            >
              <CertificatePreview data={data} student={null} page={2} />
            </div>
          </div>
        </div>
      </div>

      {/* Botão Flutuante Inferior no Mobile para Fechar / Voltar rapidamente */}
      <div className="xl:hidden w-full shrink-0 bg-slate-900/95 border-t border-slate-800 p-3 flex justify-center z-20">
        <button
          type="button"
          onClick={onClose}
          className="w-full max-w-xs h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-md"
        >
          <i className="fa-solid fa-arrow-left text-blue-400"></i>
          <span>Voltar para a Edição</span>
        </button>
      </div>
    </div>
  );
};
