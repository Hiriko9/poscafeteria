// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CajaProvider } from '../../context/CajaContext.jsx';
import { ComandaProvider, useComandaContext } from '../../context/ComandaContext.jsx';
import { db } from '../../db/database.js';
import { seedDatabase } from '../../db/seed.js';
import { resetDatabase } from '../../db/testUtils.js';
import { abrirCaja } from '../../db/repositories/cajaRepository.js';
import { formatearSoles } from '../../utils/formatters.js';
import ComandaPanel from './ComandaPanel.jsx';

function AccionesPrueba() {
  const comanda = useComandaContext();
  return (
    <div>
      <button onClick={() => comanda.agregarProducto({ id: 1, nombre: 'Latte', precio: 1200 })} type="button">
        Añadir Latte
      </button>
      <button onClick={() => comanda.agregarProducto({ id: 2, nombre: 'Muffin', precio: 850 })} type="button">
        Añadir Muffin
      </button>
      <button onClick={() => comanda.seleccionarMesa(1)} type="button">Mesa 1</button>
      <button onClick={() => comanda.cambiarTipoPedido('PARA_LLEVAR')} type="button">Para llevar</button>
    </div>
  );
}

async function prepararBase() {
  await resetDatabase();
  await seedDatabase();
  await abrirCaja({ montoInicial: 10000 });
}

function renderComanda(onCobrar = vi.fn()) {
  return render(
    <CajaProvider>
      <ComandaProvider>
        <AccionesPrueba />
        <ComandaPanel onCobrar={onCobrar} />
      </ComandaProvider>
    </CajaProvider>
  );
}

describe('ComandaPanel', () => {
  beforeEach(prepararBase);
  afterEach(() => db.close());

  it('muestra el estado vacío y habilita Cobrar solo con productos y Para llevar', async () => {
    renderComanda();
    const cobrar = screen.getByRole('button', { name: 'Cobrar' });

    expect(screen.getByText('Toca un producto para agregarlo')).toBeInTheDocument();
    expect(cobrar).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Añadir Latte' }));
    expect(cobrar).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Para llevar' }));
    expect(cobrar).toBeEnabled();
  });

  it('suma, resta, quita, edita nota y presenta el ejemplo de totales', async () => {
    renderComanda();
    fireEvent.click(screen.getByRole('button', { name: 'Añadir Latte' }));
    fireEvent.click(screen.getByRole('button', { name: 'Añadir Latte' }));
    fireEvent.click(screen.getByRole('button', { name: 'Añadir Muffin' }));

    expect(screen.getByText(formatearSoles(3250))).toBeInTheDocument();
    expect(screen.getByText(formatearSoles(585))).toBeInTheDocument();
    expect(screen.getByText(formatearSoles(3835))).toBeInTheDocument();
    expect(screen.getByLabelText('Cantidad de Latte')).toHaveTextContent('2');

    fireEvent.change(screen.getAllByLabelText('Nota de preparación')[0], {
      target: { value: 'Sin azúcar' }
    });
    expect(screen.getAllByLabelText('Nota de preparación')[0]).toHaveValue('Sin azúcar');

    fireEvent.click(screen.getByRole('button', { name: 'Restar Latte' }));
    expect(screen.getByLabelText('Cantidad de Latte')).toHaveTextContent('1');
    fireEvent.click(screen.getByRole('button', { name: 'Quitar Muffin' }));
    expect(screen.queryByText('Muffin')).not.toBeInTheDocument();
  });

  it('pide confirmación antes de cancelar y deja intacta la comanda si se conserva', async () => {
    renderComanda();
    fireEvent.click(screen.getByRole('button', { name: 'Mesa 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Añadir Latte' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar comanda' }));
    expect(screen.getByText('Latte')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Seguir con la comanda' }));
    expect(screen.getByText('Latte')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar comanda' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));
    await waitFor(() => expect(screen.getByText('Toca un producto para agregarlo')).toBeInTheDocument());
    await waitFor(async () => expect(await db.mesas.get(1)).toMatchObject({ estado: 'LIBRE' }));
  });
});
