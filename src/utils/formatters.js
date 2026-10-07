function validarFecha(fecha) {
  const valor = fecha instanceof Date ? fecha.getTime() : new Date(fecha).getTime();

  if (!Number.isFinite(valor)) {
    throw new TypeError('La fecha debe ser un valor de fecha válido.');
  }

  return new Date(valor);
}

export function formatearSoles(centimos) {
  if (!Number.isSafeInteger(centimos)) {
    throw new TypeError('El monto debe ser un entero seguro en céntimos.');
  }

  const monto = new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(centimos / 100);

  return `S/ ${monto}`;
}

export function formatearFecha(fecha) {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Lima'
  }).format(validarFecha(fecha));
}