import React from 'react';

export interface AppEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const AppEmptyState: React.FC<AppEmptyStateProps> = ({
  icon = 'fa-solid fa-inbox',
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-xl mb-3">
        <i className={icon}></i>
      </div>
      <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      {description && (
        <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
