// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database.js';
import { resetDatabase } from '../db/testUtils.js';
import { useCatalogo } from './useCatalogo.js';

describe('useCatalogo', () => {
  beforeEach(async () => {
    await resetDatabase();
    await db.productos.bulkAdd([
      { nombre: 'Latte', categoria: 'CALIENTES', precio: 1200, activo: true },
      { nombre: 'Americano', categoria: 'CALIENTES', precio: 900, activo: false },
      { nombre: 'Limonada', categoria: 'FRIAS', precio: 800, activo: true }
    ]);
  });
  afterEach(() => db.close());

  it('carga productos activos y cambia la categoría consultada', async () => {
    const { result } = renderHook(() => useCatalogo());

    await waitFor(() => expect(result.current.estado).toBe('LISTO'));
    expect(result.current.productos.map(({ nombre }) => nombre)).toEqual(['Latte']);

    act(() => result.current.seleccionarCategoria('FRIAS'));
    await waitFor(() => expect(result.current.productos.map(({ nombre }) => nombre)).toEqual(['Limonada']));
  });
});
