import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../database.js';
import { resetDatabase } from '../testUtils.js';
import { cambiarEstadoMesa, listarMesas } from './mesaRepository.js';

describe('mesaRepository', () => {
  beforeEach(resetDatabase);
  afterEach(() => db.close());

  it('lista mesas por número y permite cambiar el estado de una mesa física', async () => {
    await db.mesas.bulkAdd([
      { id: 2, numero: 2, estado: 'LIBRE' },
      { id: 0, numero: 0, nombre: 'Para llevar', estado: 'LIBRE' },
      { id: 1, numero: 1, estado: 'LIBRE' }
    ]);

    expect((await listarMesas()).map(({ id }) => id)).toEqual([0, 1, 2]);
    expect(await cambiarEstadoMesa(1, 'OCUPADA')).toMatchObject({ id: 1, estado: 'OCUPADA' });
  });

  it('no permite marcar Para llevar como OCUPADA', async () => {
    await db.mesas.add({ id: 0, numero: 0, estado: 'LIBRE' });

    await expect(cambiarEstadoMesa(0, 'OCUPADA')).rejects.toThrow('mesa virtual');
    expect(await db.mesas.get(0)).toMatchObject({ estado: 'LIBRE' });
  });
});
