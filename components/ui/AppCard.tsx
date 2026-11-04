import React, { useState } from 'react';

export interface AppCardProps {
  title?: string;
  description?: string;
  icon?: string;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const AppCard: React.FC<AppCardProps> = ({
  title,
  description,
  icon,
  badge,
  headerAction,
  isCollapsible = false,
  defaultExpanded = true,
  isExpanded: controlledExpanded,
  onToggleExpand,
  children,
  footer,
  className = '',
  headerClassName = '',
  contentClassName = 'p-5',
}) => {
  const [internalExpanded, setInternalExpanded] = useState<boolean>(defaultExpanded);
  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  const toggleExpand = () => {
    if (isCollapsible) {
      if (!isControlled) {
        setInternalExpanded((prev) => !prev);
      }
      onToggleExpand?.(!isExpanded);
    }
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (isCollapsible && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      toggleExpand();
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden transition-all ${className}`}>
      {(title || description || headerAction || isCollapsible) && (
        <div
          role={isCollapsible ? 'button' : undefined}
          tabIndex={isCollapsible ? 0 : undefined}
          aria-expanded={isCollapsible ? isExpanded : undefined}
          onKeyDown={handleHeaderKeyDown}
          onClick={toggleExpand}
          className={`px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/60 ${
            isCollapsible ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/90 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600' : ''
          } ${headerClassName}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm shrink-0">
                <i className={icon} aria-hidden="true"></i>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {title && <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{title}</h3>}
                {badge}
              </div>
              {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{description}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerAction && (
              <div onClick={(e) => e.stopPropagation()}>
                {headerAction}
              </div>
            )}
            {isCollapsible && (
              <button
                type="button"
                tabIndex={-1}
                className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 flex items-center justify-center text-xs transition-colors"
                aria-hidden="true"
              >
                <i className={`fa-solid fa-chevron-down transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}></i>
              </button>
            )}
          </div>
        </div>
      )}

      {(!isCollapsible || isExpanded) && (
        <div className={contentClassName}>
          {children}
        </div>
      )}

      {(!isCollapsible || isExpanded) && footer && (
        <div className="px-4 sm:px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          {footer}
        </div>
      )}
    </div>
  );
};
