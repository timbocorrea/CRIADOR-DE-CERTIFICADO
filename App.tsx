import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useCertificateData, INITIAL_CERTIFICATE_DATA } from './hooks/useCertificateData';
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
import { QuickZoneInspector } from './components/sections/QuickZoneInspector';
import { CertificateElementZone } from './types';
import { syncCustomFontsStylesheet } from './utils/fontManager';

// Espaço de Trabalho e Pré-visualização
import { PreviewToolbar } from './components/preview/PreviewToolbar';
import { CertificateWorkspace } from './components/preview/CertificateWorkspace';
import { LoginScreen } from './components/auth/LoginScreen';
import { PwaInstallPromptBanner } from './components/pwa/PwaInstallPromptBanner';
import {
  getCurrentOperatorSession,
  logoutOperator,
  isMasterUsername,
  OperatorSession,
} from './services/authService';

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
const GeneratedCertificatesDatabaseModal = lazy(() =>
  import('./components/persistence/GeneratedCertificatesDatabaseModal').then((m) => ({
    default: m.GeneratedCertificatesDatabaseModal,
  }))
);
const UserManagementModal = lazy(() =>
  import('./components/admin/UserManagementModal').then((m) => ({ default: m.UserManagementModal }))
);
const AISettingsModal = lazy(() =>
  import('./components/ai/AISettingsModal').then((m) => ({ default: m.AISettingsModal }))
);
const CertificateValidationModal = lazy(() =>
  import('./components/validation/CertificateValidationModal').then((m) => ({ default: m.CertificateValidationModal }))
);

const AppContent: React.FC = () => {
  // 0. Sessão Autenticada do Operador (Acesso personalizado para isolar Auto-Save)
  const [operatorSession, setOperatorSession] = useState<OperatorSession | null>(() =>
    getCurrentOperatorSession()
  );

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
    addCustomFont,
    removeCustomFont,
    loadFullProject,
  } = useCertificateData();

  // 2. Persistência Segura e Auto-Save Completo por Operador Logado
  const {
    autoSaveStatus,
    lastSavedTime,
    exportFullProject,
    importFullProject,
    resetSavedDraft,
  } = useProjectPersistence(
    data,
    updateFields,
    operatorSession?.username || 'default'
  );

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
  const [selectedZone, setSelectedZone] = useState<CertificateElementZone | null>(null);
  const [mobileView, setMobileView] = useState<'split' | 'editor' | 'preview'>('split');
  const [previewPage, setPreviewPage] = useState<1 | 2>(1);
  const [zoomMode, setZoomMode] = useState<'auto' | 'manual'>('auto');
  const [zoom, setZoom] = useState<number>(0.65);
  const lastAutoZoomRef = useRef<number>(0.65);
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState<boolean>(false);
  const [isPersistenceModalOpen, setIsPersistenceModalOpen] = useState<boolean>(false);
  const [isGeneratedDatabaseModalOpen, setIsGeneratedDatabaseModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isAISettingsModalOpen, setIsAISettingsModalOpen] = useState<boolean>(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);
  const [validationInitialCode, setValidationInitialCode] = useState<string>('');
  const [validationInitialToken, setValidationInitialToken] = useState<string>('');

  // Detecta parâmetro de validação na URL (?validar=CODIGO&cert=TOKEN ou ?code=CODIGO)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('validar') || params.get('code');
      const token = params.get('cert') || '';
      if (code || token) {
        if (code) setValidationInitialCode(code.trim());
        if (token) setValidationInitialToken(token.trim());
        setIsValidationModalOpen(true);
      }
    }
  }, []);

  // Sincroniza fontes personalizadas enviadas pelo usuário (.ttf, .otf, .woff, .woff2) no DOM
  useEffect(() => {
    syncCustomFontsStylesheet(data.customFonts || []);
  }, [data.customFonts]);

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

  const handleLogout = useCallback(() => {
    logoutOperator();
    setOperatorSession(null);
    toast.info('Sessão Encerrada', 'Seu rascunho permanece salvo automaticamente no seu usuário.');
  }, [toast]);

  const handleClearDraftOutside = useCallback(() => {
    if (
      confirm(
        'Deseja realmente limpar o rascunho atual e voltar o certificado para o padrão inicial?'
      )
    ) {
      resetSavedDraft();
      loadFullProject({ ...INITIAL_CERTIFICATE_DATA });
      setSelectedZone(null);
      toast.info('Rascunho Limpo', 'A edição atual foi zerada para o modelo padrão.');
    }
  }, [resetSavedDraft, loadFullProject, toast]);

  // Se o operador ainda não autenticou seu login/senha, exibe a Tela de Acesso Personalizado
  if (!operatorSession) {
    return (
      <>
        <LoginScreen
          onAuthenticated={(session) => {
            setOperatorSession(session);
            toast.success(
              `Bem-vindo, ${session.displayName || session.username}!`,
              'Auto-Save completo ativado para sua sessão.'
            );
          }}
          onOpenValidation={() => {
            setValidationInitialCode('');
            setValidationInitialToken('');
            setIsValidationModalOpen(true);
          }}
        />
        <Suspense fallback={null}>
          {isValidationModalOpen && (
            <CertificateValidationModal
              isOpen={isValidationModalOpen}
              onClose={() => {
                setIsValidationModalOpen(false);
                setValidationInitialCode('');
                setValidationInitialToken('');
              }}
              initialCode={validationInitialCode}
              initialToken={validationInitialToken}
            />
          )}
        </Suspense>
      </>
    );
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] pwa-safe-bottom flex flex-col bg-slate-900 font-sans text-slate-800 antialiased overflow-hidden">
      {/* 1. Barra Superior Corporativa com Menus Responsivos */}
      <AppHeader
        courseName={data.courseName}
        studentsCount={data.students.length}
        autoSaveStatus={autoSaveStatus}
        lastSavedTime={lastSavedTime}
        onOpenProjectModal={() => setIsPersistenceModalOpen(true)}
        onClearDraft={handleClearDraftOutside}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onExportIndividual={() => startExport('individual')}
        onOpenAISettings={() => setIsAISettingsModalOpen(true)}
        onOpenValidation={() => {
          setValidationInitialCode('');
          setValidationInitialToken('');
          setIsValidationModalOpen(true);
        }}
        currentStudentName={currentStudent?.name}
        isGenerating={isGenerating}
        theme={theme}
        onToggleTheme={toggleTheme}
        mobileView={mobileView}
        onSelectMobileView={(view) => {
          setMobileView(view);
          if (view === 'split' || view === 'preview') {
            handleResetZoom();
          }
        }}
        operatorName={operatorSession.displayName || operatorSession.username}
        isMasterAdmin={
          operatorSession.role === 'master' || isMasterUsername(operatorSession.username)
        }
        onOpenAdminPanel={() => setIsAdminModalOpen(true)}
        onOpenGeneratedDatabase={() => setIsGeneratedDatabaseModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Área Principal: Barra Lateral Funcional + Área de Pré-visualização */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Painel Lateral com as 4 Áreas Funcionais (Preservação de DOM sem perda de digitação) */}
        <div
          id="mobile-panel-editor"
          role="region"
          aria-labelledby={mobileView === 'split' ? 'mobile-tab-split' : 'mobile-tab-editor'}
          className={`shrink-0 ${
            mobileView === 'split'
              ? 'max-lg:order-2 max-lg:w-full max-lg:flex-1 max-lg:min-h-0 max-lg:flex max-lg:flex-col max-lg:overflow-hidden'
              : mobileView === 'editor'
              ? 'max-lg:order-1 max-lg:w-full max-lg:flex-1 max-lg:h-full max-lg:flex max-lg:flex-col max-lg:overflow-hidden'
              : 'hidden lg:flex lg:flex-col'
          } lg:order-1 lg:w-[480px] xl:w-[500px] lg:h-[calc(100vh-4rem)] lg:flex lg:flex-col`}
        >
          <AppSidebar
            activeArea={activeArea}
            onSelectArea={(area) => {
              setSelectedZone(null);
              setActiveArea(area);
            }}
            studentsCount={data.students.length}
            curriculumCount={data.curriculum.length}
          >
            {/* Inspetor Contextual Direto (Quando o usuário clica em um elemento no Preview) */}
            {selectedZone && (
              <QuickZoneInspector
                zone={selectedZone}
                data={data}
                currentStudent={currentStudent}
                calculatedHours={calculatedHours}
                onClose={() => setSelectedZone(null)}
                onChange={handleGenericChange}
                onCheckboxChange={handleCheckboxChange}
                onSliderChange={handleSliderChange}
                onSetTextAlign={setTextAlign}
                onToggleBoldVariable={toggleBoldVariable}
                onSetImageField={setImageField}
                onUpdateFontFamily={(field, fontFamily) => updateField(field, fontFamily)}
                onAddCustomFont={addCustomFont}
                onRemoveCustomFont={removeCustomFont}
                onUpdateBaseText={(txt) => updateField('baseText', txt)}
                onUpdateStudentDisplayName={updateStudentDisplayName}
                onAddInstructor={addInstructor}
                onRemoveInstructor={removeInstructor}
                onAddCurriculumItem={addCurriculumItem}
                onRemoveCurriculumItem={removeCurriculumItem}
                onUpdateCurriculumItem={updateCurriculumItem}
                onSetTotalHoursManual={setTotalHoursManual}
                onToggleWorkloadMode={setWorkloadMode}
                onOpenAISettings={() => setIsAISettingsModalOpen(true)}
                onNotify={handleNotify}
              />
            )}

            {/* Área 1: Curso & Emissor */}
            <div
              id="panel-course_issuer"
              role="tabpanel"
              aria-labelledby="tab-course_issuer"
              className={!selectedZone && activeArea === 'course_issuer' ? 'block' : 'hidden'}
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
              className={!selectedZone && activeArea === 'participants' ? 'block' : 'hidden'}
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
              className={!selectedZone && activeArea === 'curriculum' ? 'block' : 'hidden'}
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
                onOpenAISettings={() => setIsAISettingsModalOpen(true)}
                onNotify={handleNotify}
              />
            </div>

            {/* Área 4: Design e Layout */}
            <div
              id="panel-design"
              role="tabpanel"
              aria-labelledby="tab-design"
              className={!selectedZone && activeArea === 'design' ? 'block' : 'hidden'}
            >
              <DesignSection
                data={data}
                previewPage={previewPage}
                onSelectPage={setPreviewPage}
                onSliderChange={handleSliderChange}
                onCheckboxChange={handleCheckboxChange}
                onSetTextAlign={setTextAlign}
                onToggleBoldVariable={toggleBoldVariable}
                onSetImageField={setImageField}
                onUpdateFontFamily={(field, fontFamily) => updateField(field, fontFamily)}
                onAddCustomFont={addCustomFont}
                onRemoveCustomFont={removeCustomFont}
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
              ? 'max-lg:order-1 max-lg:w-full max-lg:h-[35vh] max-lg:min-h-[210px] max-lg:max-h-[340px] max-lg:shrink-0 max-lg:border-b max-lg:border-slate-300 dark:max-lg:border-slate-800 max-lg:shadow-sm'
              : mobileView === 'preview'
              ? 'max-lg:order-1 max-lg:w-full max-lg:flex-1 max-lg:h-full'
              : 'hidden lg:flex'
          } lg:order-2 lg:flex-1 lg:h-[calc(100vh-4rem)] lg:min-h-0 lg:max-h-none lg:w-auto lg:border-b-0`}
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
            selectedZone={selectedZone}
            onSelectZone={(zone) => {
              setSelectedZone(zone);
              if (mobileView === 'preview') {
                setMobileView('split');
              }
            }}
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

        {isGeneratedDatabaseModalOpen && (
          <GeneratedCertificatesDatabaseModal
            isOpen={isGeneratedDatabaseModalOpen}
            currentUsername={operatorSession.username}
            onClose={() => setIsGeneratedDatabaseModalOpen(false)}
            onRestoreAndEdit={(restoredData, selectedIdx = 0) => {
              loadFullProject(restoredData);
              setCurrentStudentIdx(selectedIdx);
              toast.success(
                'Certificado Recuperado',
                `Os dados do curso "${restoredData.courseName || 'Sem Nome'}" foram carregados no editor.`
              );
            }}
            onRestoreAndExportNow={(restoredData, mode, selectedIdx = 0) => {
              loadFullProject(restoredData);
              setCurrentStudentIdx(selectedIdx);
              const targetStudent =
                restoredData.students?.[selectedIdx] || restoredData.students?.[0] || null;
              setTimeout(() => {
                startExport(mode, restoredData, targetStudent);
              }, 80);
            }}
            onNotify={handleNotify}
          />
        )}

        {isAdminModalOpen && (
          <UserManagementModal
            isOpen={isAdminModalOpen}
            currentUsername={operatorSession.username}
            onClose={() => setIsAdminModalOpen(false)}
            onNotify={handleNotify}
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
              setValidationInitialToken('');
            }}
            initialCode={validationInitialCode}
            initialToken={validationInitialToken}
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
      <PwaInstallPromptBanner />
    </ToastProvider>
  );
};

export default App;
