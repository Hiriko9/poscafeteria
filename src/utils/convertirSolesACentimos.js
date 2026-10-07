export function convertirSolesACentimos(valor) {
  if (typeof valor !== 'string') {
    throw new TypeError('Ingresa un monto válido en soles.');
  }

  const monto = valor.trim();

  if (!monto) {
    throw new TypeError('Ingresa el monto en soles.');
  }

  if (monto.startsWith('-')) {
    throw new TypeError('El monto no puede ser negativo.');
  }

  if (!/^\d+(?:[.,]\d{1,2})?$/.test(monto)) {
    throw new TypeError('Ingresa un monto válido con máximo dos decimales.');
  }

  const [soles, fraccion = ''] = monto.replace(',', '.').split('.');
  const centimos = Number(soles) * 100 + Number(fraccion.padEnd(2, '0'));

  if (!Number.isSafeInteger(centimos)) {
    throw new RangeError('El monto excede el máximo permitido.');
  }

  return centimos;
}
