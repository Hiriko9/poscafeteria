import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../database.js';
import { resetDatabase } from '../testUtils.js';
import { listarHistorial, registrarVenta } from './ventaRepository.js';

const pedidoBase = (overrides = {}) => ({
  codigoVenta: 'VEN-2026-0001',
  cajaSesionId: 1,
  mesaId: 1,
  tipoPedido: 'COMER_AQUI',
  estado: 'PAGADO',
  subtotal: 3250,
  igv: 585,
  total: 3835,
  fechaHora: '2026-01-01T10:00:00.000Z',
  ...overrides
});

const detallesBase = [{ productoId: 1, cantidad: 2, precioUnitario: 1200, nota: '' }];
const pagoBase = { metodo: 'EFECTIVO', montoRecibido: 5000, montoCobrado: 3835, vuelto: 1165 };

describe('ventaRepository', () => {
  beforeEach(resetDatabase);
  afterEach(() => {
    vi.restoreAllMocks();
    return db.close();
  });

  it('registra el pedido, detalle, pago y libera la mesa en una transacción', async () => {
    await db.mesas.add({ id: 1, numero: 1, estado: 'OCUPADA' });

    const pedidoId = await registrarVenta({
      pedido: pedidoBase(),
      detalles: detallesBase,
      pago: pagoBase
    });

    expect(await db.pedidos.get(pedidoId)).toMatchObject({ codigoVenta: 'VEN-2026-0001' });
    expect(await db.detallePedido.where('pedidoId').equals(pedidoId).count()).toBe(1);
    expect(await db.pagos.where('pedidoId').equals(pedidoId).count()).toBe(1);
    expect(await db.mesas.get(1)).toMatchObject({ estado: 'LIBRE' });
  });

  it('no modifica la mesa virtual Para llevar', async () => {
    await db.mesas.add({ id: 0, numero: 0, estado: 'LIBRE' });

    await registrarVenta({
      pedido: pedidoBase({ mesaId: 0, tipoPedido: 'PARA_LLEVAR' }),
      detalles: detallesBase,
      pago: pagoBase
    });

    expect(await db.mesas.get(0)).toMatchObject({ estado: 'LIBRE' });
  });

  it('revierte pedido y detalle si falla la inserción del pago', async () => {
    await db.mesas.add({ id: 1, numero: 1, estado: 'OCUPADA' });
    vi.spyOn(db.pagos, 'add').mockRejectedValueOnce(new Error('Fallo de prueba al insertar pago'));

    await expect(
      registrarVenta({ pedido: pedidoBase(), detalles: detallesBase, pago: pagoBase })
    ).rejects.toThrow('Fallo de prueba al insertar pago');

    expect(await db.pedidos.count()).toBe(0);
    expect(await db.detallePedido.count()).toBe(0);
    expect(await db.pagos.count()).toBe(0);
    expect(await db.mesas.get(1)).toMatchObject({ estado: 'OCUPADA' });
  });

  it('lista historial de más reciente a más antiguo con sus detalles', async () => {
    await db.mesas.add({ id: 1, numero: 1, estado: 'LIBRE' });
    await db.productos.add({ id: 2, nombre: 'Muffin', categoria: 'REPOSTERIA', precio: 850, activo: true });
    await registrarVenta({
      pedido: pedidoBase({ codigoVenta: 'VEN-2026-0001' }),
      detalles: detallesBase,
      pago: pagoBase
    });
    await registrarVenta({
      pedido: pedidoBase({
        codigoVenta: 'VEN-2026-0002',
        fechaHora: '2026-01-02T10:00:00.000Z'
      }),
      detalles: [{ productoId: 2, cantidad: 1, precioUnitario: 850, nota: 'Sin azúcar' }],
      pago: pagoBase
    });

    const historial = await listarHistorial();

    expect(historial.map(({ codigoVenta }) => codigoVenta)).toEqual([
      'VEN-2026-0002',
      'VEN-2026-0001'
    ]);
    expect(historial[0].detalles).toEqual([
      expect.objectContaining({ productoId: 2, nota: 'Sin azúcar' })
    ]);
    expect(historial[0].pago).toEqual(expect.objectContaining(pagoBase));
    expect(historial[0].detalles[0].nombreProducto).toBe('Muffin');
  });
});
