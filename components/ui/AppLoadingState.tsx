import React from 'react';

export interface AppLoadingStateProps {
  message?: string;
  subMessage?: string;
  className?: string;
}

export const AppLoadingState: React.FC<AppLoadingStateProps> = ({
  message = 'Carregando...',
  subMessage,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      <div className="w-10 h-10 rounded-full border-3 border-blue-100 border-t-blue-600 animate-spin mb-3"></div>
      <p className="text-sm font-medium text-slate-700">{message}</p>
      {subMessage && (
        <p className="text-xs text-slate-500 mt-1">{subMessage}</p>
      )}
    </div>
  );
};
