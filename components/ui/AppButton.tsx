import React from 'react';

export interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: string;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeClasses = {
    xs: 'px-2.5 py-1 min-h-[28px] text-xs gap-1',
    sm: 'px-3 py-1.5 min-h-[36px] text-xs gap-1.5',
    md: 'px-4 py-2 min-h-[40px] text-sm gap-2',
    lg: 'px-5 py-2.5 min-h-[44px] text-base gap-2.5',
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm focus-visible:ring-blue-600 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
    secondary: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm focus-visible:ring-slate-400 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 border border-slate-200 dark:border-slate-600',
    outline: 'bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-300 border border-blue-600 dark:border-blue-500 focus-visible:ring-blue-600 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 focus-visible:ring-slate-400',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm focus-visible:ring-red-600 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
    success: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm focus-visible:ring-emerald-600 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i>
      ) : icon && iconPosition === 'left' ? (
        <i className={icon} aria-hidden="true"></i>
      ) : null}

      {children && <span>{children}</span>}

      {!isLoading && icon && iconPosition === 'right' && (
        <i className={icon} aria-hidden="true"></i>
      )}
    </button>
  );
};
