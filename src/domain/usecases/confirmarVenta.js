import { calcularTotales, calcularVuelto } from './calcularTotales.js';
import { MESA_VIRTUAL_ID, METODOS_PAGO, TIPOS_PEDIDO } from '../../utils/constants.js';

const metodosPagoValidos = new Set(Object.values(METODOS_PAGO));

function obtenerPrecio(item) {
  return item?.precioUnitario ?? item?.precio;
}

function sonItemsValidos(items) {
  return (
    Array.isArray(items) &&
    items.length > 0 &&
    items.every(
      (item) =>
        Number.isSafeInteger(item?.cantidad) &&
        item.cantidad > 0 &&
        Number.isSafeInteger(obtenerPrecio(item)) &&
        obtenerPrecio(item) >= 0
    )
  );
}

export function validarVenta(datos = {}) {
  const errores = [];
  const {
    items,
    mesaId,
    tipoPedido,
    metodoPago,
    montoRecibido,
    cajaSesionId,
    codigoVenta,
    fechaHora
  } = datos;

  if (!Array.isArray(items) || items.length === 0) {
    errores.push('La comanda debe contener al menos un producto.');
  } else {
    items.forEach((item, indice) => {
      if (!Number.isSafeInteger(item?.cantidad) || item.cantidad <= 0) {
        errores.push(`La cantidad del producto ${indice + 1} debe ser un entero mayor a 0.`);
      }

      const precio = obtenerPrecio(item);
      if (!Number.isSafeInteger(precio) || precio < 0) {
        errores.push(`El precio del producto ${indice + 1} debe ser un entero no negativo en céntimos.`);
      }

      const productoId = item?.productoId ?? item?.id;
      if (!Number.isSafeInteger(productoId) || productoId <= 0) {
        errores.push(`El producto ${indice + 1} debe tener un identificador válido.`);
      }
    });
  }

  const esMesaParaLlevar = mesaId === MESA_VIRTUAL_ID && tipoPedido === TIPOS_PEDIDO.PARA_LLEVAR;
  const esMesaFisica =
    Number.isSafeInteger(mesaId) && mesaId > MESA_VIRTUAL_ID && tipoPedido === TIPOS_PEDIDO.COMER_AQUI;

  if (!esMesaParaLlevar && !esMesaFisica) {
    errores.push('Selecciona una mesa válida o Para llevar con la mesa virtual 0.');
  }

  if (!metodosPagoValidos.has(metodoPago)) {
    errores.push('El método de pago debe ser EFECTIVO, YAPE o TARJETA.');
  }

  if (!Number.isSafeInteger(montoRecibido) || montoRecibido < 0) {
    errores.push('El monto recibido debe ser un entero no negativo en céntimos.');
  } else if (sonItemsValidos(items)) {
    const { total } = calcularTotales(items);
    if (montoRecibido < total) {
      errores.push('El monto recibido es insuficiente para cubrir el total de la venta.');
    }
  }

  if (!Number.isSafeInteger(cajaSesionId) || cajaSesionId <= 0) {
    errores.push('La venta debe estar asociada a una sesión de caja válida.');
  }

  if (typeof codigoVenta !== 'string' || codigoVenta.trim() === '') {
    errores.push('La venta debe tener un código de venta.');
  }

  if (typeof fechaHora !== 'string' || !Number.isFinite(new Date(fechaHora).getTime())) {
    errores.push('La venta debe tener una fecha y hora válidas.');
  }

  return { valido: errores.length === 0, errores };
}

export function construirPayloadVenta(datos) {
  const { valido, errores } = validarVenta(datos);

  if (!valido) {
    throw new Error(errores.join(' '));
  }

  const { items, mesaId, tipoPedido, metodoPago, montoRecibido } = datos;
  const totales = calcularTotales(items);

  return {
    pedido: {
      codigoVenta: datos.codigoVenta,
      cajaSesionId: datos.cajaSesionId,
      mesaId,
      tipoPedido,
      estado: 'PAGADO',
      ...totales,
      fechaHora: datos.fechaHora
    },
    detalles: items.map((item) => ({
      productoId: item.productoId ?? item.id,
      cantidad: item.cantidad,
      precioUnitario: obtenerPrecio(item),
      nota: item.nota ?? ''
    })),
    pago: {
      metodo: metodoPago,
      montoRecibido,
      montoCobrado: totales.total,
      vuelto: calcularVuelto(totales.total, montoRecibido)
    }
  };
}