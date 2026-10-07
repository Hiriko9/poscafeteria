import { useCallback, useMemo } from 'react';
import { useHistorial } from '../../hooks/useHistorial.js';
import HistorialItem from './HistorialItem.jsx';

function claveDia(fechaHora) {
  const fecha = new Date(fechaHora);
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Lima'
  }).format(fecha);
}

function etiquetaDia(fechaHora) {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'full',
    timeZone: 'America/Lima'
  }).format(new Date(fechaHora));
}

export default function HistorialPanel({ onSeleccionarVenta }) {
  const { ventas, estado, error } = useHistorial();
  const grupos = useMemo(() => {
    const porDia = new Map();
    for (const venta of ventas) {
      const clave = claveDia(venta.fechaHora);
      const grupo = porDia.get(clave) ?? { etiqueta: etiquetaDia(venta.fechaHora), ventas: [] };
      grupo.ventas.push(venta);
      porDia.set(clave, grupo);
    }
    return [...porDia.entries()].map(([clave, grupo]) => ({ clave, ...grupo }));
  }, [ventas]);
  const seleccionar = useCallback((venta) => onSeleccionarVenta?.(venta), [onSeleccionarVenta]);

  if (estado === 'CARGANDO') {
    return <p className="py-4 text-center" role="status">Cargando historial…</p>;
  }
  if (estado === 'ERROR') {
    return <p className="py-4 text-terracota" role="alert">{error}</p>;
  }
  if (ventas.length === 0) {
    return <p className="py-4 text-center text-cafe/70" role="status">Todavía no hay ventas registradas.</p>;
  }

  return (
    <div aria-label="Ventas agrupadas por día" className="grid gap-4">
      {grupos.map((grupo) => (
        <section aria-label={grupo.etiqueta} key={grupo.clave}>
          <h2 className="mb-2 text-sm font-semibold capitalize">{grupo.etiqueta}</h2>
          <ul className="grid gap-2">
            {grupo.ventas.map((venta) => (
              <li key={venta.id}>
                <HistorialItem onSelect={seleccionar} venta={venta} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}