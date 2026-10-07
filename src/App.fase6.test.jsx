// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App.jsx';
import { db } from './db/database.js';
import { abrirCaja } from './db/repositories/cajaRepository.js';
import { resetDatabase } from './db/testUtils.js';
import { seedDatabase } from './db/seed.js';

async function prepararBase() {
  await resetDatabase();
  await seedDatabase();
  await abrirCaja({ montoInicial: 10000 });
}

async function pagarVentaEnEfectivo() {
  fireEvent.click(await screen.findByRole('button', { name: /Mesa 1.*Libre/ }));
  fireEvent.click(await screen.findByRole('button', { name: /Agregar Latte/ }));
  fireEvent.click(screen.getByRole('button', { name: /Agregar Latte/ }));
  fireEvent.click(screen.getByRole('tab', { name: 'Repostería' }));
  fireEvent.click(await screen.findByRole('button', { name: /Agregar Muffin/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Cobrar' }));
  fireEvent.change(screen.getByLabelText('Monto recibido (S/)'), {
    target: { value: '50.00' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }));
}

describe('Fase 6: integración de comanda, pago e historial', () => {
  beforeEach(prepararBase);
  afterEach(() => db.close());

  it('completa dos ventas consecutivas, presenta tickets e integra el efectivo al cierre Z', async () => {
    render(<App />);
    await pagarVentaEnEfectivo();

    const anio = new Date().getUTCFullYear();
    const codigoPrimero = `VEN-${anio}-0001`;
    const ticketPrimero = await screen.findByRole('article', { name: `Ticket ${codigoPrimero}` });
    expect(within(ticketPrimero).getByText(codigoPrimero)).toBeInTheDocument();
    expect(within(ticketPrimero).getByText('S/ 11.65')).toBeInTheDocument();
    expect(await db.mesas.get(1)).toMatchObject({ estado: 'LIBRE' });

    fireEvent.click(within(ticketPrimero).getByRole('button', { name: 'Nueva venta' }));
    expect(await screen.findByText('Toca un producto para agregarlo')).toBeInTheDocument();
    expect(await db.pedidos.count()).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Para llevar', exact: true }));
    fireEvent.click(screen.getByRole('tab', { name: 'Bebidas calientes' }));
    fireEvent.click(await screen.findByRole('button', { name: /Agregar Latte/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cobrar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tarjeta' }));
    expect(screen.queryByLabelText('Monto recibido (S/)')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }));

    const codigoSegundo = `VEN-${anio}-0002`;
    const ticketSegundo = await screen.findByRole('article', { name: `Ticket ${codigoSegundo}` });
    expect(within(ticketSegundo).getByText('Tarjeta')).toBeInTheDocument();
    expect(await db.pedidos.count()).toBe(2);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir cierre Z' }));
    const cierre = await screen.findByRole('dialog', { name: 'Cierre de caja Z' });
    expect(await within(cierre).findByText('S/ 38.35')).toBeInTheDocument();
    expect(within(cierre).getByText('S/ 138.35')).toBeInTheDocument();
    fireEvent.click(within(cierre).getByRole('button', { name: 'Cancelar' }));

    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    const ventaMasReciente = await screen.findByRole('button', { name: `Ver venta ${codigoSegundo}` });
    expect(screen.getByRole('region', { name: /2026/ })).toBeInTheDocument();
    fireEvent.click(ventaMasReciente);
    const ticketHistorico = screen.getByRole('article', { name: `Ticket ${codigoSegundo}` });
    expect(within(ticketHistorico).getByText('Tarjeta')).toBeInTheDocument();
    expect(within(ticketHistorico).queryByRole('button', { name: 'Nueva venta' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Ver venta ${codigoPrimero}` })).toBeInTheDocument();
  });

  it('mantiene la comanda al consultar historial y volver a Mesas', async () => {
    render(<App />);
    await pagarVentaEnEfectivo();
    const codigo = `VEN-${new Date().getUTCFullYear()}-0001`;
    const ticket = await screen.findByRole('article', { name: `Ticket ${codigo}` });
    fireEvent.click(within(ticket).getByRole('button', { name: 'Nueva venta' }));
    fireEvent.click(await screen.findByRole('button', { name: /Mesa 2.*Libre/ }));
    fireEvent.click(screen.getByRole('tab', { name: 'Repostería' }));
    fireEvent.click(await screen.findByRole('button', { name: /Agregar Muffin/ }));

    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    fireEvent.click(await screen.findByRole('button', { name: `Ver venta ${codigo}` }));
    expect(screen.getByRole('article', { name: `Ticket ${codigo}` })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Mesas' }));
    expect((await screen.findAllByText('Muffin')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('S/ 8.50').length).toBeGreaterThan(0);
    await waitFor(async () => expect(await db.mesas.get(2)).toMatchObject({ estado: 'OCUPADA' }));
  });
});
