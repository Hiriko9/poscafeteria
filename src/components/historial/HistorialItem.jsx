import { formatearFecha, formatearSoles } from '../../utils/formatters.js';
import { METODOS_PAGO } from '../../utils/constants.js';

const metodoEtiqueta = {
  [METODOS_PAGO.EFECTIVO]: 'Efectivo',
  [METODOS_PAGO.YAPE]: 'Yape',
  [METODOS_PAGO.TARJETA]: 'Tarjeta'
};

export default function HistorialItem({ venta, onSelect }) {
  const mesa = venta.tipoPedido === 'PARA_LLEVAR' || venta.mesaId === 0
    ? 'Para llevar'
    : `Mesa ${venta.mesaId}`;

  return (
    <button
      aria-label={`Ver venta ${venta.codigoVenta}`}
      className="grid min-h-11 gap-1 rounded-lg border border-arena bg-white p-3 text-left hover:border-cafe"
      onClick={() => onSelect(venta)}
      type="button"
    >
      <span className="flex justify-between gap-2 font-semibold">
        <span className="font-mono">{venta.codigoVenta}</span>
        <span>{formatearSoles(venta.total)}</span>
      </span>
      <span className="text-sm text-cafe/75">
        {formatearFecha(venta.fechaHora)} · {mesa} · {metodoEtiqueta[venta.pago?.metodo] ?? 'Sin método'}
      </span>
    </button>
  );
}