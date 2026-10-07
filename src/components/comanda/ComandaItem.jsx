import { useCallback } from 'react';
import { formatearSoles } from '../../utils/formatters.js';

export default function ComandaItem({ item, subtotal, onCambiarCantidad, onCambiarNota }) {
  const productoId = item.id ?? item.productoId;
  const restar = useCallback(() => onCambiarCantidad(productoId, item.cantidad - 1), [
    item.cantidad,
    onCambiarCantidad,
    productoId
  ]);
  const sumar = useCallback(() => onCambiarCantidad(productoId, item.cantidad + 1), [
    item.cantidad,
    onCambiarCantidad,
    productoId
  ]);
  const quitar = useCallback(() => onCambiarCantidad(productoId, 0), [
    onCambiarCantidad,
    productoId
  ]);

  return (
    <li className="grid gap-3 rounded-xl border border-arena bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{item.nombre}</h3>
          <p className="text-sm text-cafe/70">
            Unitario: {formatearSoles(item.precioUnitario ?? item.precio)}
          </p>
        </div>
        <strong className="shrink-0">{formatearSoles(subtotal)}</strong>
      </div>
      <div className="flex items-center gap-2">
        <button
          aria-label={`Restar ${item.nombre}`}
          className="min-h-11 min-w-11 rounded-lg border border-arena text-lg font-semibold"
          onClick={restar}
          type="button"
        >
          −
        </button>
        <output aria-label={`Cantidad de ${item.nombre}`} className="min-w-8 text-center font-semibold">
          {item.cantidad}
        </output>
        <button
          aria-label={`Sumar ${item.nombre}`}
          className="min-h-11 min-w-11 rounded-lg border border-arena text-lg font-semibold"
          onClick={sumar}
          type="button"
        >
          +
        </button>
        <button
          aria-label={`Quitar ${item.nombre}`}
          className="min-h-11 rounded-lg px-3 text-sm font-medium text-terracota"
          onClick={quitar}
          type="button"
        >
          Quitar
        </button>
      </div>
      <label className="grid gap-1 text-sm font-medium" htmlFor={`nota-${productoId}`}>
        Nota de preparación
        <input
          className="min-h-11 rounded-lg border border-arena px-3"
          id={`nota-${productoId}`}
          maxLength={80}
          onChange={(event) => onCambiarNota(productoId, event.target.value)}
          placeholder="Ej. Sin azúcar"
          type="text"
          value={item.nota ?? ''}
        />
      </label>
    </li>
  );
}