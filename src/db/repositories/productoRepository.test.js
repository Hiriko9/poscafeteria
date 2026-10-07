import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../database.js';
import { resetDatabase } from '../testUtils.js';
import { listarProductosActivosPorCategoria } from './productoRepository.js';

describe('productoRepository', () => {
  beforeEach(resetDatabase);
  afterEach(() => db.close());

  it('lista solo productos activos de la categoría solicitada', async () => {
    await db.productos.bulkAdd([
      { nombre: 'Latte', categoria: 'CALIENTES', precio: 1200, activo: true },
      { nombre: 'Americano', categoria: 'CALIENTES', precio: 900, activo: false },
      { nombre: 'Limonada', categoria: 'FRIAS', precio: 800, activo: true }
    ]);

    await expect(listarProductosActivosPorCategoria('CALIENTES')).resolves.toEqual([
      expect.objectContaining({ nombre: 'Latte', activo: true })
    ]);
  });
});
