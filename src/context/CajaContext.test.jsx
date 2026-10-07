// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database.js';
import { resetDatabase } from '../db/testUtils.js';
import { CajaProvider, useCajaContext } from './CajaContext.jsx';

describe('CajaContext', () => {
  beforeEach(resetDatabase);
  afterEach(() => db.close());

  it('expone el hook de caja dentro del provider y falla fuera de él', async () => {
    expect(() => renderHook(() => useCajaContext())).toThrow(
      'useCajaContext debe utilizarse dentro de un CajaProvider.'
    );

    const wrapper = ({ children }) => <CajaProvider>{children}</CajaProvider>;
    const { result } = renderHook(() => useCajaContext(), { wrapper });

    await waitFor(() => expect(result.current.estado).toBe('CAJA_CERRADA'));
    await act(async () => result.current.abrirCaja(3000));
    expect(result.current.estado).toBe('CAJA_ABIERTA');
  });
});
