import { useMemo, useState } from 'react';
import { useComandaContext } from '../../context/ComandaContext.jsx';
import { convertirSolesACentimos } from '../../utils/convertirSolesACentimos.js';
import { formatearSoles } from '../../utils/formatters.js';
import { METODOS_PAGO } from '../../utils/constants.js';
import Button from '../ui/Button.jsx';
import { useToast } from '../ui/Toast.jsx';

const metodos = [
  { id: METODOS_PAGO.EFECTIVO, nombre: 'Efectivo' },
  { id: METODOS_PAGO.YAPE, nombre: 'Yape' },
  { id: METODOS_PAGO.TARJETA, nombre: 'Tarjeta' }
];
const billetes = [
  { nombre: 'S/ 10', valor: '10.00' },
  { nombre: 'S/ 20', valor: '20.00' },
  { nombre: 'S/ 50', valor: '50.00' },
  { nombre: 'S/ 100', valor: '100.00' }
];

export default function PagoPanel({ onVolver, onPagoExitoso }) {
  const comanda = useComandaContext();
  const { mostrarToast } = useToast();
  const [metodo, setMetodo] = useState(METODOS_PAGO.EFECTIVO);
  const [montoTexto, setMontoTexto] = useState('');
  const [errorMonto, setErrorMonto] = useState('');
  const [procesando, setProcesando] = useState(false);

  const estadoMonto = useMemo(() => {
    if (metodo !== METODOS_PAGO.EFECTIVO) {
      return { recibido: comanda.totales.total, error: '', insuficiente: false };
    }
    if (!montoTexto.trim()) return { recibido: null, error: '', insuficiente: false };
    try {
      const recibido = convertirSolesACentimos(montoTexto);
      return {
        recibido,
        error: '',
        insuficiente: recibido < comanda.totales.total
      };
    } catch (error) {
      return { recibido: null, error: error.message, insuficiente: false };
    }
  }, [comanda.totales.total, metodo, montoTexto]);

  const cambiarMonto = (valor) => {
    setMontoTexto(valor);
    setErrorMonto('');
  };

  async function confirmar(event) {
    event.preventDefault();
    if (procesando || estadoMonto.recibido === null || estadoMonto.insuficiente || estadoMonto.error) {
      if (estadoMonto.error) setErrorMonto(estadoMonto.error);
      return;
    }

    setProcesando(true);
    const respuesta = await comanda.confirmarPago(metodo, estadoMonto.recibido);
    setProcesando(false);
    if (respuesta.error) {
      mostrarToast(respuesta.error, 'error');
      return;
    }
    onPagoExitoso?.(respuesta.ticket);
  }

  const vuelto =
    metodo === METODOS_PAGO.EFECTIVO && estadoMonto.recibido !== null
      ? comanda.vuelto(estadoMonto.recibido)
      : 0;
  const noPuedeConfirmar =
    !comanda.puedeCobrar ||
    procesando ||
    comanda.estado === 'PROCESANDO_PAGO' ||
    estadoMonto.recibido === null ||
    Boolean(estadoMonto.error) ||
    estadoMonto.insuficiente;

  return (
    <form className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4" onSubmit={confirmar}>
      <header>
        <h2 className="text-xl font-bold">Pago</h2>
        <p className="text-sm text-cafe/75">Total: {formatearSoles(comanda.totales.total)}</p>
      </header>

      <fieldset className="grid gap-2">
        <legend className="mb-1 font-semibold">Método de pago</legend>
        <div className="grid grid-cols-3 gap-2">
          {metodos.map((opcion) => (
            <button
              aria-pressed={metodo === opcion.id}
              className={`min-h-11 rounded-lg border px-2 font-medium ${
                metodo === opcion.id ? 'border-cafe bg-cafe text-hueso' : 'border-arena bg-white'
              }`}
              key={opcion.id}
              onClick={() => {
                setMetodo(opcion.id);
                setErrorMonto('');
              }}
              type="button"
            >
              {opcion.nombre}
            </button>
          ))}
        </div>
      </fieldset>

      {metodo === METODOS_PAGO.EFECTIVO && (
        <>
          <label className="grid gap-2 font-medium" htmlFor="monto-recibido">
            Monto recibido (S/)
            <input
              aria-invalid={Boolean(errorMonto || estadoMonto.error || estadoMonto.insuficiente)}
              className="min-h-11 rounded-lg border border-arena bg-white px-3"
              id="monto-recibido"
              inputMode="decimal"
              onChange={(event) => cambiarMonto(event.target.value)}
              placeholder="0.00"
              type="text"
              value={montoTexto}
            />
          </label>
          <div aria-label="Montos rápidos" className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                cambiarMonto((comanda.totales.total / 100).toFixed(2))
              }
              type="button"
              variant="secundaria"
            >
              Exacto
            </Button>
            {billetes.map((billete) => (
              <Button
                key={billete.valor}
                onClick={() => cambiarMonto(billete.valor)}
                type="button"
                variant="secundaria"
              >
                {billete.nombre}
              </Button>
            ))}
          </div>
          {estadoMonto.insuficiente && (
            <p className="font-semibold text-terracota" role="alert">Monto insuficiente</p>
          )}
          {(errorMonto || estadoMonto.error) && (
            <p className="text-terracota" role="alert">{errorMonto || estadoMonto.error}</p>
          )}
          <p className="rounded-lg bg-arena p-3" role="status">
            Vuelto: {formatearSoles(vuelto)}
          </p>
        </>
      )}

      <div className="mt-auto grid gap-2">
        <Button disabled={noPuedeConfirmar} loading={procesando || comanda.estado === 'PROCESANDO_PAGO'} type="submit">
          Confirmar pago
        </Button>
        <Button onClick={onVolver} type="button" variant="secundaria">
          Volver a la comanda
        </Button>
      </div>
    </form>
  );
}