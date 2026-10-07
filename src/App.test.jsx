// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { db } from './db/database.js';
import { resetDatabase } from './db/testUtils.js';
import { ToastProvider } from './components/ui/Toast.jsx';
import { CajaProvider, useCajaContext } from './context/CajaContext.jsx';
import { ComandaProvider, useComandaContext } from './context/ComandaContext.jsx';
import CierreCajaZModal from './components/modals/CierreCajaZModal.jsx';
import TopBar from './components/layout/TopBar.jsx';

function CajaConComandaEnCurso() {
  const comanda = useComandaContext();
  const caja = useCajaContext();
  const [mostrarCierre, setMostrarCierre] = useState(false);

  return (
    <>
      <TopBar onCerrarCaja={() => setMostrarCierre(true)} />
      <button
        onClick={() => comanda.agregarProducto({ id: 1, nombre: 'Latte', precio: 1200 })}
        type="button"
      >
        Agregar producto de prueba
      </button>
      {caja.estado === 'CAJA_ABIERTA' && mostrarCierre && (
        <CierreCajaZModal onClose={() => setMostrarCierre(false)} />
      )}
    </>
  );
}

async function abrirCajaDesdeInterfaz() {
  await screen.findByRole('dialog', { name: 'Apertura de caja' });
  fireEvent.change(screen.getByLabelText('Monto inicial (S/)'), { target: { value: '10.00' } });
  fireEvent.click(screen.getByRole('button', { name: 'Abrir caja' }));
  await screen.findByText('ABIERTA');
}

describe('Fase 4: apertura y layout', () => {
  beforeEach(resetDatabase);
  afterEach(() => db.close());

  it('bloquea las tres columnas y no permite cerrar el modal con Escape', async () => {
    const { container } = render(<App />);

    const dialog = await screen.findByRole('dialog', { name: 'Apertura de caja' });
    const columnas = container.querySelector('[inert]');

    expect(columnas).not.toBeNull();
    expect(columnas.getAttribute('aria-hidden')).toBe('true');
    expect(within(columnas).getByLabelText('Mesas e historial')).toBeInTheDocument();
    expect(within(columnas).getByLabelText('Catálogo')).toBeInTheDocument();
    expect(within(columnas).getByLabelText('Comanda y pago')).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'apertura-caja-titulo');
    expect(document.activeElement).toBe(dialog);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog', { name: 'Apertura de caja' })).toBeInTheDocument();
  });

  it('avisa si la tablet está en vertical sin bloquear la apertura de caja', async () => {
    const matchMediaOriginal = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    try {
      render(<App />);
      expect(await screen.findByText(
        'Gira la tablet a horizontal para una mejor experiencia'
      )).toBeInTheDocument();
      expect(screen.getByRole('dialog', { name: 'Apertura de caja' })).toBeInTheDocument();
    } finally {
      if (matchMediaOriginal) window.matchMedia = matchMediaOriginal;
      else delete window.matchMedia;
    }
  });

  it.each(['', '-1.00', 'texto', '1.234'])(
    'rechaza monto inicial inválido %j sin abrir la caja',
    async (monto) => {
      render(<App />);
      await screen.findByRole('dialog', { name: 'Apertura de caja' });
      const input = screen.getByLabelText('Monto inicial (S/)');

      if (monto !== '') fireEvent.change(input, { target: { value: monto } });
      fireEvent.click(screen.getByRole('button', { name: 'Abrir caja' }));

      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('dialog', { name: 'Apertura de caja' })).toBeInTheDocument();
      expect(await db.cajaSesion.count()).toBe(0);
    }
  );

  it('abre con monto válido, actualiza TopBar y habilita las columnas', async () => {
    const { container } = render(<App />);
    await screen.findByRole('dialog', { name: 'Apertura de caja' });
    fireEvent.change(screen.getByLabelText('Monto inicial (S/)'), {
      target: { value: '12.50' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Abrir caja' }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Apertura de caja' })).toBeNull());
    expect(screen.getByText('ABIERTA')).toBeInTheDocument();
    expect(container.querySelector('[inert]')).toBeNull();
    expect(await db.cajaSesion.toArray()).toEqual([
      expect.objectContaining({ estado: 'ABIERTA', montoInicial: 1250 })
    ]);
    expect(await db.mesas.count()).toBe(10);
    expect(await db.productos.count()).toBe(9);
  });
});

describe('Fase 4: cierre Z', () => {
  beforeEach(resetDatabase);
  afterEach(() => db.close());

  it.each([
    ['16.00', /Sobrante: S\/ 1\.00/],
    ['14.00', /Faltante: S\/ 1\.00/],
    ['15.00', /Cuadra: S\/ 0\.00/]
  ])('muestra arqueo y diferencia para el contado %s', async (efectivoContado, diferencia) => {
    render(<App />);
    await abrirCajaDesdeInterfaz();
    const sesion = await db.cajaSesion.where('estado').equals('ABIERTA').first();
    const pedidoId = await db.pedidos.add({
      codigoVenta: 'VEN-2026-0001',
      cajaSesionId: sesion.id,
      mesaId: 0,
      tipoPedido: 'PARA_LLEVAR',
      estado: 'PAGADO',
      subtotal: 5000,
      igv: 900,
      total: 5900,
      fechaHora: '2026-10-07T12:00:00.000Z'
    });
    await db.pagos.bulkAdd([
      { pedidoId, metodo: 'EFECTIVO', montoCobrado: 500 },
      { pedidoId, metodo: 'YAPE', montoCobrado: 2000 },
      { pedidoId, metodo: 'TARJETA', montoCobrado: 3000 }
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir cierre Z' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cierre de caja Z' });
    expect(await within(dialog).findByText('S/ 10.00')).toBeInTheDocument();
    expect(within(dialog).getByText('S/ 5.00')).toBeInTheDocument();
    expect(within(dialog).getByText('S/ 15.00')).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText('Efectivo contado (S/)'), {
      target: { value: efectivoContado }
    });
    fireEvent.change(within(dialog).getByLabelText('Tarjetas contadas (S/)'), {
      target: { value: '50.00' }
    });
    expect(within(dialog).getByRole('status')).toHaveTextContent(diferencia);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Cierre de caja Z' })).toBeNull());
  });

  it('rechaza el cierre con comanda en curso y exige confirmación; al cerrar permite otra apertura', async () => {
    await db.cajaSesion.add({
      fechaApertura: '2026-10-07T08:00:00.000Z',
      montoInicial: 10000,
      estado: 'ABIERTA'
    });

    render(
      <ToastProvider>
        <CajaProvider>
          <ComandaProvider>
            <CajaConComandaEnCurso />
          </ComandaProvider>
        </CajaProvider>
      </ToastProvider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Agregar producto de prueba' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir cierre Z' }));
    const dialogBloqueado = await screen.findByRole('dialog', { name: 'Cierre de caja Z' });
    expect(
      within(dialogBloqueado).getByText(
        'Hay una comanda en curso. Cóbrala o cancélala antes de cerrar la caja.'
      )
    ).toBeInTheDocument();
    expect(within(dialogBloqueado).getByRole('button', { name: 'Cerrar caja' })).toBeDisabled();
  });

  it('confirma el cierre, vuelve a bloquear columnas y permite abrir una nueva sesión', async () => {
    const { container } = render(<App />);
    await abrirCajaDesdeInterfaz();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir cierre Z' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cierre de caja Z' });
    fireEvent.change(await within(dialog).findByLabelText('Efectivo contado (S/)'), {
      target: { value: '10.00' }
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cerrar caja' }));
    expect(within(dialog).getByText(/¿Confirmas el cierre/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar cierre' }));

    await screen.findByRole('dialog', { name: 'Apertura de caja' });
    expect(container.querySelector('[inert]')).not.toBeNull();
    expect(await db.cajaSesion.where('estado').equals('CERRADA').count()).toBe(1);
    fireEvent.change(screen.getByLabelText('Monto inicial (S/)'), {
      target: { value: '20.00' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Abrir caja' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Apertura de caja' })).toBeNull()
    );
    expect(await db.cajaSesion.where('estado').equals('ABIERTA').count()).toBe(1);
  });
});
