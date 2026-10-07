// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App.jsx';
import { db } from './db/database.js';
import { abrirCaja } from './db/repositories/cajaRepository.js';
import { resetDatabase } from './db/testUtils.js';
import { seedDatabase } from './db/seed.js';

describe('aviso de actualización PWA', () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedDatabase();
    await abrirCaja({ montoInicial: 5000 });
  });
  afterEach(() => db.close());

  it('deshabilita la actualización mientras hay una comanda activa', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: /Mesa 1.*Libre/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Agregar Latte/ }));
    fireEvent(window, new CustomEvent('pos:actualizacion-disponible'));

    expect(await screen.findByText('Hay una nueva versión')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actualizar' })).toBeDisabled();
  });
});
