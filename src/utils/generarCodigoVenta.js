export function generarCodigoVenta(anio, secuencia) {
  if (!Number.isInteger(anio) || anio < 0 || anio > 9999) {
    throw new TypeError('El año debe ser un entero entre 0 y 9999.');
  }

  if (!Number.isSafeInteger(secuencia) || secuencia < 0) {
    throw new TypeError('La secuencia debe ser un entero no negativo.');
  }

  return `VEN-${String(anio).padStart(4, '0')}-${String(secuencia).padStart(4, '0')}`;
}