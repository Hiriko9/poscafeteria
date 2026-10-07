import { describe, expect, it } from 'vitest';
import {
  CATEGORIAS_PRODUCTO,
  ESTADOS_CAJA,
  ESTADOS_MESA,
  IGV_RATE_PCT,
  MESA_VIRTUAL_ID,
  METODOS_PAGO,
  TIPOS_PEDIDO
} from './constants.js';

describe('constantes del POS', () => {
  it('expone los valores definidos por las reglas del negocio', () => {
    expect(IGV_RATE_PCT).toBe(18);
    expect(MESA_VIRTUAL_ID).toBe(0);
    expect(Object.values(ESTADOS_CAJA)).toEqual(['ABIERTA', 'CERRADA']);
    expect(Object.values(ESTADOS_MESA)).toEqual(['LIBRE', 'OCUPADA']);
    expect(Object.values(TIPOS_PEDIDO)).toEqual(['COMER_AQUI', 'PARA_LLEVAR']);
    expect(Object.values(METODOS_PAGO)).toEqual(['EFECTIVO', 'YAPE', 'TARJETA']);
    expect(Object.values(CATEGORIAS_PRODUCTO)).toEqual(['CALIENTES', 'FRIAS', 'REPOSTERIA']);
  });
});
