import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STORE_ADDRESS } from '@/entities/store-settings';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { waitForApiAnswers } from '@/test/waitForLoaded';
import { StoreLocation } from '../../StoreLocation';

const ENCODED_ADDRESS = encodeURIComponent(STORE_ADDRESS);
const SAVED_ADDRESS = 'Rua das Flores, 10 - Centro, Santo André - SP';

const renderLocation = async () => {
  render(<StoreLocation />);
  await waitForApiAnswers();
};

describe('StoreLocation', () => {
  it('shows the store address under the where we are heading', async () => {
    await renderLocation();
    expect(screen.getByRole('heading', { level: 2, name: 'Onde estamos' })).toBeInTheDocument();
    expect(screen.getByText(/Anhaia Melo, 2085/).closest('address')).toBeInTheDocument();
    expect(document.getElementById('location')).toBeInTheDocument();
  });

  it('embeds the google map of the address', async () => {
    await renderLocation();
    const map = screen.getByTitle('Mapa da loja MultiKoisas');
    expect(map.tagName).toBe('IFRAME');
    expect(map).toHaveAttribute('src', `https://www.google.com/maps?q=${ENCODED_ADDRESS}&output=embed`);
    expect(map).toHaveAttribute('loading', 'lazy');
  });

  it('opens the directions to the store on google maps in a new tab', async () => {
    await renderLocation();
    const directions = screen.getByRole('link', { name: 'Como chegar' });
    expect(directions).toHaveAttribute(
      'href',
      expect.stringContaining('destination=Av.%20Prof.%20Luiz%20In%C3%A1cio%20de%20Anhaia%20Melo%2C%202085'),
    );
    expect(directions).toHaveAttribute('target', '_blank');
    expect(directions).toHaveAttribute('rel', 'noopener noreferrer');
    expect(directions).toHaveClass('h-11');
  });

  it('shows the address saved in the api, on the map and in the directions too', async () => {
    apiDatabase.stores[0].endereco = SAVED_ADDRESS;
    render(<StoreLocation />);
    expect((await screen.findByText(SAVED_ADDRESS)).tagName).toBe('ADDRESS');
    const encodedSavedAddress = encodeURIComponent(SAVED_ADDRESS);
    expect(screen.getByTitle('Mapa da loja MultiKoisas')).toHaveAttribute(
      'src',
      `https://www.google.com/maps?q=${encodedSavedAddress}&output=embed`,
    );
    expect(screen.getByRole('link', { name: 'Como chegar' })).toHaveAttribute(
      'href',
      `https://www.google.com/maps/dir/?api=1&destination=${encodedSavedAddress}`,
    );
  });

  it('keeps the known address when the store has none saved', async () => {
    apiDatabase.stores[0].endereco = null;
    await renderLocation();
    expect(screen.getByText(STORE_ADDRESS).tagName).toBe('ADDRESS');
  });
});
