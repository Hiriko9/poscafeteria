import { useEffect, useMemo, useState } from 'react';
import { cerrarCajaZ as calcularCierre } from '../../domain/usecases/cerrarCajaZ.js';
import { useCajaContext } from '../../context/CajaContext.jsx';
import { useComandaContext } from '../../context/ComandaContext.jsx';
import { convertirSolesACentimos } from '../../utils/convertirSolesACentimos.js';
import { formatearSoles } from '../../utils/formatters.js';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import { useToast } from '../ui/Toast.jsx';

function CierreCajaZModal({ onClose }) {
  const { sesion, cargarResumenCierre, cerrarCajaZ } = useCajaContext();
  const comanda = useComandaContext();
  const { mostrarToast } = useToast();
  const [resumen, setResumen] = useState(null);
  const [efectivo, setEfectivo] = useState('');
  const [tarjetas, setTarjetas] = useState('');
  const [error, setError] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const hayComandaEnCurso = comanda.items.length > 0 && comanda.estado !== 'PAGO_EXITOSO';

  useEffect(() => {
    let activo = true;
    cargarResumenCierre()
      .then((resultado) => {
        if (activo) setResumen(resultado);
      })
      .catch((errorCarga) => {
        if (activo) {
          setError(errorCarga.message);
          mostrarToast(errorCarga.message, 'error');
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [cargarResumenCierre, mostrarToast]);

  const cierrePreview = useMemo(() => {
    if (!resumen || efectivo === '') return null;

    try {
      return calcularCierre({
        montoInicial: resumen.montoInicial,
        ventasEfectivo: resumen.ventasEfectivo,
        montoCierreEfectivo: convertirSolesACentimos(efectivo),
        montoCierreTarjetas: tarjetas === '' ? 0 : convertirSolesACentimos(tarjetas)
      });
    } catch {
      return null;
    }
  }, [efectivo, resumen, tarjetas]);

  async function manejarCierre() {
    if (hayComandaEnCurso) {
      const mensaje = 'Hay una comanda en curso. Cóbrala o cancélala antes de cerrar la caja.';
      setError(mensaje);
      mostrarToast(mensaje, 'error');
      return;
    }

    if (!confirmando) {
      setConfirmando(true);
      return;
    }

    let montoCierreEfectivo;
    let montoCierreTarjetas;
    try {
      montoCierreEfectivo = convertirSolesACentimos(efectivo);
      montoCierreTarjetas = tarjetas === '' ? 0 : convertirSolesACentimos(tarjetas);
    } catch (errorMonto) {
      setError(errorMonto.message);
      return;
    }

    setGuardando(true);
    setError('');
    try {
      await cerrarCajaZ({ montoCierreEfectivo, montoCierreTarjetas });
      mostrarToast('La caja se cerró correctamente.', 'success');
      onClose();
    } catch (errorCierre) {
      setError(errorCierre.message);
      mostrarToast(errorCierre.message, 'error');
      setConfirmando(false);
    } finally {
      setGuardando(false);
    }
  }

  const etiquetaDiferencia =
    cierrePreview?.diferencia > 0
      ? 'Sobrante'
      : cierrePreview?.diferencia < 0
        ? 'Faltante'
        : cierrePreview
          ? 'Cuadra'
          : 'Diferencia';
  const colorDiferencia =
    cierrePreview?.diferencia > 0
      ? 'text-exito'
      : cierrePreview?.diferencia < 0
        ? 'text-terracota'
        : 'text-cafe';

  return (
    <Modal
      onClose={onClose}
      title="Cierre de caja Z"
      titleId="cierre-caja-titulo"
      className="max-w-xl"
    >
      <div aria-busy={cargando} className="grid gap-4">
        {cargando ? (
          <p role="status">Cargando arqueo de caja…</p>
        ) : (
          <>
            <dl className="grid gap-3 rounded-lg bg-arena p-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm">Monto inicial</dt>
                <dd className="font-semibold">
                  {formatearSoles(resumen?.montoInicial ?? sesion?.montoInicial ?? 0)}
                </dd>
              </div>
              <div>
                <dt className="text-sm">Ventas en efectivo</dt>
                <dd className="font-semibold">{formatearSoles(resumen?.ventasEfectivo ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-sm">Efectivo esperado</dt>
                <dd className="font-semibold">{formatearSoles(resumen?.efectivoEsperado ?? 0)}</dd>
              </div>
            </dl>
            <label className="grid gap-2 font-medium" htmlFor="efectivo-contado">
              Efectivo contado (S/)
              <input
                aria-invalid={Boolean(error)}
                className="min-h-11 rounded-lg border border-arena bg-white px-3 text-cafe outline-none focus:border-cafe focus:ring-2 focus:ring-cafe/20"
                id="efectivo-contado"
                inputMode="decimal"
                onChange={(evento) => {
                  setEfectivo(evento.target.value);
                  setConfirmando(false);
                  setError('');
                }}
                placeholder="0.00"
                type="text"
                value={efectivo}
              />
            </label>
            <label className="grid gap-2 font-medium" htmlFor="tarjetas-contadas">
              Tarjetas contadas (S/)
              <input
                className="min-h-11 rounded-lg border border-arena bg-white px-3 text-cafe outline-none focus:border-cafe focus:ring-2 focus:ring-cafe/20"
                id="tarjetas-contadas"
                inputMode="decimal"
                onChange={(evento) => {
                  setTarjetas(evento.target.value);
                  setConfirmando(false);
                  setError('');
                }}
                placeholder="0.00"
                type="text"
                value={tarjetas}
              />
            </label>
            {cierrePreview && (
              <p className={`rounded-lg bg-arena p-3 font-semibold ${colorDiferencia}`} role="status">
                {etiquetaDiferencia}: {formatearSoles(Math.abs(cierrePreview.diferencia))}
                {cierrePreview.diferencia < 0 ? ' por debajo del efectivo esperado' : ''}
              </p>
            )}
          </>
        )}
        {hayComandaEnCurso && (
          <p className="text-sm font-medium text-terracota" role="alert">
            Hay una comanda en curso. Cóbrala o cancélala antes de cerrar la caja.
          </p>
        )}
        {error && !hayComandaEnCurso && (
          <p className="text-sm font-medium text-terracota" role="alert">
            {error}
          </p>
        )}
        {confirmando && !hayComandaEnCurso && (
          <p className="rounded-lg border border-cafe/20 p-3 text-sm" role="alert">
            ¿Confirmas el cierre de esta sesión de caja? Esta acción no se puede deshacer.
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <Button onClick={onClose} variant="secundaria">
            Cancelar
          </Button>
          {confirmando && (
            <Button
              disabled={cargando || !resumen || efectivo === '' || hayComandaEnCurso}
              loading={guardando}
              onClick={() => void manejarCierre()}
            >
              Confirmar cierre
            </Button>
          )}
          {!confirmando && (
            <Button
              disabled={cargando || !resumen || efectivo === '' || hayComandaEnCurso}
              onClick={() => void manejarCierre()}
            >
              Cerrar caja
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default CierreCajaZModal;