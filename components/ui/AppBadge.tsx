import React from 'react';

export interface AppBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  icon?: string;
  className?: string;
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const variantClasses = {
    default: 'bg-blue-50 dark:bg-blue-950/90 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700/80',
    info: 'bg-sky-50 dark:bg-sky-950/90 text-sky-700 dark:text-sky-200 border border-sky-200 dark:border-sky-700/80',
    success: 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700/80',
    warning: 'bg-amber-50 dark:bg-amber-950/90 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-700/80',
    danger: 'bg-red-50 dark:bg-red-950/90 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-700/80',
    neutral: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-600',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {icon && <i className={icon}></i>}
      {children}
    </span>
  );
};
