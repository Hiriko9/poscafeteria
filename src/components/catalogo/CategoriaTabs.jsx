import { useCallback } from 'react';
import { CATEGORIAS_PRODUCTO } from '../../utils/constants.js';

const opciones = [
  { id: CATEGORIAS_PRODUCTO.CALIENTES, etiqueta: 'Bebidas calientes' },
  { id: CATEGORIAS_PRODUCTO.FRIAS, etiqueta: 'Bebidas frías' },
  { id: CATEGORIAS_PRODUCTO.REPOSTERIA, etiqueta: 'Repostería' }
];

export default function CategoriaTabs({ categoria, onSelect }) {
  const manejarTeclas = useCallback(
    (event) => {
      const indiceActual = opciones.findIndex((opcion) => opcion.id === categoria);
      let indiceSiguiente;

      if (event.key === 'ArrowRight') indiceSiguiente = (indiceActual + 1) % opciones.length;
      else if (event.key === 'ArrowLeft') {
        indiceSiguiente = (indiceActual - 1 + opciones.length) % opciones.length;
      } else if (event.key === 'Home') indiceSiguiente = 0;
      else if (event.key === 'End') indiceSiguiente = opciones.length - 1;
      else return;

      event.preventDefault();
      const siguiente = opciones[indiceSiguiente];
      onSelect(siguiente.id);
      document.getElementById(`categoria-${siguiente.id.toLowerCase()}`)?.focus();
    },
    [categoria, onSelect]
  );

  return (
    <div aria-label="Categorías del catálogo" className="flex gap-2 overflow-x-auto" role="tablist">
      {opciones.map((opcion) => (
        <button
          aria-controls="panel-catalogo"
          aria-selected={categoria === opcion.id}
          className={`min-h-11 shrink-0 rounded-lg px-3 font-medium ${
            categoria === opcion.id ? 'bg-cafe text-hueso' : 'bg-arena text-cafe'
          }`}
          id={`categoria-${opcion.id.toLowerCase()}`}
          key={opcion.id}
          onClick={() => onSelect(opcion.id)}
          onKeyDown={manejarTeclas}
          role="tab"
          tabIndex={categoria === opcion.id ? 0 : -1}
          type="button"
        >
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  );
}