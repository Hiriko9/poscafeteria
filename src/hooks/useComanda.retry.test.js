// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database.js';
import { resetDatabase } from '../db/testUtils.js';
import { abrirCaja } from '../db/repositories/cajaRepository.js';
import { useComanda } from './useComanda.js';

vi.mock('../db/repositories/ventaRepository.js', async (importOriginal) => {
  const repositorioReal = await importOriginal();

  return {
    ...repositorioReal,
    registrarVenta: vi.fn(repositorioReal.registrarVenta)
  };
});

import { registrarVenta } from '../db/repositories/ventaRepository.js';

describe('useComanda reintento de código duplicado', () => {
  let cajaSesion;

  beforeEach(async () => {
    vi.mocked(registrarVenta).mockReset();
    vi.mocked(registrarVenta).mockImplementation(
      (await import('../db/repositories/ventaRepository.js')).registrarVenta
    );
    await resetDatabase();
    cajaSesion = await abrirCaja({ montoInicial: 10000 });
  });

  afterEach(() => db.close());

  it('reintenta una vez con un nuevo correlativo si aparece una venta concurrente', async () => {
    const registrarVentaReal = (await vi.importActual('../db/repositories/ventaRepository.js'))
      .registrarVenta;
    let primerIntento = true;

    vi.mocked(registrarVenta).mockImplementation(async (payload) => {
      if (primerIntento) {
        primerIntento = false;
        await registrarVentaReal(payload);
        const error = new Error('Código de venta duplicado');
        error.name = 'ConstraintError';
        throw error;
      }

      return registrarVentaReal(payload);
    });

    const { result } = renderHook(() => useComanda({ cajaSesionId: cajaSesion.id }));
    act(() => {
      result.current.agregarProducto({ id: 1, nombre: 'Latte', precio: 1200 });
      result.current.cambiarTipoPedido('PARA_LLEVAR');
    });

    let respuesta;
    await act(async () => {
      respuesta = await result.current.confirmarPago('EFECTIVO', 2000);
    });

    const anio = new Date().getUTCFullYear();
    expect(respuesta.ticket.codigoVenta).toBe(`VEN-${anio}-0002`);
    expect(registrarVenta).toHaveBeenCalledTimes(2);
    expect(await db.pedidos.count()).toBe(2);
  });
});
