import { useCallback, useEffect, useRef, useState } from 'react';
import { CajaProvider, useCajaContext } from './context/CajaContext.jsx';
import { ComandaProvider, useComandaContext } from './context/ComandaContext.jsx';
import { seedDatabase } from './db/seed.js';
import { useToast, ToastProvider } from './components/ui/Toast.jsx';
import AperturaCajaModal from './components/modals/AperturaCajaModal.jsx';
import CierreCajaZModal from './components/modals/CierreCajaZModal.jsx';
import TopBar from './components/layout/TopBar.jsx';
import MesasPanel from './components/mesas/MesasPanel.jsx';
import CatalogoPanel from './components/catalogo/CatalogoPanel.jsx';

function POSLayout() {
  const { estado, error: errorCaja } = useCajaContext();
  const comanda = useComandaContext();
  const { mostrarToast } = useToast();
  const [mostrarCierre, setMostrarCierre] = useState(false);
  const cajaCerrada = estado === 'CAJA_CERRADA';
  const cargando = estado === 'CARGANDO';
  const bloqueada = cajaCerrada || cargando || estado === 'ERROR';

  const solicitarCierre = useCallback(() => {
    if (comanda.items.length > 0 && comanda.estado !== 'PAGO_EXITOSO') {
      mostrarToast('Hay una comanda en curso. Cóbrala o cancélala antes de cerrar la caja.', 'error');
      return;
    }

    setMostrarCierre(true);
  }, [comanda.estado, comanda.items.length, mostrarToast]);

  return (
    <main className="grid h-screen min-h-0 grid-cols-12 grid-rows-[4rem_minmax(0,1fr)] overflow-hidden bg-hueso text-cafe">
      <TopBar onCerrarCaja={solicitarCierre} />
      <div
        aria-hidden={bloqueada || undefined}
        className="col-span-12 grid min-h-0 grid-cols-12"
        inert={bloqueada}
      >
        <section
          aria-label="Mesas e historial"
          className="col-span-3 min-w-0 border-r border-arena"
        >
          <MesasPanel />
        </section>
        <section aria-label="Catálogo" className="col-span-5 min-w-0 border-r border-arena">
          <CatalogoPanel />
        </section>
        <section aria-label="Comanda y pago" className="col-span-4 min-w-0" />
      </div>
      {cargando && (
        <div
          className="fixed inset-0 z-20 grid place-items-center bg-hueso/80"
          role="status"
          aria-live="polite"
        >
          <p className="rounded-lg bg-hueso px-5 py-4 font-semibold text-cafe shadow">
            Cargando sesión de caja…
          </p>
        </div>
      )}
      {estado === 'ERROR' && (
        <div className="fixed inset-x-4 top-20 z-30 rounded-lg bg-terracota p-4 text-hueso" role="alert">
          {errorCaja || 'No se pudo cargar la sesión de caja.'}
        </div>
      )}
      {cajaCerrada && <AperturaCajaModal />}
      {mostrarCierre && <CierreCajaZModal onClose={() => setMostrarCierre(false)} />}
    </main>
  );
}

function ArranqueApp() {
  const [estadoSeed, setEstadoSeed] = useState('CARGANDO');
  const [errorSeed, setErrorSeed] = useState(null);
  const { mostrarToast } = useToast();
  const avisoMostrado = useRef(false);
  const seedEnCurso = useRef(null);

  useEffect(() => {
    let activo = true;
    if (!seedEnCurso.current) seedEnCurso.current = seedDatabase();

    seedEnCurso.current
      .then(() => {
        if (activo) setEstadoSeed('LISTO');
      })
      .catch((error) => {
        if (!activo) return;
        const mensaje = `No se pudo preparar la base local: ${error.message}`;
        setEstadoSeed('ERROR');
        setErrorSeed(mensaje);
        if (!avisoMostrado.current) {
          mostrarToast(mensaje, 'error', 0);
          avisoMostrado.current = true;
        }
      });

    return () => {
      activo = false;
    };
  }, [mostrarToast]);

  if (estadoSeed === 'CARGANDO') {
    return (
      <div className="grid h-screen place-items-center bg-hueso text-cafe" role="status">
        <p className="font-semibold">Preparando Café POS…</p>
      </div>
    );
  }

  if (estadoSeed === 'ERROR') {
    return (
      <div className="grid h-screen place-items-center bg-hueso p-6 text-terracota" role="alert">
        {errorSeed}
      </div>
    );
  }

  return (
    <CajaProvider>
      <ComandaProvider>
        <POSLayout />
      </ComandaProvider>
    </CajaProvider>
  );
}

function App() {
  return (
    <ToastProvider>
      <ArranqueApp />
    </ToastProvider>
  );
}

export default App;