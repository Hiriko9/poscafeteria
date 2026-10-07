// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database.js';
import { resetDatabase } from '../db/testUtils.js';
import { registrarVenta } from '../db/repositories/ventaRepository.js';
import { useCaja } from './useCaja.js';

describe('useCaja', () => {
  beforeEach(resetDatabase);
  afterEach(() => db.close());

  it('inicia sin sesión como CAJA_CERRADA y abre caja', async () => {
    const { result } = renderHook(() => useCaja());

    await waitFor(() => expect(result.current.estado).toBe('CAJA_CERRADA'));
    expect(result.current.sesion).toBeNull();

    await act(async () => {
      await result.current.abrirCaja(10000);
    });

    expect(result.current.estado).toBe('CAJA_ABIERTA');
    expect(result.current.sesion).toMatchObject({ montoInicial: 10000, estado: 'ABIERTA' });
  });

  it('rechaza abrir una segunda caja ABIERTA', async () => {
    const { result } = renderHook(() => useCaja());
    await waitFor(() => expect(result.current.estado).toBe('CAJA_CERRADA'));

    await act(async () => {
      await result.current.abrirCaja(10000);
    });

    await expect(
      act(async () => result.current.abrirCaja(5000))
    ).rejects.toThrow(/No se puede abrir otra caja/);
    expect(result.current.estado).toBe('CAJA_ABIERTA');
    expect(await db.cajaSesion.count()).toBe(1);
  });

  it('cierra la sesión aplicando el arqueo del repositorio y el dominio', async () => {
    const { result } = renderHook(() => useCaja());
    await waitFor(() => expect(result.current.estado).toBe('CAJA_CERRADA'));

    let sesion;
    await act(async () => {
      sesion = await result.current.abrirCaja(10000);
    });

    await db.mesas.add({ id: 0, numero: 0, estado: 'LIBRE' });
    await registrarVenta({
      pedido: {
        codigoVenta: 'VEN-2026-0001',
        cajaSesionId: sesion.id,
        mesaId: 0,
        tipoPedido: 'PARA_LLEVAR',
        estado: 'PAGADO',
        subtotal: 1000,
        igv: 180,
        total: 1180,
        fechaHora: '2026-10-07T10:00:00.000Z'
      },
      detalles: [{ productoId: 1, cantidad: 1, precioUnitario: 1000, nota: '' }],
      pago: { metodo: 'EFECTIVO', montoRecibido: 1200, montoCobrado: 1180, vuelto: 20 }
    });

    let cierre;
    await act(async () => {
      cierre = await result.current.cerrarCajaZ({
        montoCierreEfectivo: 11000,
        montoCierreTarjetas: 0
      });
    });

    expect(cierre).toMatchObject({ efectivoEsperado: 11180, diferencia: -180 });
    expect(result.current.estado).toBe('CAJA_CERRADA');
    expect(await db.cajaSesion.get(sesion.id)).toMatchObject({ estado: 'CERRADA' });
  });
});
