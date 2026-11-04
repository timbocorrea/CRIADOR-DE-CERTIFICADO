import React, { useState, useEffect, useCallback } from 'react';
import {
  listOperators,
  syncOperatorsFromCloud,
  adminSetOperatorStatus,
  adminCreateUserOperator,
  adminResetOperatorPassword,
  adminDeleteOperator,
  getAdminGovernanceSettings,
  saveAdminGovernanceSettings,
  isMasterUsername,
  MASTER_ADMIN_EMAIL,
  OperatorRecord,
  OperatorStatus,
  AdminGovernanceSettings,
} from '../../services/authService';
import { loadFullUserWorkspace, clearFullUserWorkspace } from '../../utils/projectPersistence';
import { AppDialog, AppButton, AppInput, AppBadge } from '../ui';

interface UserManagementModalProps {
  isOpen: boolean;
  currentUsername: string;
  onClose: () => void;
  onNotify?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  currentUsername,
  onClose,
  onNotify,
}) => {
  const isMaster = isMasterUsername(currentUsername);
  const [operators, setOperators] = useState<OperatorRecord[]>(() => listOperators());
  const [governance, setGovernance] = useState<AdminGovernanceSettings>(() =>
    getAdminGovernanceSettings()
  );

  // Estados para criação de novo usuário
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newInitialStatus, setNewInitialStatus] = useState<OperatorStatus>('active');

  // Estados para redefinição de senha de usuário existente
  const [resetTargetUser, setResetTargetUser] = useState<string | null>(null);
  const [resetNewPass, setResetNewPass] = useState('');

  // Filtro de busca
  const [searchTerm, setSearchTerm] = useState('');

  const refreshOperators = useCallback(async () => {
    setOperators(listOperators());
    const synced = await syncOperatorsFromCloud();
    setOperators(synced);
  }, []);

  useEffect(() => {
    if (isOpen && isMaster) {
      void refreshOperators();
      setGovernance(getAdminGovernanceSettings());
    }
  }, [isOpen, isMaster, refreshOperators]);

  if (!isOpen) return null;

  // Proteção estrita: se não for o usuário Master, bloqueia a visualização
  if (!isMaster) {
    return (
      <AppDialog
        isOpen={isOpen}
        onClose={onClose}
        title="Acesso Restrito ao Administrador Master"
        description="Apenas o usuário Master possui permissão para gerenciar contas."
        icon="fa-solid fa-shield-halved"
        maxWidth="md"
      >
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs space-y-2">
          <p className="font-bold flex items-center gap-2">
            <i className="fa-solid fa-lock text-red-500"></i>
            <span>Privilégio Insuficiente</span>
          </p>
          <p>
            Sua conta possui perfil <strong>Usuário (Editor)</strong>, com permissão exclusiva para criar e editar seus próprios certificados.
          </p>
        </div>
      </AppDialog>
    );
  }

  const handleToggleStatus = (op: OperatorRecord, nextStatus: OperatorStatus) => {
    const res = adminSetOperatorStatus(op.username, nextStatus);
    if (!res.success) {
      onNotify?.('error', 'Erro ao atualizar status', res.error);
      return;
    }
    if (res.operators) setOperators(res.operators);
    onNotify?.(
      nextStatus === 'active' ? 'success' : 'warning',
      nextStatus === 'active' ? 'Acesso Liberado' : 'Usuário Bloqueado',
      nextStatus === 'active'
        ? `O usuário "${op.username}" agora está autorizado a criar e editar seus certificados.`
        : `O acesso do usuário "${op.username}" ao sistema foi bloqueado.`
    );
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const res = adminCreateUserOperator(newUsername, newPassword, newDisplayName, newInitialStatus);
    if (!res.success) {
      onNotify?.('error', 'Falha ao cadastrar usuário', res.error);
      return;
    }
    if (res.operators) setOperators(res.operators);
    setNewUsername('');
    setNewDisplayName('');
    setNewPassword('');
    onNotify?.(
      'success',
      'Usuário Cadastrado',
      `O usuário "${newUsername.trim().toLowerCase()}" foi adicionado com perfil "user" (apenas criar e editar próprios certificados).`
    );
  };

  const handleConfirmResetPassword = (username: string) => {
    const res = adminResetOperatorPassword(username, resetNewPass);
    if (!res.success) {
      onNotify?.('error', 'Erro ao redefinir senha', res.error);
      return;
    }
    setResetTargetUser(null);
    setResetNewPass('');
    onNotify?.('success', 'Senha Atualizada', `A senha de "${username}" foi alterada com sucesso.`);
  };

  const handleDeleteUser = (op: OperatorRecord) => {
    const res = adminDeleteOperator(op.username);
    if (!res.success) {
      onNotify?.('error', 'Erro ao remover usuário', res.error);
      return;
    }
    clearFullUserWorkspace(op.username);
    if (res.operators) setOperators(res.operators);
    onNotify?.('info', 'Usuário Removido', `A conta "${op.username}" foi excluída do sistema.`);
  };

  const handleGovernanceChange = (patch: Partial<AdminGovernanceSettings>) => {
    const next = saveAdminGovernanceSettings(patch);
    setGovernance(next);
    onNotify?.('success', 'Política de Acesso Atualizada', 'Configuração aplicada para novos acessos.');
  };

  const filteredOperators = operators.filter((op) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      op.username.toLowerCase().includes(q) ||
      (op.displayName || '').toLowerCase().includes(q)
    );
  });

  const totalUsers = operators.filter((o) => o.role === 'user').length;
  const activeUsers = operators.filter((o) => o.role === 'user' && o.status === 'active').length;
  const blockedUsers = operators.filter((o) => o.role === 'user' && o.status !== 'active').length;

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Painel Administrativo de Usuários (Master)"
      description={`Gerenciamento central exclusivo para ${MASTER_ADMIN_EMAIL}`}
      icon="fa-solid fa-user-shield"
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <i className="fa-solid fa-crown text-amber-500"></i>
            <span>
              Conta Master: <strong>{MASTER_ADMIN_EMAIL}</strong>
            </span>
          </div>
          <AppButton variant="secondary" size="sm" onClick={onClose}>
            Voltar para Edição do Certificado
          </AppButton>
        </div>
      }
    >
      <div className="space-y-5">
        {/* 1. Resumo de Governança e Indicadores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Usuários (Users)
              </p>
              <p className="text-xl font-extrabold text-blue-900 dark:text-white">{totalUsers}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <i className="fa-solid fa-users text-sm"></i>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Acessos Permitidos
              </p>
              <p className="text-xl font-extrabold text-emerald-800 dark:text-emerald-200">{activeUsers}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <i className="fa-solid fa-user-check text-sm"></i>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-red-50/70 dark:bg-red-950/40 border border-red-200 dark:border-red-800/70 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
                Bloqueados / Pendentes
              </p>
              <p className="text-xl font-extrabold text-red-800 dark:text-red-200">{blockedUsers}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-red-600/15 text-red-600 dark:text-red-400 flex items-center justify-center">
              <i className="fa-solid fa-user-lock text-sm"></i>
            </div>
          </div>
        </div>

        {/* 2. Políticas de Novos Cadastros */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <i className="fa-solid fa-sliders text-blue-600 dark:text-blue-400 text-xs"></i>
              Regras de Acesso ao Sistema para Usuários ("Users")
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              Privilégio User: Apenas criar e editar os próprios certificados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={governance.allowSelfRegistration}
                onChange={(e) => handleGovernanceChange({ allowSelfRegistration: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-100 block">
                  Permitir botão "Criar Meu Acesso" na tela de login
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Se desmarcado, somente você (Master) poderá cadastrar novos usuários aqui no painel.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={governance.requireApprovalForNewUsers}
                onChange={(e) => handleGovernanceChange({ requireApprovalForNewUsers: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-100 block">
                  Exigir liberação do Admin para novos cadastros
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Novos usuários entram bloqueados/pendentes até você clicar em "Permitir Acesso".
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 3. Cadastrar Novo Usuário ("user") Diretamente pelo Admin */}
        <form
          onSubmit={handleCreateUser}
          className="p-3.5 rounded-xl bg-blue-50/40 dark:bg-slate-800/80 border border-blue-200/80 dark:border-slate-700 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <i className="fa-solid fa-user-plus text-blue-600 dark:text-blue-400 text-xs"></i>
              Adicionar Novo Usuário ("User" — Criador/Editor de Certificados)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <AppInput
              id="admin-new-username"
              label="Login ou E-mail *"
              placeholder="Ex: operador@empresa.com"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              icon="fa-solid fa-envelope"
            />
            <AppInput
              id="admin-new-displayname"
              label="Nome de Identificação"
              placeholder="Ex: Maria Operadora"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              icon="fa-solid fa-id-card"
            />
            <AppInput
              id="admin-new-password"
              label="Senha Inicial *"
              placeholder="Mínimo 4 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              icon="fa-solid fa-key"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Status inicial:</span>
              <button
                type="button"
                onClick={() => setNewInitialStatus('active')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  newInitialStatus === 'active'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                <i className="fa-solid fa-check mr-1"></i> Permitido (Ativo)
              </button>
              <button
                type="button"
                onClick={() => setNewInitialStatus('blocked')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  newInitialStatus === 'blocked'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                <i className="fa-solid fa-ban mr-1"></i> Bloqueado
              </button>
            </div>

            <AppButton
              type="submit"
              variant="primary"
              size="sm"
              icon="fa-solid fa-plus"
            >
              Cadastrar Usuário
            </AppButton>
          </div>
        </form>

        {/* 4. Lista de Usuários com Controle de Bloquear / Permitir Acesso */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <i className="fa-solid fa-list-check text-blue-600 dark:text-blue-400"></i>
              <span>Contas Cadastradas ({filteredOperators.length})</span>
            </h4>
            <div className="w-full sm:w-64">
              <AppInput
                id="admin-search-users"
                placeholder="Buscar por e-mail ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon="fa-solid fa-magnifying-glass"
              />
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-700/80 bg-white dark:bg-slate-900">
            {filteredOperators.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Nenhum usuário encontrado com este filtro.
              </div>
            ) : (
              filteredOperators.map((op) => {
                const isOpMaster = isMasterUsername(op.username);
                const savedWorkspace = loadFullUserWorkspace(op.username);
                const savedStudentsCount = savedWorkspace?.students?.length || 0;
                const savedCourse = savedWorkspace?.courseName || 'Sem curso em edição';

                return (
                  <div
                    key={op.username}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {op.displayName || op.username}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                          ({op.username})
                        </span>

                        {isOpMaster ? (
                          <AppBadge variant="info" size="sm" icon="fa-solid fa-crown">
                            ADMIN MASTER
                          </AppBadge>
                        ) : (
                          <AppBadge variant="neutral" size="sm" icon="fa-solid fa-user-pen">
                            USER (Apenas Próprios Certificados)
                          </AppBadge>
                        )}

                        {op.status === 'active' ? (
                          <AppBadge variant="success" size="sm" icon="fa-solid fa-circle-check">
                            Acesso Permitido
                          </AppBadge>
                        ) : op.status === 'pending' ? (
                          <AppBadge variant="warning" size="sm" icon="fa-solid fa-clock">
                            Aguardando Liberação
                          </AppBadge>
                        ) : (
                          <AppBadge variant="danger" size="sm" icon="fa-solid fa-ban">
                            Acesso Bloqueado
                          </AppBadge>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
                        <span>
                          <i className="fa-solid fa-floppy-disk mr-1 text-blue-500"></i>
                          Auto-Save isolado: <strong>{savedCourse}</strong> ({savedStudentsCount} aluno(s))
                        </span>
                        {op.lastLoginAt && (
                          <span>
                            Último acesso: {new Date(op.lastLoginAt).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>

                      {/* Área de Redefinição de Senha */}
                      {resetTargetUser === op.username && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Nova senha (mín. 4 caracteres)"
                            value={resetNewPass}
                            onChange={(e) => setResetNewPass(e.target.value)}
                            className="h-8 px-2.5 rounded-lg text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                          <AppButton
                            type="button"
                            size="xs"
                            variant="primary"
                            onClick={() => handleConfirmResetPassword(op.username)}
                          >
                            Salvar Senha
                          </AppButton>
                          <AppButton
                            type="button"
                            size="xs"
                            variant="ghost"
                            onClick={() => {
                              setResetTargetUser(null);
                              setResetNewPass('');
                            }}
                          >
                            Cancelar
                          </AppButton>
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação (Permitir / Bloquear / Senha / Excluir) */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {!isOpMaster && (
                        <>
                          {op.status === 'active' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(op, 'blocked')}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow-xs transition-all"
                              title="Bloquear imediatamente o acesso deste usuário ao sistema"
                            >
                              <i className="fa-solid fa-ban text-[11px]"></i>
                              <span>Bloquear Acesso</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(op, 'active')}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-xs transition-all"
                              title="Permitir que este usuário acesse o sistema e edite seus certificados"
                            >
                              <i className="fa-solid fa-check text-[11px]"></i>
                              <span>Permitir Acesso</span>
                            </button>
                          )}
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setResetTargetUser(resetTargetUser === op.username ? null : op.username);
                          setResetNewPass('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all"
                        title="Alterar ou redefinir a senha deste usuário"
                      >
                        <i className="fa-solid fa-key text-[11px] text-amber-500"></i>
                        <span>Senha</span>
                      </button>

                      {!isOpMaster && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(op)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/70 flex items-center gap-1 transition-all"
                          title="Excluir usuário e limpar seu rascunho"
                        >
                          <i className="fa-solid fa-trash-can text-[11px]"></i>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppDialog>
  );
};

