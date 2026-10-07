// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database.js';
import { resetDatabase } from '../db/testUtils.js';
import { abrirCaja } from '../db/repositories/cajaRepository.js';
import { CajaProvider } from './CajaContext.jsx';
import { useCajaContext } from './CajaContext.jsx';
import { ComandaProvider, useComandaContext } from './ComandaContext.jsx';

describe('ComandaContext', () => {
  beforeEach(async () => {
    await resetDatabase();
    await abrirCaja({ montoInicial: 1000 });
  });
  afterEach(() => db.close());

  it('comparte la comanda y consume la sesión de caja del provider padre', async () => {
    const useContexts = () => ({
      caja: useCajaContext(),
      comanda: useComandaContext()
    });
    const wrapper = ({ children }) => (
      <CajaProvider>
        <ComandaProvider>{children}</ComandaProvider>
      </CajaProvider>
    );
    const { result } = renderHook(useContexts, { wrapper });

    await waitFor(() => expect(result.current.caja.estado).toBe('CAJA_ABIERTA'));
    act(() => result.current.comanda.agregarProducto({ id: 1, nombre: 'Latte', precio: 1200 }));
    expect(result.current.comanda.items).toHaveLength(1);
    expect(result.current.comanda.totales.subtotal).toBe(1200);
  });
});
