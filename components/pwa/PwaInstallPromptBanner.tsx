import React, { useState, useEffect } from 'react';
import { AppDialog, AppButton } from '../ui';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __certificamasterDeferredInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

const PWA_BANNER_DISMISSED_KEY = 'certificamaster_pwa_banner_dismissed_v1';

export function isRunningStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  const isStandaloneMedia =
    window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  const isIosStandalone = Boolean((window.navigator as any)?.standalone);
  return isStandaloneMedia || isIosStandalone;
}

export const PwaInstallPromptBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => (typeof window !== 'undefined' ? window.__certificamasterDeferredInstallPrompt || null : null)
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isRunningStandalonePwa());
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(PWA_BANNER_DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const onPromptAvailable = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__certificamasterDeferredInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const onCustomCaptured = () => {
      if (window.__certificamasterDeferredInstallPrompt) {
        setDeferredPrompt(window.__certificamasterDeferredInstallPrompt);
      }
    };

    const onInstalled = () => {
      window.__certificamasterDeferredInstallPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', onPromptAvailable);
    window.addEventListener('certificamaster-pwa-prompt-ready', onCustomCaptured);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPromptAvailable);
      window.removeEventListener('certificamaster-pwa-prompt-ready', onCustomCaptured);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleTriggerInstall = async () => {
    const activePrompt = deferredPrompt || window.__certificamasterDeferredInstallPrompt;
    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        if (choice.outcome === 'accepted') {
          window.__certificamasterDeferredInstallPrompt = null;
          setDeferredPrompt(null);
          setIsInstalled(true);
        }
      } catch {
        setIsHelpModalOpen(true);
      }
    } else {
      setIsHelpModalOpen(true);
    }
  };

  const handleDismissBanner = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(PWA_BANNER_DISMISSED_KEY, '1');
    } catch {}
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Banner Flutuante Automático de Instalação do PWA ao carregar/recarregar */}
      {!isDismissed && (
        <div
          role="region"
          aria-label="Instalação do Aplicativo CertificaMaster"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[410px] z-50 bg-slate-900/98 text-white border-2 border-indigo-500/80 rounded-2xl shadow-2xl p-4 animate-fadeIn backdrop-blur-md no-print"
        >
          <div className="flex items-start gap-3">
            <img
              src="/pwa-192x192.png"
              alt="Ícone CertificaMaster"
              className="w-11 h-11 rounded-xl shrink-0 border border-indigo-400/50 shadow-md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600/40 border border-indigo-400/50 text-[10px] font-extrabold uppercase tracking-wider text-indigo-200">
                  <i className="fa-solid fa-mobile-screen-button"></i>
                  <span>Aplicativo PWA Disponível</span>
                </span>
                <button
                  type="button"
                  onClick={handleDismissBanner}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                  title="Fechar aviso"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>

              <h3 className="text-xs sm:text-sm font-bold text-white mt-1">
                Instalar o CertificaMaster no seu Dispositivo
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Acesse direto pela Área de Trabalho ou Tela Inicial como um aplicativo nativo em tela cheia.
              </p>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleDismissBanner}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Agora não
                </button>
                <button
                  type="button"
                  onClick={() => void handleTriggerInstall()}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white border border-indigo-400/70 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-download"></i>
                  <span>Instalar Aplicativo Agora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Guia de Instalação Direta (Caso o navegador exija clique no ícone da barra de endereços ou iOS) */}
      <AppDialog
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title="Instalar Aplicativo CertificaMaster (PWA)"
        description="Siga o passo abaixo conforme seu navegador para instalar em 2 segundos"
        icon="fa-solid fa-download"
        maxWidth="md"
        footer={
          <div className="flex justify-end w-full">
            <AppButton variant="primary" size="sm" onClick={() => setIsHelpModalOpen(false)}>
              Entendi
            </AppButton>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-200">
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i className="fa-brands fa-chrome text-blue-500 text-sm"></i>
              <span>No Computador (Google Chrome / Microsoft Edge):</span>
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Olhe para o canto direito da <strong>barra de endereços (onde fica o link do site)</strong> e clique no ícone de <strong>Computador com uma seta para baixo (Instalar CertificaMaster)</strong>, ou abra o menu <strong>⋮</strong> do navegador e clique em <strong>"Salvar e compartilhar" → "Instalar CertificaMaster..."</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i className="fa-brands fa-android text-emerald-500 text-sm"></i>
              <span>No Celular Android (Chrome):</span>
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Toque nos <strong>3 pontinhos (⋮)</strong> no canto superior direito do Chrome e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i className="fa-brands fa-apple text-slate-900 dark:text-white text-sm"></i>
              <span>No iPhone / iPad (Safari):</span>
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Toque no botão <strong>Compartilhar (quadrado com seta para cima)</strong> na barra inferior do Safari e toque em <strong>"Adicionar à Tela de Início"</strong>.
            </p>
          </div>
        </div>
      </AppDialog>
    </>
  );
};
