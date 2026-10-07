// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary.jsx';

function Fallable({ falla }) {
  if (falla) throw new Error('mensaje técnico secreto');
  return <p>Aplicación visible</p>;
}

describe('ErrorBoundary', () => {
  afterEach(() => vi.restoreAllMocks());

  it('muestra recuperación sin revelar stack y permite reintentar', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const vista = render(
      <ErrorBoundary>
        <Fallable falla />
      </ErrorBoundary>
    );

    expect(screen.getByText('Algo salió mal. Tus ventas guardadas están a salvo en este dispositivo.')).toBeInTheDocument();
    expect(screen.queryByText('mensaje técnico secreto')).not.toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalled();

    vista.rerender(
      <ErrorBoundary>
        <Fallable falla={false} />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(screen.getByText('Aplicación visible')).toBeInTheDocument();
  });

  it('notifica los rechazos no controlados sin retirar la aplicación', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <p>Aplicación visible</p>
      </ErrorBoundary>
    );
    const evento = new Event('unhandledrejection', { cancelable: true });
    Object.defineProperty(evento, 'reason', { value: new Error('detalle interno') });
    act(() => window.dispatchEvent(evento));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ocurrió un problema inesperado. La aplicación sigue disponible.'
    );
    expect(screen.getByText('Aplicación visible')).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar notificación' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
