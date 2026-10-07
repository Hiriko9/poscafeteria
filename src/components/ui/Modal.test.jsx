// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Modal from './Modal.jsx';

describe('Modal', () => {
  it('da foco inicial al diálogo y mantiene el foco dentro con Tab', () => {
    render(
      <Modal title="Prueba" titleId="modal-prueba">
        <button type="button">Primero</button>
        <button type="button">Último</button>
      </Modal>
    );

    const dialog = screen.getByRole('dialog', { name: 'Prueba' });
    const primero = screen.getByRole('button', { name: 'Primero' });
    const ultimo = screen.getByRole('button', { name: 'Último' });
    expect(document.activeElement).toBe(dialog);

    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(primero);

    fireEvent.keyDown(primero, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(ultimo);

    fireEvent.keyDown(ultimo, { key: 'Tab' });
    expect(document.activeElement).toBe(primero);
  });

  it('permite cerrar con Escape y clic fuera cuando está habilitado', () => {
    const onClose = vi.fn();
    render(
      <Modal title="Cerrable" titleId="modal-cerrable" onClose={onClose}>
        <button type="button">Acción</button>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.mouseDown(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
