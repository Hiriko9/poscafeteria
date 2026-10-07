// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database.js';
import { resetDatabase } from '../db/testUtils.js';
import { abrirCaja } from '../db/repositories/cajaRepository.js';
import { useComanda } from './useComanda.js';
import { useHistorial } from './useHistorial.js';

describe('useHistorial', () => {
  beforeEach(async () => {
    await resetDatabase();
    await db.mesas.add({ id: 0, numero: 0, estado: 'LIBRE' });
  });
  afterEach(() => db.close());

  it('carga ventas con detalles y se actualiza al registrarse una nueva venta', async () => {
    const cajaSesion = await abrirCaja({ montoInicial: 1000 });
    const { result } = renderHook(() => ({
      historial: useHistorial(),
      comanda: useComanda({ cajaSesionId: cajaSesion.id })
    }));

    await waitFor(() => expect(result.current.historial.estado).toBe('LISTO'));
    expect(result.current.historial.ventas).toEqual([]);

    act(() => {
      result.current.comanda.agregarProducto({ id: 1, nombre: 'Latte', precio: 1000 });
      result.current.comanda.cambiarTipoPedido('PARA_LLEVAR');
    });
    await act(async () => {
      await result.current.comanda.confirmarPago('YAPE', 1180);
    });

    await waitFor(() => expect(result.current.historial.ventas).toHaveLength(1));
    expect(result.current.historial.ventas[0].detalles).toEqual([
      expect.objectContaining({ productoId: 1, precioUnitario: 1000 })
    ]);
  });
});
