// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CajaProvider } from '../../context/CajaContext.jsx';
import { ComandaProvider, useComandaContext } from '../../context/ComandaContext.jsx';
import { db } from '../../db/database.js';
import { seedDatabase } from '../../db/seed.js';
import { resetDatabase } from '../../db/testUtils.js';
import MesasPanel from './MesasPanel.jsx';

function ResumenComanda() {
  const comanda = useComandaContext();

  return (
    <div>
      <output aria-label="Mesa seleccionada">{String(comanda.mesaId)}</output>
      <button
        onClick={() => comanda.agregarProducto({ id: 1, nombre: 'Latte', precio: 1200 })}
        type="button"
      >
        Agregar producto de prueba
      </button>
      <button onClick={comanda.limpiar} type="button">Cancelar comanda</button>
    </div>
  );
}

function renderMesas() {
  return render(
    <CajaProvider>
      <ComandaProvider>
        <ResumenComanda />
        <MesasPanel />
      </ComandaProvider>
    </CajaProvider>
  );
}

describe('MesasPanel', () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedDatabase();
  });
  afterEach(() => db.close());

  it('asigna la mesa libre seleccionada y permite cambiar a Para llevar sin ocupar mesas', async () => {
    renderMesas();
    const mesaUno = await screen.findByRole('button', { name: /Mesa 1.*Libre/ });

    fireEvent.click(mesaUno);
    expect(screen.getByLabelText('Mesa seleccionada')).toHaveTextContent('1');

    fireEvent.click(screen.getByRole('button', { name: 'Para llevar' }));
    expect(screen.getByLabelText('Mesa seleccionada')).toHaveTextContent('0');
    expect(await db.mesas.where('estado').equals('OCUPADA').count()).toBe(0);
  });

  it('ocupa la mesa al agregar el primer producto y la libera al cancelar', async () => {
    renderMesas();
    fireEvent.click(await screen.findByRole('button', { name: /Mesa 1.*Libre/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Agregar producto de prueba' }));

    await waitFor(async () => {
      expect(await db.mesas.get(1)).toMatchObject({ estado: 'OCUPADA' });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar comanda' }));

    await waitFor(async () => {
      expect(await db.mesas.get(1)).toMatchObject({ estado: 'LIBRE' });
    });
  });

  it('libera al iniciar una mesa ocupada que no tiene pedido pendiente', async () => {
    await db.mesas.update(1, { estado: 'OCUPADA' });
    renderMesas();

    expect(await screen.findByRole('button', { name: /Mesa 1.*Libre/ })).toBeInTheDocument();
    expect(await db.mesas.get(1)).toMatchObject({ estado: 'LIBRE' });
  });

  it('muestra las pestañas accesibles y el texto provisional de historial', async () => {
    renderMesas();

    const tablist = screen.getByRole('tablist', { name: 'Secciones de la columna' });
    fireEvent.click(withinTab(tablist, 'Historial'));

    expect(await screen.findByText('Historial: disponible en la siguiente fase')).toBeInTheDocument();
  });
});

function withinTab(tablist, nombre) {
  return Array.from(tablist.querySelectorAll('[role="tab"]')).find((tab) => tab.textContent === nombre);
}
