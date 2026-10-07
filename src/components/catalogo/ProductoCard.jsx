import { memo, useState } from 'react';
import { Coffee } from 'lucide-react';
import { formatearSoles } from '../../utils/formatters.js';

function ProductoCard({ producto, onAgregar }) {
  const [imagenFallida, setImagenFallida] = useState(false);

  return (
    <button
      aria-label={`Agregar ${producto.nombre}, ${formatearSoles(producto.precio)}`}
      className="flex min-h-44 min-w-11 flex-col overflow-hidden rounded-xl border border-arena bg-white text-left transition hover:border-cafe focus-visible:outline focus-visible:outline-2 focus-visible:outline-cafe"
      onClick={() => onAgregar(producto)}
      type="button"
    >
      <span className="grid aspect-square w-full place-items-center overflow-hidden bg-arena">
        {imagenFallida || !producto.imagen ? (
          <Coffee
            aria-label={`Imagen no disponible para ${producto.nombre}`}
            className="h-12 w-12 text-cafe/60"
            role="img"
          />
        ) : (
          <img
            alt={producto.nombre}
            className="h-full w-full object-cover"
            decoding="async"
            height="256"
            loading="lazy"
            onError={() => setImagenFallida(true)}
            src={producto.imagen}
            width="256"
          />
        )}
      </span>
      <span className="flex flex-1 flex-col justify-between gap-1 p-3">
        <span className="font-semibold text-cafe">{producto.nombre}</span>
        <span className="text-sm font-medium text-cafe/80">{formatearSoles(producto.precio)}</span>
      </span>
    </button>
  );
}

export default memo(ProductoCard);