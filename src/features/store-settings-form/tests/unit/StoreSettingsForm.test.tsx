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

  it('starts with the current address in a text field below the description', () => {
    render(<StoreSettingsForm settings={{ description: null, address: 'Rua A, 1' }} />);
    const address = screen.getByLabelText('Endereço da loja');
    expect(address.tagName).toBe('INPUT');
    expect(address).toHaveValue('Rua A, 1');
    expect(screen.getByLabelText('Descrição da loja').compareDocumentPosition(address)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('starts the address empty while the store has none', () => {
    render(<StoreSettingsForm settings={{ description: null, address: null }} />);
    expect(screen.getByLabelText('Endereço da loja')).toHaveValue('');
  });

  it('uses a 16px font on the description and the address', () => {
    render(<StoreSettingsForm settings={{ description: null, address: null }} />);
    expect(screen.getByLabelText('Descrição da loja')).toHaveClass('text-base!');
    expect(screen.getByLabelText('Endereço da loja')).toHaveClass('text-base');
  });
});
