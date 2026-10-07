import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../database.js';
import { resetDatabase } from '../testUtils.js';
import {
  abrirCaja,
  cerrarCaja,
  obtenerResumenCierreCaja,
  obtenerSesionAbierta
} from './cajaRepository.js';

describe('cajaRepository', () => {
  beforeEach(resetDatabase);
  afterEach(() => db.close());

  it('crea una sesión ABIERTA y la recupera', async () => {
    const sesion = await abrirCaja({ montoInicial: 10000, fechaApertura: '2026-01-01T08:00:00.000Z' });

    expect(sesion).toMatchObject({ montoInicial: 10000, estado: 'ABIERTA' });
    expect(await obtenerSesionAbierta()).toMatchObject({ id: sesion.id, estado: 'ABIERTA' });
  });

  it('rechaza abrir una segunda sesión ABIERTA', async () => {
    await abrirCaja({ montoInicial: 10000 });

    await expect(abrirCaja({ montoInicial: 5000 })).rejects.toThrow('No se puede abrir otra caja');
    expect(await db.cajaSesion.count()).toBe(1);
  });

  it('cierra con el arqueo y calcula la diferencia en céntimos', async () => {
    const sesion = await abrirCaja({ montoInicial: 10000, fechaApertura: '2026-01-01T08:00:00.000Z' });
    const pedidoId = await db.pedidos.add({
      codigoVenta: 'VEN-2026-0001',
      cajaSesionId: sesion.id,
      mesaId: 0,
      estado: 'PAGADO',
      fechaHora: '2026-01-01T09:00:00.000Z'
    });
    await db.pagos.add({ pedidoId, metodo: 'EFECTIVO', montoCobrado: 3835 });
    await db.pagos.add({ pedidoId, metodo: 'YAPE', montoCobrado: 2000 });

    const cierre = await cerrarCaja({
      montoCierreEfectivo: 14000,
      montoCierreTarjetas: 2000,
      fechaCierre: '2026-01-01T18:00:00.000Z'
    });

    expect(cierre).toMatchObject({
      estado: 'CERRADA',
      montoCierreEfectivo: 14000,
      montoCierreTarjetas: 2000,
      diferencia: 165
    });
    expect(await obtenerSesionAbierta()).toBeUndefined();
  });

  it('calcula resumen sin ventas, aislando sesión y método, y coincide con el cierre persistido', async () => {
    const sesion = await abrirCaja({ montoInicial: 10000, fechaApertura: '2026-01-01T08:00:00.000Z' });
    const sesionAnteriorId = await db.cajaSesion.add({
      fechaApertura: '2025-01-01T08:00:00.000Z',
      fechaCierre: '2025-01-01T18:00:00.000Z',
      montoInicial: 5000,
      estado: 'CERRADA'
    });

    const sesionSinVentasAntes = await db.cajaSesion.get(sesion.id);
    await expect(obtenerResumenCierreCaja(sesion.id)).resolves.toEqual({
      sesionId: sesion.id,
      montoInicial: 10000,
      ventasEfectivo: 0,
      efectivoEsperado: 10000
    });
    expect(await db.cajaSesion.get(sesion.id)).toEqual(sesionSinVentasAntes);
    expect(await db.pedidos.count()).toBe(0);
    expect(await db.pagos.count()).toBe(0);

    const pedidoActual = await db.pedidos.add({
      codigoVenta: 'VEN-2026-0001',
      cajaSesionId: sesion.id,
      mesaId: 0,
      estado: 'PAGADO',
      fechaHora: '2026-01-01T09:00:00.000Z'
    });
    const pedidoAnterior = await db.pedidos.add({
      codigoVenta: 'VEN-2025-0001',
      cajaSesionId: sesionAnteriorId,
      mesaId: 0,
      estado: 'PAGADO',
      fechaHora: '2025-01-01T09:00:00.000Z'
    });
    await db.pagos.bulkAdd([
      { pedidoId: pedidoActual, metodo: 'EFECTIVO', montoCobrado: 2500 },
      { pedidoId: pedidoActual, metodo: 'YAPE', montoCobrado: 4000 },
      { pedidoId: pedidoActual, metodo: 'TARJETA', montoCobrado: 3000 },
      { pedidoId: pedidoAnterior, metodo: 'EFECTIVO', montoCobrado: 9000 }
    ]);

    const sesionAntesResumen = await db.cajaSesion.get(sesion.id);
    const conteosAntesResumen = {
      pedidos: await db.pedidos.count(),
      pagos: await db.pagos.count()
    };
    const resumen = await obtenerResumenCierreCaja(sesion.id);
    expect(await db.cajaSesion.get(sesion.id)).toEqual(sesionAntesResumen);
    expect({
      pedidos: await db.pedidos.count(),
      pagos: await db.pagos.count()
    }).toEqual(conteosAntesResumen);
    const antes = {
      cajaSesion: await db.cajaSesion.count(),
      pedidos: await db.pedidos.count(),
      pagos: await db.pagos.count()
    };
    const cierre = await cerrarCaja({
      montoCierreEfectivo: 13000,
      montoCierreTarjetas: 7000,
      fechaCierre: '2026-01-01T18:00:00.000Z'
    });

    expect(resumen).toMatchObject({
      montoInicial: 10000,
      ventasEfectivo: 2500,
      efectivoEsperado: 12500
    });
    expect(antes).toEqual({ cajaSesion: 2, pedidos: 2, pagos: 4 });
    expect(cierre).toMatchObject({
      montoCierreEfectivo: 13000,
      diferencia: 500
    });
    expect(resumen.efectivoEsperado).toBe(cierre.montoCierreEfectivo - cierre.diferencia);
  });
});
