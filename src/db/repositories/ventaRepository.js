import { db } from '../database.js';

export async function siguienteSecuencia(anio) {
  if (!Number.isInteger(anio) || anio < 0 || anio > 9999) {
    throw new TypeError('El año debe ser un entero entre 0 y 9999.');
  }

  const inicio = `${String(anio).padStart(4, '0')}-01-01T00:00:00.000Z`;
  const fin = `${String(anio + 1).padStart(4, '0')}-01-01T00:00:00.000Z`;
  const pedidos = await db.pedidos
    .where('fechaHora')
    .between(inicio, fin, true, false)
    .toArray();
  const prefijo = `VEN-${String(anio).padStart(4, '0')}-`;
  const secuenciaMaxima = pedidos.reduce((maximo, { codigoVenta }) => {
    if (typeof codigoVenta !== 'string' || !codigoVenta.startsWith(prefijo)) {
      return maximo;
    }

    const secuencia = codigoVenta.slice(prefijo.length);
    return /^\d{4,}$/.test(secuencia) ? Math.max(maximo, Number(secuencia)) : maximo;
  }, 0);

  return secuenciaMaxima + 1;
}

export async function registrarVenta({ pedido, detalles, pago }) {
  if (!pedido || !Array.isArray(detalles) || detalles.length === 0 || !pago) {
    throw new TypeError('La venta requiere un pedido, al menos un detalle y un pago.');
  }

  return db.transaction(
    'rw',
    db.pedidos,
    db.detallePedido,
    db.pagos,
    db.mesas,
    async () => {
      const pedidoId = await db.pedidos.add(pedido);
      const detallesConPedido = detalles.map((detalle) => ({ ...detalle, pedidoId }));

      await db.detallePedido.bulkAdd(detallesConPedido);
      await db.pagos.add({ ...pago, pedidoId });

      if (pedido.mesaId !== 0) {
        const mesaActualizada = await db.mesas.update(pedido.mesaId, { estado: 'LIBRE' });

        if (mesaActualizada === 0) {
          throw new Error(`No existe la mesa con id ${pedido.mesaId}.`);
        }
      }

      return pedidoId;
    }
  );
}

export async function listarHistorial() {
  const pedidos = await db.pedidos.orderBy('fechaHora').reverse().toArray();

  if (pedidos.length === 0) {
    return [];
  }

  const pedidoIds = pedidos.map(({ id }) => id);
  const detalles = await db.detallePedido.where('pedidoId').anyOf(pedidoIds).toArray();
  const detallesPorPedido = new Map();

  for (const detalle of detalles) {
    const lista = detallesPorPedido.get(detalle.pedidoId) ?? [];
    lista.push(detalle);
    detallesPorPedido.set(detalle.pedidoId, lista);
  }

  return pedidos.map((pedido) => ({
    ...pedido,
    detalles: detallesPorPedido.get(pedido.id) ?? []
  }));
}