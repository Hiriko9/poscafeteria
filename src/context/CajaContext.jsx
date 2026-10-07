import { createContext, useContext } from 'react';
import { useCaja } from '../hooks/useCaja.js';

const CajaContext = createContext(null);

export function CajaProvider({ children }) {
  const caja = useCaja();

  return <CajaContext.Provider value={caja}>{children}</CajaContext.Provider>;
}

export function useCajaContext() {
  const context = useContext(CajaContext);

  if (context === null) {
    throw new Error('useCajaContext debe utilizarse dentro de un CajaProvider.');
  }

  return context;
}