import { db } from '../database.js';

const estadosMesa = new Set(['LIBRE', 'OCUPADA']);

export async function listarMesas() {
  const mesas = await db.mesas.toArray();
  return mesas.sort((a, b) => a.numero - b.numero);
}

export async function cambiarEstadoMesa(id, estado) {
  if (!estadosMesa.has(estado)) {
    throw new TypeError('El estado de mesa debe ser LIBRE u OCUPADA.');
  }

  if (id === 0 && estado === 'OCUPADA') {
    throw new Error('La mesa virtual Para llevar no puede marcarse como OCUPADA.');
  }

  const actualizadas = await db.mesas.update(id, { estado });

  if (actualizadas === 0) {
    throw new Error(`No existe la mesa con id ${id}.`);
  }

  return db.mesas.get(id);
}