import React, { useId } from 'react';

export interface AppTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  headerAction?: React.ReactNode;
}

export const AppTextarea: React.FC<AppTextareaProps> = ({
  label,
  helperText,
  error,
  headerAction,
  id,
  className = '',
  required,
  rows = 3,
  disabled,
  ...props
}) => {
  const autoId = useId();
  const inputId = id || autoId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {(label || headerAction) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={inputId}
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {label}
              {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
            </label>
          )}
          {headerAction}
        </div>
      )}

      <textarea
        id={inputId}
        rows={rows}
        className={`w-full rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 transition-colors
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/40'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40'
          }
          focus:outline-none
          disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed
          ${className}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        required={required}
        disabled={disabled}
        {...props}
      />

      {error ? (
        <p id={errorId} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-0.5">
          <i className="fa-solid fa-circle-exclamation text-[10px]" aria-hidden="true"></i>
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
