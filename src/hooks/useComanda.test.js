// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database.js';
import { resetDatabase } from '../db/testUtils.js';
import { abrirCaja } from '../db/repositories/cajaRepository.js';
import { useComanda } from './useComanda.js';

const latte = { id: 1, nombre: 'Latte', precio: 1200 };
const muffin = { id: 2, nombre: 'Muffin', precio: 850 };

describe('useComanda', () => {
  let cajaSesion;

  beforeEach(async () => {
    await resetDatabase();
    cajaSesion = await abrirCaja({ montoInicial: 10000 });
    await db.mesas.add({ id: 1, numero: 1, estado: 'OCUPADA' });
  });

  afterEach(() => db.close());

  it('acumula el mismo producto, elimina cantidad cero y calcula totales', () => {
    const { result } = renderHook(() => useComanda({ cajaSesionId: cajaSesion.id }));

    act(() => {
      result.current.agregarProducto(latte);
      result.current.agregarProducto(latte);
      result.current.agregarProducto(muffin);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0].cantidad).toBe(2);
    expect(result.current.totales).toEqual({ subtotal: 3250, igv: 585, total: 3835 });

    act(() => result.current.cambiarCantidad(muffin.id, 0));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe(latte.id);
  });

  it('solo permite cobrar con productos y una mesa válida o Para llevar', () => {
    const { result } = renderHook(() => useComanda({ cajaSesionId: cajaSesion.id }));

    expect(result.current.puedeCobrar).toBe(false);

    act(() => result.current.agregarProducto(latte));
    expect(result.current.puedeCobrar).toBe(false);

    act(() => result.current.cambiarTipoPedido('PARA_LLEVAR'));
    expect(result.current.puedeCobrar).toBe(true);

    act(() => result.current.limpiar());
    expect(result.current.puedeCobrar).toBe(false);
  });

  it('no persiste ni acepta un pago con monto insuficiente', async () => {
    const { result } = renderHook(() => useComanda({ cajaSesionId: cajaSesion.id }));
    act(() => {
      result.current.agregarProducto(latte);
      result.current.seleccionarMesa(1);
    });

    let respuesta;
    await act(async () => {
      respuesta = await result.current.confirmarPago('EFECTIVO', 1000);
    });

    expect(respuesta.error).toMatch(/monto recibido es insuficiente/i);
    expect(result.current.estado).toBe('ERROR');
    expect(await db.pedidos.count()).toBe(0);
    expect(await db.detallePedido.count()).toBe(0);
    expect(await db.pagos.count()).toBe(0);
  });

  it('registra el payload mediante los repositorios reales y devuelve el ticket', async () => {
    const { result } = renderHook(() => useComanda({ cajaSesionId: cajaSesion.id }));
    act(() => {
      result.current.agregarProducto(latte);
      result.current.seleccionarMesa(1);
    });

    let respuesta;
    await act(async () => {
      respuesta = await result.current.confirmarPago('EFECTIVO', 2000);
    });

    expect(respuesta.ticket).toMatchObject({
      codigoVenta: expect.stringMatching(/^VEN-\d{4}-\d{4}$/),
      mesaId: 1,
      subtotal: 1200,
      igv: 216,
      total: 1416
    });
    expect(result.current.estado).toBe('PAGO_EXITOSO');
    expect(result.current.puedeCobrar).toBe(false);
    expect(await db.pedidos.count()).toBe(1);
    expect(await db.mesas.get(1)).toMatchObject({ estado: 'LIBRE' });
    await waitFor(() => expect(result.current.ticket.id).toBe(respuesta.ticket.id));

    await act(async () => {
      respuesta = await result.current.confirmarPago('EFECTIVO', 2000);
    });
    expect(respuesta.error).toMatch(/ya fue cobrada/i);
    expect(await db.pedidos.count()).toBe(1);
  });

  it('genera códigos de venta consecutivos en ventas seguidas', async () => {
    const { result } = renderHook(() => useComanda({ cajaSesionId: cajaSesion.id }));
    const codigos = [];

    for (let secuencia = 1; secuencia <= 2; secuencia += 1) {
      act(() => {
        result.current.agregarProducto(latte);
        result.current.cambiarTipoPedido('PARA_LLEVAR');
      });

      let respuesta;
      await act(async () => {
        respuesta = await result.current.confirmarPago('EFECTIVO', 2000);
      });

      expect(respuesta.ticket).toBeDefined();
      codigos.push(respuesta.ticket.codigoVenta);

      if (secuencia === 1) {
        act(() => result.current.limpiar());
      }
    }

    const anio = new Date().getUTCFullYear();
    expect(codigos).toEqual([`VEN-${anio}-0001`, `VEN-${anio}-0002`]);
    expect(await db.pedidos.count()).toBe(2);
  });
});
