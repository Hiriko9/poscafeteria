import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from './database.js';
import { seedDatabase } from './seed.js';
import { resetDatabase } from './testUtils.js';

describe('seedDatabase', () => {
  beforeEach(resetDatabase);
  afterEach(() => db.close());

  it('inicializa las mesas y productos una sola vez', async () => {
    await seedDatabase();
    await seedDatabase();

    const mesas = await db.mesas.toArray();
    const productos = await db.productos.toArray();

    expect(mesas).toHaveLength(10);
    expect(mesas[0]).toMatchObject({
      id: 0,
      nombre: 'Para llevar',
      estado: 'LIBRE'
    });
    expect(mesas.slice(1).every((mesa) => mesa.estado === 'LIBRE')).toBe(true);
    expect(mesas.every(({ posX, posY }) => Number.isFinite(posX) && Number.isFinite(posY))).toBe(true);
    expect(productos).toHaveLength(9);
    expect(new Set(productos.map(({ categoria }) => categoria))).toEqual(
      new Set(['CALIENTES', 'FRIAS', 'REPOSTERIA'])
    );
    expect(productos.every(({ precio, imagen }) => Number.isInteger(precio) && imagen.endsWith('.webp'))).toBe(
      true
    );
  });
});
