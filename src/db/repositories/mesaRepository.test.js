import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../database.js';
import { resetDatabase } from '../testUtils.js';
import {
  cambiarEstadoMesa,
  liberarMesasOcupadasSinPedidoPendiente,
  listarMesas
} from './mesaRepository.js';

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

  it('libera mesas ocupadas sin pedido pendiente y conserva las vinculadas a uno', async () => {
    await db.mesas.bulkAdd([
      { id: 0, numero: 0, estado: 'OCUPADA' },
      { id: 1, numero: 1, estado: 'OCUPADA' },
      { id: 2, numero: 2, estado: 'OCUPADA' }
    ]);
    await db.pedidos.add({ codigoVenta: 'VEN-2026-0001', mesaId: 2, estado: 'PENDIENTE' });

    await expect(liberarMesasOcupadasSinPedidoPendiente()).resolves.toEqual([1]);

    expect(await db.mesas.get(0)).toMatchObject({ estado: 'OCUPADA' });
    expect(await db.mesas.get(1)).toMatchObject({ estado: 'LIBRE' });
    expect(await db.mesas.get(2)).toMatchObject({ estado: 'OCUPADA' });
  });
});
