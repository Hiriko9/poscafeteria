// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CajaProvider } from '../../context/CajaContext.jsx';
import { ComandaProvider, useComandaContext } from '../../context/ComandaContext.jsx';
import { db } from '../../db/database.js';
import { seedDatabase } from '../../db/seed.js';
import { resetDatabase } from '../../db/testUtils.js';
import CatalogoPanel from './CatalogoPanel.jsx';
import ProductoCard from './ProductoCard.jsx';

function ResumenComanda() {
  const { items } = useComandaContext();

  return <output aria-label="Productos en comanda">{items.map(({ nombre, cantidad }) => `${nombre}: ${cantidad}`).join(', ')}</output>;
}

function renderCatalogo() {
  return render(
    <CajaProvider>
      <ComandaProvider>
        <ResumenComanda />
        <CatalogoPanel />
      </ComandaProvider>
    </CajaProvider>
  );
}

describe('CatalogoPanel', () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedDatabase();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    return db.close();
  });

  it('filtra los productos al cambiar la categoría accesible', async () => {
    renderCatalogo();
    expect(await screen.findByRole('button', { name: /Agregar Latte/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Bebidas frías' }));

    expect(await screen.findByRole('button', { name: /Agregar Limonada/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Agregar Latte/ })).not.toBeInTheDocument();
  });

  it('agrega un producto con cada toque y suma las cantidades', async () => {
    renderCatalogo();
    const latte = await screen.findByRole('button', { name: /Agregar Latte/ });

    fireEvent.click(latte);
    fireEvent.click(latte);

    await waitFor(() => {
      expect(screen.getByLabelText('Productos en comanda')).toHaveTextContent('Latte: 2');
    });
  });

  it('muestra un respaldo si falla la imagen del producto', async () => {
    renderCatalogo();
    const imagen = await screen.findByRole('img', { name: 'Latte' });

    fireEvent.error(imagen);

    expect(screen.queryByRole('img', { name: 'Latte' })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Imagen no disponible para Latte' })).toBeInTheDocument();
  });

  it('no vuelve a renderizar una tarjeta existente al agregar otro producto', async () => {
    const renderCard = vi.spyOn(ProductoCard, 'type');
    renderCatalogo();
    fireEvent.click(await screen.findByRole('button', { name: /Agregar Latte/ }));

    await waitFor(() => {
      expect(screen.getByLabelText('Productos en comanda')).toHaveTextContent('Latte: 1');
    });
    const rendersLatteAntes = renderCard.mock.calls.filter(
      ([props]) => props.producto.nombre === 'Latte'
    ).length;

    fireEvent.click(screen.getByRole('button', { name: /Agregar Americano/ }));

    await waitFor(() => {
      expect(screen.getByLabelText('Productos en comanda')).toHaveTextContent('Americano: 1');
    });
    const rendersLatteDespues = renderCard.mock.calls.filter(
      ([props]) => props.producto.nombre === 'Latte'
    ).length;

    expect(rendersLatteDespues).toBe(rendersLatteAntes);
  });
});
