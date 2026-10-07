import { useCallback } from 'react';
import { formatearFecha, formatearSoles } from '../../utils/formatters.js';
import { METODOS_PAGO } from '../../utils/constants.js';
import Button from '../ui/Button.jsx';
import TotalesResumen from '../comanda/TotalesResumen.jsx';

const nombreMetodo = {
  [METODOS_PAGO.EFECTIVO]: 'Efectivo',
  [METODOS_PAGO.YAPE]: 'Yape',
  [METODOS_PAGO.TARJETA]: 'Tarjeta'
};

export default function TicketConfirmado({ ticket, soloLectura = false, onNuevaVenta }) {
  const nuevaVenta = useCallback(() => onNuevaVenta?.(), [onNuevaVenta]);
  const pago = ticket.pago ?? {};
  const mesa = ticket.tipoPedido === 'PARA_LLEVAR' || ticket.mesaId === 0
    ? 'Para llevar'
    : `Mesa ${ticket.mesaId}`;
  const totales = {
    subtotal: ticket.subtotal,
    igv: ticket.igv,
    total: ticket.total
  };

  return (
    <article aria-label={`Ticket ${ticket.codigoVenta}`} className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4">
      <header className="rounded-xl bg-cafe p-4 text-hueso">
        <h2 className="text-xl font-bold">Ticket de venta</h2>
        <p className="mt-1 font-mono text-lg">{ticket.codigoVenta}</p>
        <p className="text-sm">{formatearFecha(ticket.fechaHora)}</p>
        <p className="text-sm">{mesa}</p>
      </header>

      <ul aria-label="Detalle del ticket" className="grid gap-2">
        {(ticket.detalles ?? []).map((detalle, indice) => (
          <li className="rounded-lg border border-arena bg-white p-3" key={detalle.id ?? `${detalle.productoId}-${indice}`}>
            <div className="flex justify-between gap-3">
              <span className="font-medium">
                {detalle.nombreProducto ?? detalle.nombre ?? `Producto #${detalle.productoId}`} × {detalle.cantidad}
              </span>
              <span>{formatearSoles(detalle.subtotalLinea ?? 0)}</span>
            </div>
            {detalle.nota && <p className="mt-1 text-sm text-cafe/70">Nota: {detalle.nota}</p>}
          </li>
        ))}
      </ul>

      <TotalesResumen totales={totales} />
      <dl className="grid gap-2 rounded-xl bg-arena p-4">
        <div className="flex justify-between gap-3">
          <dt>Método de pago</dt>
          <dd className="font-semibold">{nombreMetodo[pago.metodo] ?? pago.metodo ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Monto recibido</dt>
          <dd>{formatearSoles(pago.montoRecibido ?? ticket.total)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Vuelto</dt>
          <dd>{formatearSoles(pago.vuelto ?? 0)}</dd>
        </div>
      </dl>

      {!soloLectura && (
        <Button className="mt-auto" onClick={nuevaVenta}>
          Nueva venta
        </Button>
      )}
    </article>
  );
}