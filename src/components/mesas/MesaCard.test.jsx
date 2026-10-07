// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MesaCard from './MesaCard.jsx';

describe('MesaCard', () => {
  it('muestra el estado con texto y no permite seleccionar una mesa ocupada', () => {
    const onSelect = vi.fn();
    render(
      <MesaCard
        mesa={{ id: 3, numero: 3, capacidad: 4, estado: 'OCUPADA' }}
        onSelect={onSelect}
      />
    );

    const boton = screen.getByRole('button', { name: /Mesa 3.*Capacidad: 4.*Ocupada/ });

    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Ocupada')).toBeInTheDocument();
  });
});
