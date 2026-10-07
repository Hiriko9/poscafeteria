import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../database.js';
import { resetDatabase } from '../testUtils.js';
import { abrirCaja, cerrarCaja, obtenerSesionAbierta } from './cajaRepository.js';

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
});
