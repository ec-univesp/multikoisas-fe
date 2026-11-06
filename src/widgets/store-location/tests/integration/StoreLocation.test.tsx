import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { StoreLocation } from '../../StoreLocation';

describe('StoreLocation with the saved store settings', () => {
  it('shows the saved address on the map', async () => {
    apiDatabase.storeSettings.address = 'Rua Nova, 10 - Santo André - SP';
    render(<StoreLocation />);

    expect(await screen.findByText('Rua Nova, 10 - Santo André - SP')).toBeInTheDocument();
    expect(screen.getByTitle('Mapa da loja MultiKoisas')).toHaveAttribute(
      'src',
      'https://www.google.com/maps?q=Rua%20Nova%2C%2010%20-%20Santo%20Andr%C3%A9%20-%20SP&output=embed',
    );
  });
});
