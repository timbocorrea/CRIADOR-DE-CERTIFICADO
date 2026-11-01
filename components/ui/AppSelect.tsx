import React, { useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface AppSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
}

export const AppSelect: React.FC<AppSelectProps> = ({
  label,
  helperText,
  error,
  options,
  id,
  className = '',
  required,
  disabled,
  ...props
}) => {
  const autoId = useId();
  const selectId = id || autoId;
  const helperId = `${selectId}-helper`;
  const errorId = `${selectId}-error`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          id={selectId}
          className={`w-full appearance-none rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm pl-3 pr-8 py-2 transition-colors
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
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="dark:bg-slate-900 dark:text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 text-slate-400 dark:text-slate-500 pointer-events-none text-xs">
          <i className="fa-solid fa-chevron-down"></i>
        </div>
      </div>

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
