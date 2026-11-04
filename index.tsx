
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Captura antecipada do evento nativo de instalação PWA antes da montagem do React
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).__certificamasterDeferredInstallPrompt = e;
    window.dispatchEvent(new Event('certificamaster-pwa-prompt-ready'));
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registro do Service Worker para PWA (Instalação em Desktop/Mobile e Cache Offline)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
