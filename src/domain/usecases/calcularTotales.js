import { IGV_RATE_PCT } from '../../utils/constants.js';

function validarMonto(monto, nombre) {
  if (!Number.isSafeInteger(monto) || monto < 0) {
    throw new TypeError(`${nombre} debe ser un entero no negativo en céntimos.`);
  }
}

export function calcularTotales(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new TypeError('La comanda debe contener al menos un producto.');
  }

  const subtotal = items.reduce((acumulado, item, indice) => {
    const cantidad = item?.cantidad;
    const precio = item?.precioUnitario ?? item?.precio;

    if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
      throw new TypeError(`La cantidad del producto ${indice + 1} debe ser un entero mayor a 0.`);
    }

    validarMonto(precio, `El precio del producto ${indice + 1}`);

    const nuevoSubtotal = acumulado + precio * cantidad;

    if (!Number.isSafeInteger(nuevoSubtotal)) {
      throw new RangeError('El subtotal excede el monto máximo seguro en céntimos.');
    }

    return nuevoSubtotal;
  }, 0);

  const igv = Math.round((subtotal * IGV_RATE_PCT) / 100);
  const total = subtotal + igv;

  if (!Number.isSafeInteger(igv) || !Number.isSafeInteger(total)) {
    throw new RangeError('El total excede el monto máximo seguro en céntimos.');
  }

  return { subtotal, igv, total };
}

export function calcularVuelto(total, recibido) {
  validarMonto(total, 'El total');
  validarMonto(recibido, 'El monto recibido');

  return Math.max(0, recibido - total);
}