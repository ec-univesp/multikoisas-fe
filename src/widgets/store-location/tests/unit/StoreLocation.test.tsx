import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { StoreSettings } from '@/entities/store-settings';
import { StoreLocation } from '../../StoreLocation';

const ADDRESS = 'Rua das Flores, 100 - São Paulo, SP';
const ENCODED_ADDRESS = 'Rua%20das%20Flores%2C%20100%20-%20S%C3%A3o%20Paulo%2C%20SP';

const settingsWith = (address: string | null): StoreSettings => ({
  address,
  googleReviewsUrl: null,
  googleRating: null,
  googleReviewCount: null,
});

describe('StoreLocation', () => {
  it('renders nothing without an address', () => {
    const { container } = render(<StoreLocation settings={settingsWith(null)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the address is blank', () => {
    const { container } = render(<StoreLocation settings={settingsWith('   ')} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing with the default settings', () => {
    const { container } = render(<StoreLocation />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the written address under the where we are heading', () => {
    render(<StoreLocation settings={settingsWith(ADDRESS)} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Onde estamos' })).toBeInTheDocument();
    expect(screen.getByText(ADDRESS).closest('address')).toBeInTheDocument();
    expect(document.getElementById('location')).toBeInTheDocument();
  });

  it('embeds the google map of the address', () => {
    render(<StoreLocation settings={settingsWith(ADDRESS)} />);
    const map = screen.getByTitle('Mapa da loja MultiKoisas');
    expect(map.tagName).toBe('IFRAME');
    expect(map).toHaveAttribute('src', `https://www.google.com/maps?q=${ENCODED_ADDRESS}&output=embed`);
    expect(map).toHaveAttribute('loading', 'lazy');
  });

  it('opens the directions to the store on google maps in a new tab', () => {
    render(<StoreLocation settings={settingsWith(ADDRESS)} />);
    const directions = screen.getByRole('link', { name: 'Como chegar' });
    expect(directions).toHaveAttribute('href', `https://www.google.com/maps/dir/?api=1&destination=${ENCODED_ADDRESS}`);
    expect(directions).toHaveAttribute('target', '_blank');
    expect(directions).toHaveAttribute('rel', 'noopener noreferrer');
    expect(directions).toHaveClass('h-11');
  });
});
