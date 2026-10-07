import { db } from '../database.js';
import { CATEGORIAS_PRODUCTO } from '../../utils/constants.js';

const categorias = new Set(Object.values(CATEGORIAS_PRODUCTO));

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