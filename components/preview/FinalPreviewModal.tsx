import React, { useEffect, useState } from 'react';
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
  const [modalScale, setModalScale] = useState(0.8);

  useEffect(() => {
    const updateScale = () => {
      if (isOpen) {
        const availableHeight = window.innerHeight * 0.8;
        const availableWidth = window.innerWidth * 0.9;
        const isDesktop = window.innerWidth > 1280;
        const targetWidth = isDesktop ? 2350 : 1150;
        const targetHeight = 850;
        const scaleH = availableHeight / targetHeight;
        const scaleW = availableWidth / targetWidth;
        setModalScale(Math.min(scaleH, scaleW, 1));
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

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Pré-visualização do Certificado em Tela Cheia"
    >
      <div className="w-full max-w-7xl flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-expand text-blue-400"></i>
            Pré-visualização Final (Frente e Verso)
          </h2>
          <p className="text-xs text-slate-400">
            {currentStudent ? `Exibindo documento de: ${currentStudent.name}` : 'Sem participante selecionado'}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            Exportar PDF
          </AppButton>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center text-sm transition-colors"
            title="Fechar pré-visualização (Esc)"
            aria-label="Fechar pré-visualização"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <div
        className="flex flex-col xl:flex-row gap-8 items-center justify-center origin-center transition-transform duration-200"
        style={{ transform: `scale(${modalScale})` }}
      >
        <div className="shadow-2xl rounded-sm overflow-hidden border border-slate-700 bg-white">
          <CertificatePreview data={data} student={currentStudent} page={1} />
        </div>
        <div className="shadow-2xl rounded-sm overflow-hidden border border-slate-700 bg-white">
          <CertificatePreview data={data} student={null} page={2} />
        </div>
      </div>
    </div>
  );
};
