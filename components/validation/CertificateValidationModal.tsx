import React, { useState, useEffect } from 'react';
import { AppDialog, AppInput, AppButton, AppBadge } from '../ui';
import { verifyCertificatePublic, PublicVerificationResult, isCloudAvailable } from '../../services/supabaseService';

interface CertificateValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const CertificateValidationModal: React.FC<CertificateValidationModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
}) => {
  const [code, setCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PublicVerificationResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialCode) {
        setCode(initialCode);
        handleValidate(initialCode);
      } else {
        setResult(null);
      }
    }
  }, [isOpen, initialCode]);

  const handleValidate = async (lookupCode: string) => {
    const trimmed = lookupCode.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setResult(null);
    try {
      const res = await verifyCertificatePublic(trimmed);
      setResult(res);
    } finally {
      setIsLoading(false);
    }
  };

  const cloudEnabled = isCloudAvailable();

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Portal de Autenticidade & Validação"
      description="Verifique a legitimidade de certificados emitidos pelo CertificaMaster"
      icon="fa-solid fa-stamp"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <i className={`fa-solid ${cloudEnabled ? 'fa-cloud-check text-emerald-500' : 'fa-database text-amber-500'}`}></i>
            <span>{cloudEnabled ? 'Conectado ao Supabase Cloud' : 'Validação em Modo Demonstração (Configure Supabase)'}</span>
          </div>
          <AppButton variant="secondary" size="sm" onClick={onClose}>
            Fechar
          </AppButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Campo de Busca por Código */}
        <div className="space-y-2">
          <label className="font-semibold text-slate-700 dark:text-slate-200">
            Código de Autenticidade do Certificado
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <AppInput
                type="text"
                placeholder="Ex: CM-2026-X8K9L2"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                leftElement={<i className="fa-solid fa-barcode text-slate-400"></i>}
              />
            </div>
            <AppButton
              type="button"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              onClick={() => handleValidate(code)}
              icon="fa-solid fa-magnifying-glass"
            >
              Verificar
            </AppButton>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            O código alfanumérico está impresso no verso do certificado ou abaixo do QR Code.
          </p>
        </div>

        {/* Resultado Positivo */}
        {result?.isValid && result.certificate && (
          <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <i className="fa-solid fa-circle-check text-emerald-600 text-lg"></i>
                <span>Certificado Autêntico & Registrado</span>
              </div>
              <AppBadge variant="success" size="sm">
                Válido
              </AppBadge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-[11px]">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Aluno / Titular:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{result.certificate.studentName}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">CPF (Protegido por LGPD):</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{result.certificate.studentCpfMasked}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Treinamento / Curso:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{result.certificate.courseName}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Carga Horária / Conclusão:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {result.certificate.workloadHours} horas • {result.certificate.completionDate}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 dark:text-slate-400 block">Instituição Emissora:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {result.certificate.organizationName}
                  {result.certificate.cnpj ? ` • CNPJ: ${result.certificate.cnpj}` : ''}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between border-t border-emerald-200/40 dark:border-emerald-900/20">
              <span>Código: {result.certificate.validationCode}</span>
              <span>Registrado em: {new Date(result.certificate.issuedAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        )}

        {/* Resultado Negativo */}
        {result && !result.isValid && (
          <div className="p-3 bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl space-y-1 text-red-800 dark:text-red-300 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-xs">
              <i className="fa-solid fa-circle-xmark text-red-600"></i>
              <span>Não foi possível validar o certificado</span>
            </div>
            <p className="text-[11px] leading-relaxed text-red-700 dark:text-red-400">
              {result.message || 'Verifique se o código digitado está correto e tente novamente.'}
            </p>
          </div>
        )}
      </div>
    </AppDialog>
  );
};
