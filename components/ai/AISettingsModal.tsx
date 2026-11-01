import React, { useState, useEffect, useRef } from 'react';
import { AppDialog, AppInput, AppButton, AppBadge, AppSelect } from '../ui';
import { AISettings, AIProviderId } from '../../types';
import {
  loadAISettings,
  saveAISettings,
  clearAISettings,
  testProviderConnection,
  DEFAULT_AI_SETTINGS,
} from '../../services/unifiedAIService';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({
    gemini: false,
    groq: false,
    openrouter: false,
  });
  const [testingProvider, setTestingProvider] = useState<AIProviderId | null>(null);
  const [testResults, setTestResults] = useState<{ [key in AIProviderId]?: { success: boolean; message: string } }>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      const loaded = loadAISettings();
      setSettings(loaded);
      setTestResults({});
      setSaveStatus('saved');
    }
  }, [isOpen]);

  // Sincroniza se as configurações forem alteradas por outro componente/aba
  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail) {
        setSettings(e.detail);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('certificamaster_ai_settings_changed', handleSync);
      return () => window.removeEventListener('certificamaster_ai_settings_changed', handleSync);
    }
  }, []);

  const handleToggleShowKey = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  // Auto-Save instantâneo a cada alteração ou colagem de chave
  const handleChangeKey = (field: keyof AISettings, value: string) => {
    setSettings((prev) => {
      const updated = { ...prev, [field]: value };
      saveAISettings(updated);
      setSaveStatus('saving');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('saved');
      }, 400);
      return updated;
    });
  };

  const handleTestKey = async (provider: AIProviderId, key: string) => {
    if (!key || !key.trim()) {
      if (onNotify) onNotify('warning', 'Chave Vazia', 'Preencha a chave de API antes de testar.');
      return;
    }

    setTestingProvider(provider);
    const result = await testProviderConnection(provider, key);
    setTestResults((prev) => ({ ...prev, [provider]: result }));
    setTestingProvider(null);

    if (result.success) {
      // Salva instantaneamente na validação bem-sucedida
      setSettings((prev) => {
        const updated = { ...prev };
        saveAISettings(updated);
        setSaveStatus('saved');
        return updated;
      });
      if (onNotify) onNotify('success', 'Conexão Bem-Sucedida', result.message);
    } else {
      if (onNotify) onNotify('error', 'Falha na Validação', result.message);
    }
  };

  // Fechamento seguro: sempre garante a persistência antes de fechar
  const handleClose = () => {
    saveAISettings(settings);
    onClose();
  };

  const handleSave = () => {
    saveAISettings(settings);
    setSaveStatus('saved');
    if (onNotify) onNotify('success', 'Configurações Salvas', 'As chaves de IA foram salvas permanentemente no seu navegador.');
    onClose();
  };

  const handleClearAll = () => {
    if (confirm('Deseja realmente remover todas as chaves de IA salvas neste navegador?')) {
      clearAISettings();
      setSettings(DEFAULT_AI_SETTINGS);
      setTestResults({});
      setSaveStatus('idle');
      if (onNotify) onNotify('info', 'Chaves Removidas', 'Todas as chaves de IA foram limpas deste navegador.');
    }
  };

  const hasAnyKey = Boolean(
    settings.geminiApiKey?.trim() || settings.groqApiKey?.trim() || settings.openrouterApiKey?.trim()
  );

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Central de Inteligência Artificial & OCR"
      description="Configure seus provedores de IA gratuitos para extrair alunos de fotos, prints de WhatsApp e polir textos."
      icon="fa-solid fa-microchip"
      maxWidth="lg"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <i className="fa-solid fa-circle-check"></i>
              <span>
                {saveStatus === 'saving'
                  ? 'Salvando no navegador...'
                  : 'Salvo automaticamente no navegador (LGPD - R$ 0,00)'}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasAnyKey && (
              <AppButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleClearAll}
                className="text-red-500 hover:text-red-600 border-red-200 dark:border-red-900/40 text-xs"
                title="Limpar todas as chaves salvas neste computador"
              >
                Limpar Chaves
              </AppButton>
            )}
            <AppButton variant="primary" size="sm" icon="fa-solid fa-check" onClick={handleSave}>
              Concluir
            </AppButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Banner Explicativo */}
        <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 rounded-xl space-y-1">
          <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300">
            <i className="fa-solid fa-wand-magic-sparkles text-blue-600 dark:text-blue-400"></i>
            <span>Cascata Inteligente Multi-Provedor (Failover Automático)</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
            Cadastre os provedores gratuitos que desejar. Se o primeiro atingir o limite ou falhar, o sistema chaveia automaticamente para o próximo em milissegundos.
          </p>
        </div>

        {/* 1. Google Gemini */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">Google Gemini Flash</span>
              <AppBadge variant={settings.geminiApiKey?.trim() ? 'success' : 'neutral'} size="sm">
                {settings.geminiApiKey?.trim() ? 'Configurado' : 'Opcional'}
              </AppBadge>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Gerar chave grátis no Google AI Studio</span>
              <i className="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <AppInput
                type={showKeys.gemini ? 'text' : 'password'}
                placeholder="Cole sua chave AIzaSy..."
                value={settings.geminiApiKey}
                onChange={(e) => handleChangeKey('geminiApiKey', e.target.value)}
                rightElement={
                  <button
                    type="button"
                    onClick={() => handleToggleShowKey('gemini')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                    title={showKeys.gemini ? 'Ocultar chave' : 'Mostrar chave'}
                  >
                    <i className={`fa-solid ${showKeys.gemini ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                }
              />
            </div>
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              isLoading={testingProvider === 'gemini'}
              onClick={() => handleTestKey('gemini', settings.geminiApiKey)}
              title="Testar validade da chave do Google Gemini"
            >
              Testar
            </AppButton>
          </div>

          {testResults.gemini && (
            <p className={`text-[11px] flex items-center gap-1 ${testResults.gemini.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              <i className={`fa-solid ${testResults.gemini.success ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
              <span>{testResults.gemini.message}</span>
            </p>
          )}
        </div>

        {/* 2. Groq Cloud */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">Groq Cloud (Llama 3.2 Vision)</span>
              <AppBadge variant={settings.groqApiKey?.trim() ? 'success' : 'neutral'} size="sm">
                {settings.groqApiKey?.trim() ? 'Configurado' : 'Opcional'}
              </AppBadge>
            </div>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Gerar chave grátis no Groq Console</span>
              <i className="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <AppInput
                type={showKeys.groq ? 'text' : 'password'}
                placeholder="Cole sua chave gsk_..."
                value={settings.groqApiKey}
                onChange={(e) => handleChangeKey('groqApiKey', e.target.value)}
                rightElement={
                  <button
                    type="button"
                    onClick={() => handleToggleShowKey('groq')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                    title={showKeys.groq ? 'Ocultar chave' : 'Mostrar chave'}
                  >
                    <i className={`fa-solid ${showKeys.groq ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                }
              />
            </div>
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              isLoading={testingProvider === 'groq'}
              onClick={() => handleTestKey('groq', settings.groqApiKey)}
              title="Testar validade da chave da Groq"
            >
              Testar
            </AppButton>
          </div>

          {testResults.groq && (
            <p className={`text-[11px] flex items-center gap-1 ${testResults.groq.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              <i className={`fa-solid ${testResults.groq.success ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
              <span>{testResults.groq.message}</span>
            </p>
          )}
        </div>

        {/* 3. OpenRouter */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">OpenRouter (Modelos Livres)</span>
              <AppBadge variant={settings.openrouterApiKey?.trim() ? 'success' : 'neutral'} size="sm">
                {settings.openrouterApiKey?.trim() ? 'Configurado' : 'Opcional'}
              </AppBadge>
            </div>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Gerar chave no OpenRouter</span>
              <i className="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <AppInput
                type={showKeys.openrouter ? 'text' : 'password'}
                placeholder="Cole sua chave sk-or-v1-..."
                value={settings.openrouterApiKey}
                onChange={(e) => handleChangeKey('openrouterApiKey', e.target.value)}
                rightElement={
                  <button
                    type="button"
                    onClick={() => handleToggleShowKey('openrouter')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                    title={showKeys.openrouter ? 'Ocultar chave' : 'Mostrar chave'}
                  >
                    <i className={`fa-solid ${showKeys.openrouter ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                }
              />
            </div>
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              isLoading={testingProvider === 'openrouter'}
              onClick={() => handleTestKey('openrouter', settings.openrouterApiKey)}
              title="Testar validade da chave do OpenRouter"
            >
              Testar
            </AppButton>
          </div>

          {testResults.openrouter && (
            <p className={`text-[11px] flex items-center gap-1 ${testResults.openrouter.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              <i className={`fa-solid ${testResults.openrouter.success ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
              <span>{testResults.openrouter.message}</span>
            </p>
          )}
        </div>

        {/* Seletor de Prioridade */}
        <div className="pt-1">
          <AppSelect
            label="Estratégia de Execução"
            value={settings.preferredProvider}
            onChange={(e) => handleChangeKey('preferredProvider', e.target.value as any)}
            options={[
              { value: 'auto', label: 'Cascata Automática (Gemini ➔ Groq ➔ OpenRouter)' },
              { value: 'gemini', label: 'Priorizar Google Gemini (Fallback para Groq/OpenRouter)' },
              { value: 'groq', label: 'Priorizar Groq Cloud (Fallback para Gemini/OpenRouter)' },
              { value: 'openrouter', label: 'Priorizar OpenRouter (Fallback para Gemini/Groq)' },
            ]}
          />
        </div>
      </div>
    </AppDialog>
  );
};

