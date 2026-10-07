import { describe, expect, it } from 'vitest';
import { abrirCaja, validarMontoInicial } from './abrirCaja.js';

describe('abrirCaja', () => {
  it('valida y construye una apertura de caja sin persistirla', () => {
    expect(validarMontoInicial(0)).toEqual({ valido: true, error: null });
    expect(
      abrirCaja({ montoInicial: 12500, fechaApertura: '2026-10-07T08:00:00.000Z' })
    ).toEqual({
      montoInicial: 12500,
      estado: 'ABIERTA',
      fechaApertura: '2026-10-07T08:00:00.000Z'
    });
  });

  it('rechaza montos iniciales negativos, decimales o no numéricos', () => {
    for (const monto of [-1, 1.5, '100']) {
      expect(validarMontoInicial(monto).valido).toBe(false);
      expect(() => abrirCaja({ montoInicial: monto })).toThrow('entero no negativo');
    }
  });
});
