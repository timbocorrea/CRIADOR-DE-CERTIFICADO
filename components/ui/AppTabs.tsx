import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: React.ReactNode;
}

export interface AppTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pills' | 'underline' | 'segmented';
  className?: string;
}

export const AppTabs: React.FC<AppTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'segmented',
  className = '',
}) => {
  if (variant === 'segmented') {
    return (
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={`flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl gap-1 border border-slate-200/60 dark:border-slate-700 ${className}`}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-200 shadow-sm border border-slate-200/50 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/60'
              }`}
            >
              {tab.icon && <i className={tab.icon}></i>}
              <span>{tab.label}</span>
              {tab.badge}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={`flex border-b border-slate-200 gap-4 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              isActive
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.icon && <i className={tab.icon}></i>}
            <span>{tab.label}</span>
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
};
