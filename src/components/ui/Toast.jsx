import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CircleCheck, CircleX, X } from 'lucide-react';

const ToastContext = createContext(null);

export function Toast({ toast, onCerrar }) {
  const esError = toast.tipo === 'error';
  const Icono = esError ? CircleX : CircleCheck;

  return (
    <div
      className={`pointer-events-auto flex min-h-11 items-start gap-3 rounded-lg px-4 py-3 text-sm shadow-lg ${
        esError ? 'bg-terracota text-hueso' : 'bg-exito text-hueso'
      }`}
      role={esError ? 'alert' : 'status'}
    >
      <Icono aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1">{toast.mensaje}</p>
      <button
        aria-label="Cerrar notificación"
        className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cafe"
        onClick={() => onCerrar(toast.id)}
        type="button"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const siguienteId = useRef(0);
  const timers = useRef(new Map());

  const quitarToast = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((actuales) => actuales.filter((toast) => toast.id !== id));
  }, []);

  const mostrarToast = useCallback(
    (mensaje, tipo = 'error', duracion = 5000) => {
      const id = ++siguienteId.current;
      setToasts((actuales) => [...actuales, { id, mensaje, tipo }]);
      if (duracion > 0) {
        timers.current.set(id, setTimeout(() => quitarToast(id), duracion));
      }
      return id;
    },
    [quitarToast]
  );

  useEffect(
    () => () => {
      for (const timer of timers.current.values()) clearTimeout(timer);
      timers.current.clear();
    },
    []
  );

  return (
    <ToastContext.Provider value={{ mostrarToast, quitarToast }}>
      {children}
      <div aria-label="Notificaciones" className="pointer-events-none fixed right-4 top-4 z-[60] grid w-[min(24rem,calc(100vw-2rem))] gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onCerrar={quitarToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast debe utilizarse dentro de un ToastProvider.');
  }

  return context;
}