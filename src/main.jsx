import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { registerServiceWorker } from './serviceWorkerRegistration.js';
import './index.css';

registerServiceWorker({
  onUpdate: () => window.dispatchEvent(new CustomEvent('pos:actualizacion-disponible'))
}).catch((error) => {
  console.error('No se pudo registrar el Service Worker:', error);
});

if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
  navigator.storage.persist().catch((error) => {
    console.warn('No se pudo solicitar almacenamiento persistente:', error);
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);