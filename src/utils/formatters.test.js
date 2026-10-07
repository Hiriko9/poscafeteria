import { describe, expect, it } from 'vitest';
import { formatearFecha, formatearSoles } from './formatters.js';

describe('formatearSoles', () => {
  it.each([
    [0, 'S/ 0.00'],
    [5, 'S/ 0.05'],
    [3835, 'S/ 38.35']
  ])('formatea %i céntimos como %s', (centimos, esperado) => {
    expect(formatearSoles(centimos)).toBe(esperado);
  });

  it('rechaza valores que no sean enteros seguros', () => {
    expect(() => formatearSoles(1.5)).toThrow('entero seguro');
  });
});

describe('formatearFecha', () => {
  it('formatea una fecha usando la zona horaria de Perú', () => {
    expect(formatearFecha('2026-01-02T15:04:00.000Z').replace(/\u00a0/g, ' ')).toBe(
      '2/01/26, 10:04 a. m.'
    );
  });

  it('rechaza fechas inválidas', () => {
    expect(() => formatearFecha('fecha inválida')).toThrow('fecha válido');
  });
});
