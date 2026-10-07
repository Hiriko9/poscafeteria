import { describe, expect, it } from 'vitest';
import { construirPayloadVenta, validarVenta } from './confirmarVenta.js';

const ventaValida = (overrides = {}) => ({
  items: [
    { id: 1, nombre: 'Latte', precio: 1200, cantidad: 2 },
    { id: 2, nombre: 'Muffin', precio: 850, cantidad: 1 }
  ],
  mesaId: 1,
  tipoPedido: 'COMER_AQUI',
  metodoPago: 'EFECTIVO',
  montoRecibido: 5000,
  cajaSesionId: 3,
  codigoVenta: 'VEN-2026-0001',
  fechaHora: '2026-10-07T12:00:00.000Z',
  ...overrides
});

describe('validarVenta', () => {
  it('acepta venta válida para mesa física o Para llevar', () => {
    expect(validarVenta(ventaValida())).toEqual({ valido: true, errores: [] });
    expect(
      validarVenta(ventaValida({ mesaId: 0, tipoPedido: 'PARA_LLEVAR' }))
    ).toEqual({ valido: true, errores: [] });
  });

  it('reporta los errores de comanda vacía, cantidad, precio y método', () => {
    const resultado = validarVenta(
      ventaValida({
        items: [{ id: 1, precio: -1, cantidad: 0 }],
        metodoPago: 'CHEQUE'
      })
    );

    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toEqual(
      expect.arrayContaining([
        expect.stringContaining('cantidad'),
        expect.stringContaining('precio'),
        expect.stringContaining('método de pago')
      ])
    );
    expect(validarVenta(ventaValida({ items: [] })).errores).toContain(
      'La comanda debe contener al menos un producto.'
    );
  });

  it('rechaza el pago cuando el monto recibido es menor al total', () => {
    expect(validarVenta(ventaValida({ montoRecibido: 3834 })).errores).toContain(
      'El monto recibido es insuficiente para cubrir el total de la venta.'
    );
    expect(() => construirPayloadVenta(ventaValida({ montoRecibido: 3834 }))).toThrow(
      'monto recibido es insuficiente'
    );
  });
});

describe('construirPayloadVenta', () => {
  it('construye el payload aceptado por ventaRepository.registrarVenta', () => {
    expect(construirPayloadVenta(ventaValida())).toEqual({
      pedido: {
        codigoVenta: 'VEN-2026-0001',
        cajaSesionId: 3,
        mesaId: 1,
        tipoPedido: 'COMER_AQUI',
        estado: 'PAGADO',
        subtotal: 3250,
        igv: 585,
        total: 3835,
        fechaHora: '2026-10-07T12:00:00.000Z'
      },
      detalles: [
        { productoId: 1, cantidad: 2, precioUnitario: 1200, nota: '' },
        { productoId: 2, cantidad: 1, precioUnitario: 850, nota: '' }
      ],
      pago: {
        metodo: 'EFECTIVO',
        montoRecibido: 5000,
        montoCobrado: 3835,
        vuelto: 1165
      }
    });
  });
});
