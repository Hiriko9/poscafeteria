// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { convertirSolesACentimos } from './convertirSolesACentimos.js';

describe('convertirSolesACentimos', () => {
  it.each([
    ['0', 0],
    ['12', 1200],
    ['12.5', 1250],
    ['12.50', 1250],
    ['0.05', 5],
    ['12,50', 1250]
  ])('convierte %s soles en %i céntimos', (valor, esperado) => {
    expect(convertirSolesACentimos(valor)).toBe(esperado);
  });

  it.each(['', '  ', '-1', 'texto', '12.500', '1e2', '.50', '1.'])(
    'rechaza el monto inválido %j',
    (valor) => {
      expect(() => convertirSolesACentimos(valor)).toThrow();
    }
  );
});
