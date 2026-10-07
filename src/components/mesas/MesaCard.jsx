export default function MesaCard({ mesa, seleccionada = false, deshabilitada = false, onSelect }) {
  const ocupada = mesa.estado === 'OCUPADA';
  const disabled = deshabilitada || ocupada;
  const nombre = mesa.id === 0 ? 'Para llevar' : `Mesa ${mesa.numero}`;
  const estado = ocupada ? 'Ocupada' : 'Libre';

  return (
    <button
      aria-disabled={disabled}
      aria-pressed={seleccionada}
      className={`flex min-h-20 min-w-11 flex-col items-start justify-center rounded-xl border-2 bg-white px-3 py-2 text-left transition ${
        seleccionada ? 'border-cafe ring-2 ring-cafe/20' : 'border-arena'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-cafe'}`}
      disabled={disabled}
      onClick={() => onSelect?.(mesa)}
      type="button"
    >
      <span className="font-semibold text-cafe">{nombre}</span>
      {mesa.id !== 0 && (
        <span className="text-xs text-cafe/75">Capacidad: {mesa.capacidad ?? '—'}</span>
      )}
      <span className={`text-xs font-semibold ${ocupada ? 'text-terracota' : 'text-exito'}`}>
        {estado}
      </span>
    </button>
  );
}