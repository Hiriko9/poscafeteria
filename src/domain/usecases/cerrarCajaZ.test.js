import { describe, expect, it } from 'vitest';
import { cerrarCajaZ } from './cerrarCajaZ.js';

describe('cerrarCajaZ', () => {
  it.each([
    [12000, 5000, 18000, 17000, 1000],
    [12000, 5000, 16000, 17000, -1000],
    [12000, 5000, 17000, 17000, 0]
  ])(
    'calcula efectivo esperado y diferencia (%i + %i, contado %i)',
    (montoInicial, ventasEfectivo, montoCierreEfectivo, esperado, diferencia) => {
      expect(cerrarCajaZ({ montoInicial, ventasEfectivo, montoCierreEfectivo })).toMatchObject({
        estado: 'CERRADA',
        efectivoEsperado: esperado,
        diferencia
      });
    }
  );

  it('rechaza valores de arqueo que no sean enteros no negativos', () => {
    expect(() =>
      cerrarCajaZ({ montoInicial: 100, ventasEfectivo: -1, montoCierreEfectivo: 100 })
    ).toThrow('ventas en efectivo');
  });
});
