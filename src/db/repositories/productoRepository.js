import { db } from '../database.js';

const categorias = new Set(['CALIENTES', 'FRIAS', 'REPOSTERIA']);

export async function listarProductosActivosPorCategoria(categoria) {
  if (!categorias.has(categoria)) {
    throw new TypeError('La categoría debe ser CALIENTES, FRIAS o REPOSTERIA.');
  }

  return db.productos
    .where('categoria')
    .equals(categoria)
    .filter((producto) => producto.activo)
    .toArray();
}