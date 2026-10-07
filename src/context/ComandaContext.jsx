import { createContext, useContext } from 'react';
import { useComanda } from '../hooks/useComanda.js';
import { useCajaContext } from './CajaContext.jsx';

const ComandaContext = createContext(null);

export function ComandaProvider({ children, onVentaRegistrada }) {
  const { sesion } = useCajaContext();
  const comanda = useComanda({ cajaSesionId: sesion?.id, onVentaRegistrada });

  return <ComandaContext.Provider value={comanda}>{children}</ComandaContext.Provider>;
}

export function useComandaContext() {
  const context = useContext(ComandaContext);

  if (context === null) {
    throw new Error('useComandaContext debe utilizarse dentro de un ComandaProvider.');
  }

  return context;
}