import { useCallback, useMemo, useState } from 'react';
import { useComandaContext } from '../../context/ComandaContext.jsx';
import { useMesas } from '../../hooks/useMesas.js';
import { MESA_VIRTUAL_ID, TIPOS_PEDIDO } from '../../utils/constants.js';
import MesaCard from './MesaCard.jsx';

export default function MesasPanel() {
  const [pestana, setPestana] = useState('mesas');
  const { mesas, estado, error } = useMesas();
  const comanda = useComandaContext();

  const mesasFisicas = useMemo(() => mesas.filter((mesa) => mesa.id !== MESA_VIRTUAL_ID), [mesas]);
  const mesaParaLlevar = useMemo(
    () => mesas.find((mesa) => mesa.id === MESA_VIRTUAL_ID),
    [mesas]
  );
  const seleccionarMesa = useCallback((mesa) => comanda.seleccionarMesa(mesa), [
    comanda.seleccionarMesa
  ]);
  const seleccionarTipo = useCallback(
    (tipoPedido) => comanda.cambiarTipoPedido(tipoPedido),
    [comanda.cambiarTipoPedido]
  );
  const manejarTeclasPestanas = useCallback(
    (event) => {
      const pestanas = ['mesas', 'historial'];
      const indiceActual = pestanas.indexOf(pestana);
      let indiceSiguiente;

      if (event.key === 'ArrowRight') indiceSiguiente = (indiceActual + 1) % pestanas.length;
      else if (event.key === 'ArrowLeft') {
        indiceSiguiente = (indiceActual - 1 + pestanas.length) % pestanas.length;
      } else if (event.key === 'Home') indiceSiguiente = 0;
      else if (event.key === 'End') indiceSiguiente = pestanas.length - 1;
      else return;

      event.preventDefault();
      const siguiente = pestanas[indiceSiguiente];
      setPestana(siguiente);
      document.getElementById(`tab-${siguiente}`)?.focus();
    },
    [pestana]
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4">
      <div aria-label="Secciones de la columna" className="flex border-b border-arena" role="tablist">
        <button
          aria-controls="panel-mesas"
          aria-selected={pestana === 'mesas'}
          className={`min-h-11 border-b-2 px-4 font-semibold ${
            pestana === 'mesas' ? 'border-cafe text-cafe' : 'border-transparent text-cafe/60'
          }`}
          id="tab-mesas"
          onClick={() => setPestana('mesas')}
          onKeyDown={manejarTeclasPestanas}
          role="tab"
          tabIndex={pestana === 'mesas' ? 0 : -1}
          type="button"
        >
          Mesas
        </button>
        <button
          aria-controls="panel-historial"
          aria-selected={pestana === 'historial'}
          className={`min-h-11 border-b-2 px-4 font-semibold ${
            pestana === 'historial' ? 'border-cafe text-cafe' : 'border-transparent text-cafe/60'
          }`}
          id="tab-historial"
          onClick={() => setPestana('historial')}
          onKeyDown={manejarTeclasPestanas}
          role="tab"
          tabIndex={pestana === 'historial' ? 0 : -1}
          type="button"
        >
          Historial
        </button>
      </div>

      {pestana === 'historial' ? (
        <div aria-labelledby="tab-historial" id="panel-historial" role="tabpanel">
          <p>Historial: disponible en la siguiente fase</p>
        </div>
      ) : (
        <div aria-labelledby="tab-mesas" className="flex flex-col gap-4" id="panel-mesas" role="tabpanel">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Tipo de pedido</legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                aria-pressed={comanda.tipoPedido === TIPOS_PEDIDO.COMER_AQUI}
                className={`min-h-11 rounded-lg border px-3 font-medium ${
                  comanda.tipoPedido === TIPOS_PEDIDO.COMER_AQUI
                    ? 'border-cafe bg-cafe text-hueso'
                    : 'border-arena bg-white text-cafe'
                }`}
                onClick={() => seleccionarTipo(TIPOS_PEDIDO.COMER_AQUI)}
                type="button"
              >
                Comer aquí
              </button>
              <button
                aria-pressed={comanda.tipoPedido === TIPOS_PEDIDO.PARA_LLEVAR}
                className={`min-h-11 rounded-lg border px-3 font-medium ${
                  comanda.tipoPedido === TIPOS_PEDIDO.PARA_LLEVAR
                    ? 'border-cafe bg-cafe text-hueso'
                    : 'border-arena bg-white text-cafe'
                }`}
                onClick={() => seleccionarTipo(TIPOS_PEDIDO.PARA_LLEVAR)}
                type="button"
              >
                Para llevar
              </button>
            </div>
          </fieldset>

          {estado === 'CARGANDO' && (
            <p className="py-4 text-center text-sm" role="status">Cargando mesas…</p>
          )}
          {estado === 'ERROR' && <p className="text-terracota" role="alert">{error}</p>}
          {estado === 'LISTO' && (
            <>
              <div aria-label="Mesas físicas" className="grid grid-cols-3 gap-2">
                {mesasFisicas.map((mesa) => (
                  <MesaCard
                    deshabilitada={comanda.tipoPedido !== TIPOS_PEDIDO.COMER_AQUI}
                    key={mesa.id}
                    mesa={mesa}
                    onSelect={seleccionarMesa}
                    seleccionada={comanda.mesaId === mesa.id}
                  />
                ))}
              </div>
              {mesaParaLlevar && (
                <MesaCard
                  mesa={mesaParaLlevar}
                  onSelect={seleccionarMesa}
                  seleccionada={comanda.mesaId === MESA_VIRTUAL_ID}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}