import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../database.js';
import { siguienteSecuencia } from './ventaRepository.js';

describe('siguienteSecuencia', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(() => db.close());

  it('devuelve la siguiente secuencia del año indicado', async () => {
    await db.pedidos.bulkAdd([
      { codigoVenta: 'VEN-2026-0003', fechaHora: '2026-04-01T12:00:00.000Z' },
      { codigoVenta: 'VEN-2026-0012', fechaHora: '2026-06-01T12:00:00.000Z' },
      { codigoVenta: 'VEN-2025-0099', fechaHora: '2025-12-01T12:00:00.000Z' }
    ]);

    await expect(siguienteSecuencia(2026)).resolves.toBe(13);
    await expect(siguienteSecuencia(2027)).resolves.toBe(1);
  });

  it('rechaza años inválidos', async () => {
    await expect(siguienteSecuencia(-1)).rejects.toThrow('año');
  });
});
