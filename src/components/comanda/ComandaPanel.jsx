import { useCallback, useMemo, useState } from 'react';
import { useComandaContext } from '../../context/ComandaContext.jsx';
import Button from '../ui/Button.jsx';
import ComandaItem from './ComandaItem.jsx';
import TotalesResumen from './TotalesResumen.jsx';

export default function ComandaPanel({ onCobrar }) {
  const comanda = useComandaContext();
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const itemsConSubtotal = useMemo(
    () =>
      comanda.items.map((item) => ({
        ...item,
        subtotalLinea: comanda.calcularSubtotalLinea(item)
      })),
    [comanda.calcularSubtotalLinea, comanda.items]
  );
  const cancelar = useCallback(() => {
    comanda.limpiar();
    setConfirmarCancelacion(false);
  }, [comanda.limpiar]);
  const mesaNombre =
    comanda.tipoPedido === 'PARA_LLEVAR'
      ? 'Para llevar'
      : comanda.mesaId
        ? `Mesa ${comanda.mesaId}`
        : 'Selecciona una mesa';

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4">
      <header>
        <h2 className="text-xl font-bold">Comanda</h2>
        <p className="text-sm text-cafe/75">{mesaNombre}</p>
      </header>
      {itemsConSubtotal.length === 0 ? (
        <p className="rounded-xl bg-arena p-6 text-center text-cafe/75" role="status">
          Toca un producto para agregarlo
        </p>
      ) : (
        <ul aria-label="Ítems de la comanda" className="grid gap-3">
          {itemsConSubtotal.map((item) => (
            <ComandaItem
              item={item}
              key={item.id ?? item.productoId}
              onCambiarCantidad={comanda.cambiarCantidad}
              onCambiarNota={comanda.cambiarNota}
              subtotal={item.subtotalLinea}
            />
          ))}
        </ul>
      )}
      <TotalesResumen totales={comanda.totales} />
      {confirmarCancelacion ? (
        <div className="grid gap-2 rounded-xl border border-terracota/30 bg-white p-3">
          <p role="alert">¿Deseas cancelar la comanda actual?</p>
          <div className="flex gap-2">
            <Button onClick={() => setConfirmarCancelacion(false)} variant="secundaria">
              Seguir con la comanda
            </Button>
            <Button className="bg-terracota" onClick={cancelar}>
              Confirmar cancelación
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          <Button disabled={!comanda.puedeCobrar} onClick={onCobrar}>
            Cobrar
          </Button>
          {comanda.items.length > 0 && (
            <Button onClick={() => setConfirmarCancelacion(true)} variant="secundaria">
              Cancelar comanda
            </Button>
          )}
        </div>
      )}
    </div>
  );
}