import { formatearSoles } from '../../utils/formatters.js';

export default function TotalesResumen({ totales }) {
  return (
    <dl
      aria-label="Resumen de totales"
      aria-live="polite"
      className="grid gap-2 rounded-xl bg-arena p-4"
    >
      <div className="flex justify-between gap-4">
        <dt>Subtotal</dt>
        <dd>{formatearSoles(totales.subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt>IGV (18%)</dt>
        <dd>{formatearSoles(totales.igv)}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-cafe/20 pt-2 text-lg font-bold">
        <dt>Total</dt>
        <dd>{formatearSoles(totales.total)}</dd>
      </div>
    </dl>
  );
}