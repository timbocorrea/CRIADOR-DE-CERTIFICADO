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
    <div className={`flex flex-col items-center justify-center text-center p-7 bg-slate-50/70 dark:bg-slate-900/70 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/80 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl mb-3 shadow-xs">
        <i className={icon}></i>
      </div>
      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h4>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-300 max-w-xs mt-1 mb-4 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
