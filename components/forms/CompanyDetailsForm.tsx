import React from 'react';
import FormInput from '../FormInput';
import { CertificateData } from '../../types';

interface CompanyDetailsFormProps {
  data: CertificateData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CompanyDetailsForm: React.FC<CompanyDetailsFormProps> = ({
  data,
  onChange,
  onCheckboxChange,
}) => {
  return (
    <div className="space-y-4 pt-4 border-t">
      <h2 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
        <i className="fa-solid fa-building"></i> Instituição & Responsável
      </h2>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase">Dados da Empresa Emissora (Frente)</p>
        <FormInput label="Razão Social" name="companyName" value={data.companyName} onChange={onChange} />
        <FormInput label="CNPJ" name="companyCnpj" value={data.companyCnpj} onChange={onChange} />
        <FormInput label="Endereço Completo" name="address" value={data.address} onChange={onChange} multiline />
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
        <p className="text-[10px] font-bold text-blue-800 uppercase">Empresa Prestadora / Realização (Verso)</p>
        <FormInput label="Nome da Prestadora" name="providerName" value={data.providerName} onChange={onChange} />
        <FormInput label="CNPJ da Prestadora" name="providerCnpj" value={data.providerCnpj} onChange={onChange} />
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase">Responsável Técnico (Selo Digital)</p>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showTechResponsible"
            name="showTechResponsible"
            checked={data.showTechResponsible}
            onChange={onCheckboxChange}
            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
          />
          <label htmlFor="showTechResponsible" className="text-xs font-medium text-gray-800 cursor-pointer">
            Exibir Selo / Assinatura Técnica no Certificado
          </label>
        </div>
        <FormInput
          label="Nome do Responsável"
          name="techResponsibleName"
          value={data.techResponsibleName}
          onChange={onChange}
        />
        <FormInput
          label="Competências / Registro Técnico"
          name="techResponsibleCompetencies"
          value={data.techResponsibleCompetencies}
          onChange={onChange}
        />
      </div>
    </div>
  );
};
