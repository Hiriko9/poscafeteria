import { Coffee, Wifi, WifiOff } from 'lucide-react';
import { useCajaContext } from '../../context/CajaContext.jsx';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import Button from '../ui/Button.jsx';

function TopBar({ onCerrarCaja }) {
  const { estado } = useCajaContext();
  const online = useOnlineStatus();
  const cajaAbierta = estado === 'CAJA_ABIERTA';

  return (
    <header className="col-span-12 flex min-w-0 items-center justify-between gap-4 bg-cafe px-5 py-2 text-hueso">
      <h1 className="flex items-center gap-2 text-xl font-semibold">
        <Coffee aria-hidden="true" className="h-6 w-6" />
        Café POS
      </h1>
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold ${
            cajaAbierta ? 'bg-exito text-white' : 'bg-terracota text-white'
          }`}
          role="status"
        >
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />
          {estado === 'CARGANDO' ? 'CARGANDO' : cajaAbierta ? 'ABIERTA' : 'CERRADA'}
        </span>
        <span className="inline-flex min-h-11 items-center gap-2 px-2 text-sm" role="status">
          {online ? (
            <Wifi aria-hidden="true" className="h-5 w-5" />
          ) : (
            <WifiOff aria-hidden="true" className="h-5 w-5" />
          )}
          <span>{online ? 'En línea' : 'Sin conexión (modo offline)'}</span>
        </span>
        <Button
          aria-label="Abrir cierre Z"
          disabled={!cajaAbierta}
          onClick={onCerrarCaja}
          variant="secundaria"
        >
          Cierre Z
        </Button>
      </div>
    </header>
  );
}

export default TopBar;