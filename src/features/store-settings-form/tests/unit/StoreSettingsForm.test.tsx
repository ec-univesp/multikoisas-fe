import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StoreSettingsForm } from '../../StoreSettingsForm';

describe('StoreSettingsForm', () => {
  it('starts empty while the store has no address', () => {
    render(<StoreSettingsForm settings={{ address: null }} />);
    expect(screen.getByLabelText('Endereço')).toHaveValue('');
  });

  it('starts with the current address', () => {
    render(<StoreSettingsForm settings={{ address: 'Rua Exemplo, 100' }} />);
    expect(screen.getByLabelText('Endereço')).toHaveValue('Rua Exemplo, 100');
  });

  it('leaves the google rating, count and link to google itself', () => {
    render(<StoreSettingsForm settings={{ address: null }} />);
    expect(screen.queryByLabelText('Link das avaliações no Google')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nota no Google')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Quantidade de avaliações')).not.toBeInTheDocument();
  });

  it('uses a 16px font on the address', () => {
    render(<StoreSettingsForm settings={{ address: null }} />);
    expect(screen.getByLabelText('Endereço')).toHaveClass('text-base');
  });
});
