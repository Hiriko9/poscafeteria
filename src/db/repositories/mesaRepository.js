import { db } from '../database.js';
import { ESTADOS_MESA, ESTADOS_PEDIDO, MESA_VIRTUAL_ID } from '../../utils/constants.js';

const estadosMesa = new Set(Object.values(ESTADOS_MESA));

export async function listarMesas() {
  const mesas = await db.mesas.toArray();
  return mesas.sort((a, b) => a.numero - b.numero);
}

export async function cambiarEstadoMesa(id, estado) {
  if (!estadosMesa.has(estado)) {
    throw new TypeError('El estado de mesa debe ser LIBRE u OCUPADA.');
  }

  if (id === MESA_VIRTUAL_ID && estado === ESTADOS_MESA.OCUPADA) {
    throw new Error('La mesa virtual Para llevar no puede marcarse como OCUPADA.');
  }

  const actualizadas = await db.mesas.update(id, { estado });

  if (actualizadas === 0) {
    throw new Error(`No existe la mesa con id ${id}.`);
  }

  return db.mesas.get(id);
}

export async function liberarMesasOcupadasSinPedidoPendiente() {
  return db.transaction('rw', db.mesas, db.pedidos, async () => {
    const mesasOcupadas = await db.mesas.where('estado').equals(ESTADOS_MESA.OCUPADA).toArray();
    const idsLiberadas = [];

    for (const mesa of mesasOcupadas) {
      if (mesa.id === MESA_VIRTUAL_ID) continue;

      const pedidosPendientes = await db.pedidos
        .where('mesaId')
        .equals(mesa.id)
        .filter((pedido) => pedido.estado !== ESTADOS_PEDIDO.PAGADO)
        .count();

      if (pedidosPendientes === 0) {
        await db.mesas.update(mesa.id, { estado: ESTADOS_MESA.LIBRE });
        idsLiberadas.push(mesa.id);
      }
    }

    return idsLiberadas;
  });
}