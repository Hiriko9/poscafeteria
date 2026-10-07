import { ESTADOS_CAJA } from '../../utils/constants.js';

export function validarMontoInicial(montoInicial) {
  if (!Number.isSafeInteger(montoInicial) || montoInicial < 0) {
    return { valido: false, error: 'El monto inicial debe ser un entero no negativo en céntimos.' };
  }

  return { valido: true, error: null };
}

export function abrirCaja({ montoInicial, fechaApertura } = {}) {
  const validacion = validarMontoInicial(montoInicial);

  if (!validacion.valido) {
    throw new TypeError(validacion.error);
  }

  return {
    montoInicial,
    estado: ESTADOS_CAJA.ABIERTA,
    ...(fechaApertura === undefined ? {} : { fechaApertura })
  };
}