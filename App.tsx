import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useCertificateData } from './hooks/useCertificateData';
import { useProjectPersistence } from './hooks/useProjectPersistence';
import { usePDFExportProcess } from './hooks/usePDFExportProcess';
import { useTheme } from './hooks/useTheme';

// Componentes de Layout e Navegação (Gate 05 / Gate 06)
import { ToastProvider, useToast } from './components/ui/AppToast';
import { AppHeader } from './components/layout/AppHeader';
import { AppSidebar, FunctionalArea } from './components/layout/AppSidebar';

// 4 Áreas Funcionais Modernizadas
import { CourseIssuerSection } from './components/sections/CourseIssuerSection';
import { ParticipantsSection } from './components/sections/ParticipantsSection';
import { CurriculumSection } from './components/sections/CurriculumSection';
import { DesignSection } from './components/sections/DesignSection';

// Espaço de Trabalho e Pré-visualização
import { PreviewToolbar } from './components/preview/PreviewToolbar';
import { CertificateWorkspace } from './components/preview/CertificateWorkspace';

// Modais com Carregamento Tardio (Code Splitting / G07-B)
const FinalPreviewModal = lazy(() =>
  import('./components/preview/FinalPreviewModal').then((m) => ({ default: m.FinalPreviewModal }))
);
const ExportOptionsDialog = lazy(() =>
  import('./components/export/ExportOptionsDialog').then((m) => ({ default: m.ExportOptionsDialog }))
);
const ExportProgressDialog = lazy(() =>
  import('./components/export/ExportProgressDialog').then((m) => ({ default: m.ExportProgressDialog }))
);
const ProjectPersistenceModal = lazy(() =>
  import('./components/persistence/ProjectPersistenceModal').then((m) => ({ default: m.ProjectPersistenceModal }))
);
const AISettingsModal = lazy(() =>
  import('./components/ai/AISettingsModal').then((m) => ({ default: m.AISettingsModal }))
);
const CertificateValidationModal = lazy(() =>
  import('./components/validation/CertificateValidationModal').then((m) => ({ default: m.CertificateValidationModal }))
);

const AppContent: React.FC = () => {
  // 1. Gerenciamento Centralizado de Estado (Gate 04 / Gate 05)
  const {
    data,
    currentStudent,
    currentStudentIdx,
    setCurrentStudentIdx,
    calculatedHours,
    workloadDivergence,
    updateField,
    updateFields,
    setTotalHoursManual,
    setWorkloadMode,
    addStudent,
    bulkAddStudents,
    updateStudentDisplayName,
    removeStudent,
    addInstructor,
    removeInstructor,
    addCurriculumItem,
    updateCurriculumItem,
    removeCurriculumItem,
    setTextAlign,
    toggleBoldVariable,
    setImageField,
    loadFullProject,
  } = useCertificateData();

  // 2. Persistência Segura e Controle de Versão
  const {
    autoSaveStatus,
    lastSavedTime,
    exportFullProject,
    importFullProject,
    resetSavedDraft,
  } = useProjectPersistence(data, updateFields);

  // 3. Orquestração do Motor de PDF Protegido
  const {
    isExportModalOpen,
    setIsExportModalOpen,
    selectedExportMode,
    setSelectedExportMode,
    exportProgress,
    activeRenderTask,
    isGenerating,
    startExport,
    cancelExport,
  } = usePDFExportProcess(data, currentStudent, {
    onError: (msg) => toast.error('Aviso de Emissão', msg),
    onSuccess: (msg) => toast.success('Emissão Concluída', msg),
  });

  // 4. Notificações Toast e Tema da Interface
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();

  const handleNotify = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    if (type === 'success') toast.success(title, message);
    else if (type === 'error') toast.error(title, message);
    else if (type === 'warning') toast.warning(title, message);
    else toast.info(title, message);
  }, [toast]);

  // 5. Estados de Interface e Navegação das 4 Áreas Funcionais (Gate 05 / Gate 06)
  const [activeArea, setActiveArea] = useState<FunctionalArea>('course_issuer');
  const [mobileView, setMobileView] = useState<'split' | 'editor' | 'preview'>('split');
  const [previewPage, setPreviewPage] = useState<1 | 2>(1);
  const [zoomMode, setZoomMode] = useState<'auto' | 'manual'>('auto');
  const [zoom, setZoom] = useState<number>(0.65);
  const lastAutoZoomRef = useRef<number>(0.65);
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState<boolean>(false);
  const [isPersistenceModalOpen, setIsPersistenceModalOpen] = useState<boolean>(false);
  const [isAISettingsModalOpen, setIsAISettingsModalOpen] = useState<boolean>(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);
  const [validationInitialCode, setValidationInitialCode] = useState<string>('');

  // Detecta parâmetro de validação na URL (?validar=CODIGO ou ?code=CODIGO)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('validar') || params.get('code');
      if (code) {
        setValidationInitialCode(code.trim());
        setIsValidationModalOpen(true);
      }
    }
  }, []);

  // Handlers genéricos de formulário
  const handleGenericChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateField(name as any, value);
  }, [updateField]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    updateField(name as any, checked);
  }, [updateField]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const targetPage: 1 | 2 = (name.startsWith('verso') || name === 'hoursColumnWidth') ? 2 : 1;
    setPreviewPage((current) => (current !== targetPage ? targetPage : current));
    updateField(name as any, parseInt(value, 10));
  }, [updateField]);

  // Enquadramento automático responsivo contínuo (opção padrão)
  const handleAutoZoomCalculated = useCallback((fitScale: number) => {
    lastAutoZoomRef.current = fitScale;
    setZoom((prev) => {
      if (zoomMode === 'auto') {
        return Math.abs(prev - fitScale) > 0.005 ? fitScale : prev;
      }
      return prev;
    });
  }, [zoomMode]);

  const handleZoom = useCallback((delta: number) => {
    setZoomMode('manual');
    setZoom((prev) => Math.min(Math.max(parseFloat((prev + delta).toFixed(2)), 0.2), 2.0));
  }, []);

  const handleSetCustomZoom = useCallback((newZoom: number) => {
    setZoomMode('manual');
    setZoom(Math.min(Math.max(parseFloat(newZoom.toFixed(2)), 0.2), 2.0));
  }, []);

  const handleToggleZoomMode = useCallback((mode: 'auto' | 'manual') => {
    setZoomMode(mode);
    if (mode === 'auto' && lastAutoZoomRef.current) {
      setZoom(lastAutoZoomRef.current);
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    handleToggleZoomMode('auto');
  }, [handleToggleZoomMode]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 font-sans text-slate-800 antialiased overflow-hidden">
      {/* 1. Barra Superior Corporativa */}
      <AppHeader
        courseName={data.courseName}
        studentsCount={data.students.length}
        autoSaveStatus={autoSaveStatus}
        lastSavedTime={lastSavedTime}
        onOpenProjectModal={() => setIsPersistenceModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onExportIndividual={() => startExport('individual')}
        onOpenAISettings={() => setIsAISettingsModalOpen(true)}
        onOpenValidation={() => {
          setValidationInitialCode('');
          setIsValidationModalOpen(true);
        }}
        currentStudentName={currentStudent?.name}
        isGenerating={isGenerating}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* 2. Barra de Modos de Exibição para Telas Móveis e Tablets (< lg) */}
      <div
        className="lg:hidden bg-slate-800 dark:bg-slate-900 border-b border-slate-700/80 px-2 sm:px-3 py-1.5 flex items-center justify-center shrink-0 z-20 select-none"
        role="tablist"
        aria-label="Modo de visualização móvel"
      >
        <div className="flex bg-slate-900/90 dark:bg-slate-950 p-1 rounded-xl border border-slate-700/60 w-full max-w-sm shadow-inner gap-1">
          <button
            type="button"
            role="tab"
            id="mobile-tab-split"
            aria-selected={mobileView === 'split'}
            aria-controls="mobile-panel-split"
            onClick={() => {
              setMobileView('split');
              handleResetZoom();
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              mobileView === 'split'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Visualização dividida: veja as alterações no certificado em tempo real enquanto edita"
          >
            <i className="fa-solid fa-table-columns text-xs" aria-hidden="true"></i>
            <span>Dividido (Ao Vivo)</span>
          </button>
          <button
            type="button"
            role="tab"
            id="mobile-tab-editor"
            aria-selected={mobileView === 'editor'}
            aria-controls="mobile-panel-editor"
            onClick={() => setMobileView('editor')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              mobileView === 'editor'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Foco total no formulário de edição"
          >
            <i className="fa-solid fa-sliders text-xs" aria-hidden="true"></i>
            <span>Edição</span>
          </button>
          <button
            type="button"
            role="tab"
            id="mobile-tab-preview"
            aria-selected={mobileView === 'preview'}
            aria-controls="mobile-panel-preview"
            onClick={() => {
              setMobileView('preview');
              handleResetZoom();
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              mobileView === 'preview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Foco total na pré-visualização do certificado"
          >
            <i className="fa-solid fa-eye text-xs" aria-hidden="true"></i>
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* 3. Área Principal Dividida: Barra Lateral Funcional + Área de Pré-visualização */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Painel Lateral com as 4 Áreas Funcionais (Preservação de DOM sem perda de digitação) */}
        <div
          id="mobile-panel-editor"
          role="region"
          aria-labelledby={mobileView === 'split' ? 'mobile-tab-split' : 'mobile-tab-editor'}
          className={`shrink-0 ${
            mobileView === 'split'
              ? 'order-2 w-full flex-1 min-h-0 flex flex-col overflow-hidden'
              : mobileView === 'editor'
              ? 'order-1 w-full flex-1 h-full flex flex-col overflow-hidden'
              : 'hidden lg:flex lg:flex-col'
          } lg:order-1 lg:w-[480px] xl:w-[500px] lg:h-[calc(100vh-4rem)] lg:flex lg:flex-col`}
        >
          <AppSidebar
            activeArea={activeArea}
            onSelectArea={setActiveArea}
            studentsCount={data.students.length}
            curriculumCount={data.curriculum.length}
          >
            {/* Área 1: Curso & Emissor */}
            <div
              id="panel-course_issuer"
              role="tabpanel"
              aria-labelledby="tab-course_issuer"
              className={activeArea === 'course_issuer' ? 'block' : 'hidden'}
            >
              <CourseIssuerSection
                data={data}
                workloadDivergence={workloadDivergence}
                onChange={handleGenericChange}
                onCheckboxChange={handleCheckboxChange}
                onSetTotalHoursManual={setTotalHoursManual}
                onToggleWorkloadMode={setWorkloadMode}
                onUpdateBaseText={(txt) => updateField('baseText', txt)}
                onAddInstructor={addInstructor}
                onRemoveInstructor={removeInstructor}
                onOpenAISettings={() => setIsAISettingsModalOpen(true)}
                onNotify={handleNotify}
              />
            </div>

            {/* Área 2: Participantes */}
            <div
              id="panel-participants"
              role="tabpanel"
              aria-labelledby="tab-participants"
              className={activeArea === 'participants' ? 'block' : 'hidden'}
            >
              <ParticipantsSection
                students={data.students}
                currentStudent={currentStudent}
                currentStudentIdx={currentStudentIdx}
                onSelectStudentIdx={setCurrentStudentIdx}
                onAddStudent={addStudent}
                onBulkAddStudents={bulkAddStudents}
                onUpdateStudentDisplayName={updateStudentDisplayName}
                onRemoveStudent={removeStudent}
                onOpenAISettings={() => setIsAISettingsModalOpen(true)}
                onNotify={handleNotify}
              />
            </div>

            {/* Área 3: Grade Curricular */}
            <div
              id="panel-curriculum"
              role="tabpanel"
              aria-labelledby="tab-curriculum"
              className={activeArea === 'curriculum' ? 'block' : 'hidden'}
            >
              <CurriculumSection
                data={data}
                calculatedHours={calculatedHours}
                onCheckboxChange={handleCheckboxChange}
                onSliderChange={handleSliderChange}
                onAddCurriculumItem={addCurriculumItem}
                onRemoveCurriculumItem={removeCurriculumItem}
                onUpdateCurriculumItem={updateCurriculumItem}
                onSetTotalHoursManual={setTotalHoursManual}
                onToggleWorkloadMode={setWorkloadMode}
                onNotify={handleNotify}
              />
            </div>

            {/* Área 4: Design e Layout */}
            <div
              id="panel-design"
              role="tabpanel"
              aria-labelledby="tab-design"
              className={activeArea === 'design' ? 'block' : 'hidden'}
            >
              <DesignSection
                data={data}
                previewPage={previewPage}
                onSelectPage={setPreviewPage}
                onSliderChange={handleSliderChange}
                onSetTextAlign={setTextAlign}
                onToggleBoldVariable={toggleBoldVariable}
                onSetImageField={setImageField}
                onNotify={handleNotify}
              />
            </div>
          </AppSidebar>
        </div>

        {/* Área de Trabalho do Certificado */}
        <main
          id="mobile-panel-preview"
          role="region"
          aria-labelledby={mobileView === 'split' ? 'mobile-tab-split' : 'mobile-tab-preview'}
          className={`flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 ${
            mobileView === 'split'
              ? 'order-1 w-full h-[35vh] xs:h-[38vh] min-h-[210px] max-h-[340px] shrink-0 border-b border-slate-300 dark:border-slate-800 shadow-sm'
              : mobileView === 'preview'
              ? 'order-1 w-full flex-1 h-full'
              : 'hidden lg:flex'
          } lg:order-2 lg:flex-1 lg:h-[calc(100vh-4rem)] lg:border-b-0`}
        >
          {/* Barra de Ferramentas de Pré-visualização */}
          <PreviewToolbar
            totalStudents={data.students.length}
            currentStudentIdx={currentStudentIdx}
            currentStudent={currentStudent}
            previewPage={previewPage}
            zoom={zoom}
            zoomMode={zoomMode}
            onToggleZoomMode={handleToggleZoomMode}
            onSetCustomZoom={handleSetCustomZoom}
            isGenerating={isGenerating}
            onPrevStudent={() => setCurrentStudentIdx(Math.max(0, currentStudentIdx - 1))}
            onNextStudent={() => setCurrentStudentIdx(Math.min(data.students.length - 1, currentStudentIdx + 1))}
            onSelectPage={setPreviewPage}
            onZoomChange={handleZoom}
            onResetZoom={handleResetZoom}
            onOpenFullscreen={() => setIsFullscreenPreviewOpen(true)}
            onExportIndividual={() => startExport('individual')}
          />

          {/* Canvas do Certificado com Enquadramento Responsivo Automático */}
          <CertificateWorkspace
            data={data}
            currentStudent={currentStudent}
            previewPage={previewPage}
            zoom={zoom}
            zoomMode={zoomMode}
            onAutoZoomCalculated={handleAutoZoomCalculated}
            activeRenderTask={activeRenderTask}
          />
        </main>
      </div>

      {/* 4. Modais da Aplicação com Carregamento Sob Demanda (Code Splitting / G07-B) */}
      <Suspense fallback={null}>
        {isFullscreenPreviewOpen && (
          <FinalPreviewModal
            isOpen={isFullscreenPreviewOpen}
            data={data}
            currentStudent={currentStudent}
            onClose={() => setIsFullscreenPreviewOpen(false)}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        )}

        {isExportModalOpen && (
          <ExportOptionsDialog
            isOpen={isExportModalOpen}
            selectedExportMode={selectedExportMode}
            currentStudent={currentStudent}
            onSelectMode={setSelectedExportMode}
            onClose={() => setIsExportModalOpen(false)}
            onStartExport={startExport}
          />
        )}

        {isGenerating && (
          <ExportProgressDialog
            isGenerating={isGenerating}
            exportProgress={exportProgress}
            selectedExportMode={selectedExportMode}
            onCancel={cancelExport}
          />
        )}

        {isPersistenceModalOpen && (
          <ProjectPersistenceModal
            isOpen={isPersistenceModalOpen}
            autoSaveStatus={autoSaveStatus}
            lastSavedTime={lastSavedTime}
            onClose={() => setIsPersistenceModalOpen(false)}
            onExportProject={exportFullProject}
            onImportProject={importFullProject}
            onApplyImportedData={loadFullProject}
            onResetDraft={resetSavedDraft}
          />
        )}

        {isAISettingsModalOpen && (
          <AISettingsModal
            isOpen={isAISettingsModalOpen}
            onClose={() => setIsAISettingsModalOpen(false)}
            onNotify={handleNotify}
          />
        )}

        {isValidationModalOpen && (
          <CertificateValidationModal
            isOpen={isValidationModalOpen}
            onClose={() => {
              setIsValidationModalOpen(false);
              setValidationInitialCode('');
            }}
            initialCode={validationInitialCode}
          />
        )}
      </Suspense>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
