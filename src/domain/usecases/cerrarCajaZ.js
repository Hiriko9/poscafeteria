import { ESTADOS_CAJA } from '../../utils/constants.js';

function validarMonto(monto, nombre) {
  if (!Number.isSafeInteger(monto) || monto < 0) {
    throw new TypeError(`${nombre} debe ser un entero no negativo en céntimos.`);
  }
}

export function cerrarCajaZ({
  montoInicial,
  ventasEfectivo,
  montoCierreEfectivo,
  montoCierreTarjetas = 0,
  fechaCierre
} = {}) {
  validarMonto(montoInicial, 'El monto inicial');
  validarMonto(ventasEfectivo, 'Las ventas en efectivo');
  validarMonto(montoCierreEfectivo, 'El efectivo contado');
  validarMonto(montoCierreTarjetas, 'El monto de cierre en tarjetas');

  const efectivoEsperado = montoInicial + ventasEfectivo;

  if (!Number.isSafeInteger(efectivoEsperado)) {
    throw new RangeError('El efectivo esperado excede el monto máximo seguro en céntimos.');
  }

  return {
    estado: ESTADOS_CAJA.CERRADA,
    ...(fechaCierre === undefined ? {} : { fechaCierre }),
    montoCierreEfectivo,
    montoCierreTarjetas,
    efectivoEsperado,
    diferencia: montoCierreEfectivo - efectivoEsperado
  };
}