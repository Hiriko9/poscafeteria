// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CajaProvider, useCajaContext } from '../../context/CajaContext.jsx';
import { ComandaProvider, useComandaContext } from '../../context/ComandaContext.jsx';
import { db } from '../../db/database.js';
import { abrirCaja } from '../../db/repositories/cajaRepository.js';
import { resetDatabase } from '../../db/testUtils.js';
import { ToastProvider } from '../ui/Toast.jsx';
import PagoPanel from './PagoPanel.jsx';

function PrepararComanda() {
  const comanda = useComandaContext();
  const caja = useCajaContext();
  return (
    <div>
      <output aria-label="Estado de caja">{caja.estado}</output>
      <output aria-label="Comanda actual">
        {comanda.items.map((item) => `${item.nombre}:${item.cantidad}`).join(',')}
      </output>
      <button
        onClick={() => {
          comanda.agregarProducto({ id: 1, nombre: 'Latte', precio: 1200 });
          comanda.agregarProducto({ id: 1, nombre: 'Latte', precio: 1200 });
          comanda.agregarProducto({ id: 2, nombre: 'Muffin', precio: 850 });
          comanda.cambiarTipoPedido('PARA_LLEVAR');
        }}
        type="button"
      >
        Preparar venta
      </button>
    </div>
  );
}

async function prepararBase() {
  await resetDatabase();
  await abrirCaja({ montoInicial: 1000 });
}

function renderPago() {
  return render(
    <ToastProvider>
      <CajaProvider>
        <ComandaProvider>
          <PrepararComanda />
          <PagoPanel onVolver={() => {}} />
        </ComandaProvider>
      </CajaProvider>
    </ToastProvider>
  );
}

async function esperarCajaAbierta() {
  await screen.findByText('CAJA_ABIERTA');
}

describe('PagoPanel', () => {
  beforeEach(prepararBase);
  afterEach(() => db.close());

  it('calcula el vuelto y permite establecer el monto exacto', async () => {
    renderPago();
    await esperarCajaAbierta();
    fireEvent.click(screen.getByRole('button', { name: 'Preparar venta' }));

    fireEvent.change(screen.getByLabelText('Monto recibido (S/)'), {
      target: { value: '50.00' }
    });
    expect(screen.getByText('Vuelto: S/ 11.65')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Exacto' }));
    expect(screen.getByLabelText('Monto recibido (S/)')).toHaveValue('38.35');
    expect(screen.getByText('Vuelto: S/ 0.00')).toBeInTheDocument();
  });

  it('bloquea el cobro si el efectivo recibido es insuficiente', async () => {
    renderPago();
    await esperarCajaAbierta();
    fireEvent.click(screen.getByRole('button', { name: 'Preparar venta' }));
    fireEvent.change(screen.getByLabelText('Monto recibido (S/)'), {
      target: { value: '20.00' }
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Monto insuficiente');
    expect(screen.getByRole('button', { name: 'Confirmar pago' })).toBeDisabled();
    expect(await db.pedidos.count()).toBe(0);
  });

  it('volver a la comanda conserva productos y registra una sola venta con doble clic', async () => {
    let volver = 0;
    const vista = render(
      <ToastProvider>
        <CajaProvider>
          <ComandaProvider>
            <PrepararComanda />
            <PagoPanel onVolver={() => { volver += 1; }} />
          </ComandaProvider>
        </CajaProvider>
      </ToastProvider>
    );
    await esperarCajaAbierta();
    fireEvent.click(screen.getByRole('button', { name: 'Preparar venta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Volver a la comanda' }));
    expect(volver).toBe(1);
    expect(screen.getByLabelText('Comanda actual')).toHaveTextContent('Latte:2,Muffin:1');
    expect(screen.getByLabelText('Monto recibido (S/)')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Monto recibido (S/)'), {
      target: { value: '50.00' }
    });
    const confirmar = screen.getByRole('button', { name: 'Confirmar pago' });
    fireEvent.click(confirmar);
    fireEvent.click(confirmar);

    await waitFor(async () => expect(await db.pedidos.count()).toBe(1));
    expect(await db.pagos.count()).toBe(1);
    vista.unmount();
  });

  it.each([
    ['Yape', 'YAPE'],
    ['Tarjeta', 'TARJETA']
  ])('%s no solicita monto recibido y registra el total', async (metodoNombre, metodo) => {
    renderPago();
    await esperarCajaAbierta();
    fireEvent.click(screen.getByRole('button', { name: 'Preparar venta' }));
    fireEvent.click(screen.getByRole('button', { name: metodoNombre }));

    expect(screen.queryByLabelText('Monto recibido (S/)')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }));

    await waitFor(async () => expect(await db.pedidos.count()).toBe(1));
    expect(await db.pagos.toArray()).toEqual([
      expect.objectContaining({ metodo, montoRecibido: 3835, montoCobrado: 3835 })
    ]);
  });
});
