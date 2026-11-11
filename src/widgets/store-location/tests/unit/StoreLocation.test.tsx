import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STORE_ADDRESS } from '@/entities/store-settings';
import { StoreLocation } from '../../StoreLocation';

const ENCODED_ADDRESS = encodeURIComponent(STORE_ADDRESS);

describe('StoreLocation', () => {
  it('shows the store address under the where we are heading', () => {
    render(<StoreLocation />);
    expect(screen.getByRole('heading', { level: 2, name: 'Onde estamos' })).toBeInTheDocument();
    expect(screen.getByText(/Anhaia Melo, 2085/).closest('address')).toBeInTheDocument();
    expect(document.getElementById('location')).toBeInTheDocument();
  });

  it('embeds the google map of the address', () => {
    render(<StoreLocation />);
    const map = screen.getByTitle('Mapa da loja MultiKoisas');
    expect(map.tagName).toBe('IFRAME');
    expect(map).toHaveAttribute('src', `https://www.google.com/maps?q=${ENCODED_ADDRESS}&output=embed`);
    expect(map).toHaveAttribute('loading', 'lazy');
  });

  it('opens the directions to the store on google maps in a new tab', () => {
    render(<StoreLocation />);
    const directions = screen.getByRole('link', { name: 'Como chegar' });
    expect(directions).toHaveAttribute(
      'href',
      expect.stringContaining('destination=Av.%20Prof.%20Luiz%20In%C3%A1cio%20de%20Anhaia%20Melo%2C%202085'),
    );
    expect(directions).toHaveAttribute('target', '_blank');
    expect(directions).toHaveAttribute('rel', 'noopener noreferrer');
    expect(directions).toHaveClass('h-11');
  });
});
