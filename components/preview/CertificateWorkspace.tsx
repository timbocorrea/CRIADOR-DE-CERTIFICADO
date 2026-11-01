import React, { useRef, useEffect } from 'react';
import CertificatePreview from '../CertificatePreview';
import { CertificateData, Student } from '../../types';
import { PageRenderTask } from '../../services/pdf';

interface CertificateWorkspaceProps {
  data: CertificateData;
  currentStudent: Student | null;
  previewPage: 1 | 2;
  zoom: number;
  zoomMode?: 'auto' | 'manual';
  onAutoZoomCalculated?: (fitScale: number) => void;
  activeRenderTask: PageRenderTask | null;
}

export const CertificateWorkspace: React.FC<CertificateWorkspaceProps> = React.memo(({
  data,
  currentStudent,
  previewPage,
  zoom,
  zoomMode = 'auto',
  onAutoZoomCalculated,
  activeRenderTask,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calculateFit = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      // Margens de folga para respiro visual e enquadramento total (sem corte de bordas)
      const isNarrow = window.innerWidth < 640;
      const paddingX = isNarrow ? 16 : 48;
      const paddingY = isNarrow ? 16 : 48;

      const availW = Math.max(rect.width - paddingX, 100);
      const availH = Math.max(rect.height - paddingY, 100);

      const scaleW = availW / 1123;
      const scaleH = availH / 794;
      const fit = parseFloat(Math.min(scaleW, scaleH).toFixed(3));
      const boundedFit = Math.min(Math.max(fit, 0.15), 1.50);

      if (onAutoZoomCalculated) {
        onAutoZoomCalculated(boundedFit);
      }
    };

    calculateFit();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        calculateFit();
      });
      observer.observe(container);
      return () => observer.disconnect();
    } else {
      window.addEventListener('resize', calculateFit);
      return () => window.removeEventListener('resize', calculateFit);
    }
  }, [onAutoZoomCalculated]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 bg-slate-200/70 dark:bg-slate-950 p-2 sm:p-4 overflow-auto flex flex-col items-center relative select-none scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-700 ${
        zoomMode === 'auto' ? 'justify-center' : 'justify-start'
      }`}
    >
      {/* Container de Pré-visualização com Enquadramento Inteiro e Zoom Interativo */}
      <div
        className="shadow-2xl rounded-sm border border-slate-300 dark:border-slate-800 relative shrink-0 transition-all duration-200 ease-out"
        style={{
          width: `${Math.round(1123 * zoom)}px`,
          height: `${Math.round(794 * zoom)}px`,
          marginTop: zoomMode === 'auto' ? '0px' : '12px',
          marginBottom: zoomMode === 'auto' ? '0px' : '24px',
        }}
      >
        <div
          style={{
            width: '1123px',
            height: '794px',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          <CertificatePreview
            data={data}
            student={previewPage === 1 ? currentStudent : null}
            page={previewPage}
          />
        </div>
      </div>

      {/* Slot de Renderização sob Demanda para Exportação de PDF (Gate 03 / Gate 04 - Intocado) */}
      <div
        id="pdf-render-slot"
        className="fixed top-[-9999px] left-[-9999px] pointer-events-none"
        style={{ width: '1123px', height: '794px' }}
      >
        {activeRenderTask && (
          <CertificatePreview
            data={data}
            student={activeRenderTask.student}
            page={activeRenderTask.pageType === 'front' ? 1 : 2}
            versoPageNumber={activeRenderTask.versoPageNumber}
            versoTotalPages={activeRenderTask.versoTotalPages}
            curriculumSlice={activeRenderTask.curriculumSlice}
            isFillerPage={activeRenderTask.pageType === 'filler'}
            idSuffix="-export-slot"
          />
        )}
      </div>
    </div>
  );
});

CertificateWorkspace.displayName = 'CertificateWorkspace';
