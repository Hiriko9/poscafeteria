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
import ComandaPanel from './components/comanda/ComandaPanel.jsx';
import PagoPanel from './components/pago/PagoPanel.jsx';
import TicketConfirmado from './components/pago/TicketConfirmado.jsx';
import { aplicarActualizacionServiceWorker } from './serviceWorkerRegistration.js';

function POSLayout() {
  const { estado, error: errorCaja } = useCajaContext();
  const comanda = useComandaContext();
  const { mostrarToast } = useToast();
  const [mostrarCierre, setMostrarCierre] = useState(false);
  const [pestanaMesas, setPestanaMesas] = useState('mesas');
  const [vistaColumnaComanda, setVistaColumnaComanda] = useState('COMANDA');
  const [ventaHistorial, setVentaHistorial] = useState(null);
  const [actualizacionDisponible, setActualizacionDisponible] = useState(false);
  const [orientacionVertical, setOrientacionVertical] = useState(false);
  const cajaCerrada = estado === 'CAJA_CERRADA';
  const cargando = estado === 'CARGANDO';
  const bloqueada = cajaCerrada || cargando || estado === 'ERROR';
  const hayComandaEnCurso =
    comanda.items.length > 0 && comanda.estado !== 'PAGO_EXITOSO';
  const bloquearActualizacion =
    hayComandaEnCurso || comanda.estado === 'PROCESANDO_PAGO';

  useEffect(() => {
    const avisarActualizacion = () => setActualizacionDisponible(true);
    window.addEventListener('pos:actualizacion-disponible', avisarActualizacion);
    return () => window.removeEventListener('pos:actualizacion-disponible', avisarActualizacion);
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const consulta = window.matchMedia('(orientation: portrait)');
    const actualizarOrientacion = (evento) => setOrientacionVertical(evento.matches);
    setOrientacionVertical(consulta.matches);
    consulta.addEventListener?.('change', actualizarOrientacion);
    return () => consulta.removeEventListener?.('change', actualizarOrientacion);
  }, []);

  useEffect(() => {
    if (comanda.estado === 'PAGO_EXITOSO' && pestanaMesas === 'mesas') {
      setVistaColumnaComanda('TICKET');
    }
  }, [comanda.estado, pestanaMesas]);

  const cambiarPestanaMesas = useCallback((pestana) => {
    setPestanaMesas(pestana);
    if (pestana === 'mesas') {
      setVentaHistorial(null);
      setVistaColumnaComanda('COMANDA');
    }
  }, []);
  const seleccionarVentaHistorial = useCallback((venta) => {
    setVentaHistorial(venta);
    setVistaColumnaComanda('HISTORIAL');
  }, []);
  const iniciarNuevaVenta = useCallback(() => {
    comanda.limpiar();
    setVistaColumnaComanda('COMANDA');
  }, [comanda.limpiar]);

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
      {orientacionVertical && (
        <aside
          className="fixed inset-x-0 top-16 z-10 bg-arena px-4 py-2 text-center text-sm text-cafe"
          role="status"
        >
          Gira la tablet a horizontal para una mejor experiencia
        </aside>
      )}
      {actualizacionDisponible && (
        <aside
          aria-label="Actualización disponible"
          className="fixed right-4 top-20 z-30 flex items-center gap-3 rounded-lg border border-arena bg-hueso p-3 text-sm shadow-lg"
          role="status"
        >
          <span>Hay una nueva versión</span>
          <button
            className="min-h-11 rounded-lg bg-cafe px-4 font-semibold text-hueso disabled:cursor-not-allowed disabled:opacity-50"
            disabled={bloquearActualizacion}
            onClick={aplicarActualizacionServiceWorker}
            type="button"
          >
            Actualizar
          </button>
        </aside>
      )}
      <div
        aria-hidden={bloqueada || undefined}
        className="col-span-12 grid min-h-0 grid-cols-12"
        inert={bloqueada}
      >
        <section
          aria-label="Mesas e historial"
          className="col-span-3 min-w-0 border-r border-arena"
        >
          <MesasPanel
            onCambiarPestana={cambiarPestanaMesas}
            onSeleccionarVenta={seleccionarVentaHistorial}
            pestanaControlada={pestanaMesas}
          />
        </section>
        <section aria-label="Catálogo" className="col-span-5 min-w-0 border-r border-arena">
          <CatalogoPanel />
        </section>
        <section aria-label="Comanda y pago" className="col-span-4 min-w-0">
          {vistaColumnaComanda === 'COMANDA' && (
            <ComandaPanel onCobrar={() => setVistaColumnaComanda('PAGO')} />
          )}
          {vistaColumnaComanda === 'PAGO' && (
            <PagoPanel
              onPagoExitoso={() => setVistaColumnaComanda('TICKET')}
              onVolver={() => setVistaColumnaComanda('COMANDA')}
            />
          )}
          {vistaColumnaComanda === 'TICKET' && comanda.ticket && (
            <TicketConfirmado onNuevaVenta={iniciarNuevaVenta} ticket={comanda.ticket} />
          )}
          {vistaColumnaComanda === 'HISTORIAL' && ventaHistorial && (
            <TicketConfirmado soloLectura ticket={ventaHistorial} />
          )}
        </section>
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