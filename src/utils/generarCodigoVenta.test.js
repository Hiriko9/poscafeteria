import { describe, expect, it } from 'vitest';
import { generarCodigoVenta } from './generarCodigoVenta.js';

describe('generarCodigoVenta', () => {
  it('genera el código con año y secuencia de cuatro dígitos', () => {
    expect(generarCodigoVenta(2026, 7)).toBe('VEN-2026-0007');
    expect(generarCodigoVenta(2026, 1234)).toBe('VEN-2026-1234');
  });

  it('no trunca secuencias mayores de cuatro dígitos', () => {
    expect(generarCodigoVenta(2026, 12345)).toBe('VEN-2026-12345');
  });

  it('rechaza valores inválidos', () => {
    expect(() => generarCodigoVenta(10000, 1)).toThrow('año');
    expect(() => generarCodigoVenta(2026, -1)).toThrow('secuencia');
  });
});
