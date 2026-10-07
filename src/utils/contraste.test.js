import { describe, expect, it } from 'vitest';
import { calcularContraste } from './contraste.js';

describe('calcularContraste', () => {
  it('calcula la razón de contraste WCAG y acepta hex abreviado', () => {
    expect(calcularContraste('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(calcularContraste('#000', '#FFF')).toBeCloseTo(21, 5);
  });

  it.each([
    ['cafe en hueso', '#5C3A21', '#F4F0EA'],
    ['cafe en blanco', '#5C3A21', '#FFFFFF'],
    ['cafe en arena', '#5C3A21', '#EFEBE9'],
    ['blanco en cafe', '#FFFFFF', '#5C3A21'],
    ['blanco en exito', '#FFFFFF', '#2E7D32'],
    ['blanco en terracota', '#FFFFFF', '#C62828'],
    ['exito en blanco', '#2E7D32', '#FFFFFF'],
    ['terracota en blanco', '#C62828', '#FFFFFF']
  ])('cumple 4.5:1: %s', (_nombre, primerPlano, fondo) => {
    expect(calcularContraste(primerPlano, fondo)).toBeGreaterThanOrEqual(4.5);
  });

  it('rechaza colores que no estén en hexadecimal válido', () => {
    expect(() => calcularContraste('cafe', '#FFFFFF')).toThrow(/hexadecimal/);
  });
});
