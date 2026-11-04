import React, { useState } from 'react';
import {
  loginOperator,
  registerOperator,
  listOperators,
  OperatorSession,
} from '../../services/authService';
import { AppButton, AppInput } from '../ui';

interface LoginScreenProps {
  onAuthenticated: (session: OperatorSession) => void;
  onOpenValidation?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onAuthenticated,
  onOpenValidation,
}) => {
  const existingOperators = listOperators();
  const [mode, setMode] = useState<'login' | 'register'>(
    existingOperators.length > 0 ? 'login' : 'register'
  );
  const [username, setUsername] = useState(
    existingOperators.length === 1 ? existingOperators[0].username : ''
  );
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'login') {
      const res = loginOperator(username, password);
      if (!res.success || !res.session) {
        setError(res.error || 'Falha ao autenticar.');
        return;
      }
      onAuthenticated(res.session);
    } else {
      const res = registerOperator(username, password, displayName || username);
      if (!res.success || !res.session) {
        setError(res.error || 'Falha ao criar acesso.');
        return;
      }
      onAuthenticated(res.session);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-y-auto">
      {/* Efeito de iluminação sutil corporativo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-blue-600/15 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10 space-y-6">
        {/* Identidade Visual */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl shadow-lg shadow-blue-600/30">
            <i className="fa-solid fa-graduation-cap" aria-hidden="true"></i>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                CertificaMaster
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                Operacional
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Acesso personalizado com Auto-Save exclusivo por operador
            </p>
          </div>
        </div>

        {/* Seletor Entrar / Criar Acesso Personalizado */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'login'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <i className="fa-solid fa-right-to-bracket text-xs" aria-hidden="true"></i>
            <span>Entrar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'register'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <i className="fa-solid fa-user-plus text-xs" aria-hidden="true"></i>
            <span>Criar Meu Acesso</span>
          </button>
        </div>

        {/* Lista rápida de operadores já salvos no dispositivo */}
        {mode === 'login' && existingOperators.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400">
              Operadores neste dispositivo (toque para preencher):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {existingOperators.map((op) => (
                <button
                  key={op.username}
                  type="button"
                  onClick={() => {
                    setUsername(op.username);
                    setError(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    username.trim().toLowerCase() === op.username
                      ? 'bg-blue-950/90 text-blue-300 border-blue-500'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <i className="fa-solid fa-user-shield text-[10px]" aria-hidden="true"></i>
                  <span>{op.displayName || op.username}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Formulário de Login / Cadastro */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <AppInput
              id="operator-display-name"
              label="Seu Nome (Opcional)"
              placeholder="Ex: Alexandre Correa"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              icon="fa-solid fa-id-badge"
            />
          )}

          <AppInput
            id="operator-username"
            label="Login / Usuário"
            placeholder="Ex: alexandre"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            icon="fa-solid fa-user"
            autoComplete="username"
          />

          <div className="space-y-1.5">
            <label
              htmlFor="operator-password"
              className="block text-xs font-semibold text-slate-200"
            >
              Senha de Acesso <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
                <i className="fa-solid fa-lock text-xs" aria-hidden="true"></i>
              </div>
              <input
                id="operator-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full h-10 pl-9 pr-10 rounded-lg text-sm bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 text-slate-400 hover:text-white p-1"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2">
              <i className="fa-solid fa-triangle-exclamation text-red-400 mt-0.5 shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-200/90 text-[11px] flex items-start gap-2">
            <i className="fa-solid fa-cloud-arrow-up text-emerald-400 mt-0.5 shrink-0"></i>
            <span>
              <strong>Auto-Save Protegido:</strong> Todas as edições (alunos, grade, textos, fontes e imagens) ficam salvas automaticamente na sua conta até a exportação final.
            </span>
          </div>

          <AppButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            icon={mode === 'login' ? 'fa-solid fa-unlock-keyhole' : 'fa-solid fa-check-circle'}
          >
            {mode === 'login' ? 'Acessar Tela Operacional' : 'Salvar Login e Acessar Sistema'}
          </AppButton>
        </form>

        {/* Botão de Consulta Pública de Certificado (QR Code) */}
        {onOpenValidation && (
          <div className="pt-3 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={onOpenValidation}
              className="w-full py-2 px-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400 flex items-center justify-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-stamp" aria-hidden="true"></i>
              <span>Consultar / Validar Autenticidade de Certificado</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

