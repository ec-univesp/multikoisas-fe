import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StoreSettingsForm } from '../../StoreSettingsForm';

describe('StoreSettingsForm', () => {
  it('starts empty while the store has no description', () => {
    render(<StoreSettingsForm settings={{ description: null, address: null }} />);
    expect(screen.getByLabelText('Descrição da loja')).toHaveValue('');
  });

  it('starts with the current description in a text area', () => {
    render(<StoreSettingsForm settings={{ description: 'Tudo em um só lugar', address: null }} />);
    const description = screen.getByLabelText('Descrição da loja');
    expect(description.tagName).toBe('TEXTAREA');
    expect(description).toHaveValue('Tudo em um só lugar');
  });

  it('leaves the address out of the panel', () => {
    render(<StoreSettingsForm settings={{ description: null, address: null }} />);
    expect(screen.queryByLabelText('Endereço')).not.toBeInTheDocument();
  });

  it('uses a 16px font on the description', () => {
    render(<StoreSettingsForm settings={{ description: null, address: null }} />);
    expect(screen.getByLabelText('Descrição da loja')).toHaveClass('text-base!');
  });
});
