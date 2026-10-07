import { useEffect, useState } from 'react';

function obtenerEstadoInicial() {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(obtenerEstadoInicial);

  useEffect(() => {
    const actualizarOnline = () => setOnline(true);
    const actualizarOffline = () => setOnline(false);

    window.addEventListener('online', actualizarOnline);
    window.addEventListener('offline', actualizarOffline);

    return () => {
      window.removeEventListener('online', actualizarOnline);
      window.removeEventListener('offline', actualizarOffline);
    };
  }, []);

  return online;
}