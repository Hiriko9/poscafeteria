import { describe, expect, it } from 'vitest';
import { calcularTotales, calcularVuelto } from './calcularTotales.js';

describe('calcularTotales', () => {
  it('calcula el ejemplo de subtotal, IGV y total del requisito', () => {
    expect(
      calcularTotales([
        { precio: 1200, cantidad: 2 },
        { precio: 850, cantidad: 1 }
      ])
    ).toEqual({ subtotal: 3250, igv: 585, total: 3835 });
  });

  it('redondea el IGV al entero más cercano en céntimos', () => {
    expect(calcularTotales([{ precio: 1, cantidad: 1 }])).toEqual({
      subtotal: 1,
      igv: 0,
      total: 1
    });
    expect(calcularTotales([{ precio: 3, cantidad: 1 }])).toEqual({
      subtotal: 3,
      igv: 1,
      total: 4
    });
  });

  it('rechaza comandas vacías y cantidades o precios inválidos', () => {
    expect(() => calcularTotales([])).toThrow('al menos un producto');
    expect(() => calcularTotales([{ precio: 100, cantidad: 0 }])).toThrow('cantidad');
    expect(() => calcularTotales([{ precio: -1, cantidad: 1 }])).toThrow('precio');
  });
});

describe('calcularVuelto', () => {
  it('calcula vuelto y nunca devuelve un valor negativo', () => {
    expect(calcularVuelto(3835, 5000)).toBe(1165);
    expect(calcularVuelto(3835, 3000)).toBe(0);
  });
});
