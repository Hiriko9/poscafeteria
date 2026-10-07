import { useState } from 'react';
import { abrirCaja as construirApertura, validarMontoInicial } from '../../domain/usecases/abrirCaja.js';
import { convertirSolesACentimos } from '../../utils/convertirSolesACentimos.js';
import { useCajaContext } from '../../context/CajaContext.jsx';
import { useToast } from '../ui/Toast.jsx';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';

function AperturaCajaModal() {
  const { abrirCaja } = useCajaContext();
  const { mostrarToast } = useToast();
  const [monto, setMonto] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError('');

    let montoInicial;
    try {
      montoInicial = convertirSolesACentimos(monto);
    } catch (errorMonto) {
      setError(errorMonto.message);
      return;
    }

    const validacion = validarMontoInicial(montoInicial);
    if (!validacion.valido) {
      setError(validacion.error);
      return;
    }

    setGuardando(true);
    try {
      construirApertura({ montoInicial });
      await abrirCaja(montoInicial);
      mostrarToast('La caja se abrió correctamente.', 'success');
    } catch (errorApertura) {
      const mensaje = errorApertura.message || 'No se pudo abrir la caja.';
      setError(mensaje);
      mostrarToast(mensaje, 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      closeOnEscape={false}
      closeOnOutsideClick={false}
      title="Apertura de caja"
      titleId="apertura-caja-titulo"
    >
      <p className="mb-5 text-sm">Ingresa el monto inicial de efectivo para iniciar el turno.</p>
      <form className="grid gap-4" noValidate onSubmit={manejarEnvio}>
        <label className="grid gap-2 font-medium" htmlFor="monto-inicial">
          Monto inicial (S/)
          <input
            aria-describedby={error ? 'monto-inicial-error' : undefined}
            aria-invalid={Boolean(error)}
            autoComplete="off"
            className="min-h-11 rounded-lg border border-arena bg-white px-3 text-lg text-cafe outline-none focus:border-cafe focus:ring-2 focus:ring-cafe/20"
            id="monto-inicial"
            inputMode="decimal"
            onChange={(evento) => {
              setMonto(evento.target.value);
              setError('');
            }}
            placeholder="0.00"
            type="text"
            value={monto}
          />
        </label>
        {error && (
          <p className="text-sm font-medium text-terracota" id="monto-inicial-error" role="alert">
            {error}
          </p>
        )}
        <Button className="w-full" loading={guardando} type="submit">
          Abrir caja
        </Button>
      </form>
    </Modal>
  );
}

export default AperturaCajaModal;