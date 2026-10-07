// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database.js';
import { resetDatabase } from '../db/testUtils.js';
import { abrirCaja } from '../db/repositories/cajaRepository.js';
import { useComanda } from './useComanda.js';
import { useMesas } from './useMesas.js';

describe('useMesas', () => {
  beforeEach(async () => {
    await resetDatabase();
    await db.mesas.add({ id: 1, numero: 1, estado: 'LIBRE' });
  });
  afterEach(() => db.close());

  it('carga las mesas y las actualiza cuando useComanda registra una venta', async () => {
    const cajaSesion = await abrirCaja({ montoInicial: 1000 });
    const { result } = renderHook(() => ({
      mesas: useMesas(),
      comanda: useComanda({ cajaSesionId: cajaSesion.id })
    }));

    await waitFor(() => expect(result.current.mesas.estado).toBe('LISTO'));
    expect(result.current.mesas.mesas[0].estado).toBe('LIBRE');

    act(() => {
      result.current.comanda.agregarProducto({ id: 1, nombre: 'Latte', precio: 1000 });
      result.current.comanda.seleccionarMesa(1);
    });
    await waitFor(async () => {
      expect(await db.mesas.get(1)).toMatchObject({ estado: 'OCUPADA' });
    });
    await waitFor(() =>
      expect(result.current.mesas.mesas[0].estado).toBe('OCUPADA')
    );
    await act(async () => {
      await result.current.comanda.confirmarPago('EFECTIVO', 1200);
    });

    await waitFor(() => expect(result.current.mesas.mesas[0].estado).toBe('LIBRE'));
  });
});
