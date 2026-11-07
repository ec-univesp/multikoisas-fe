import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { server } from '@/test/msw/server';
import { StoreLocation } from '../../StoreLocation';

describe('StoreLocation with the saved store settings', () => {
  it('shows nothing while loading and then the saved address on the map', async () => {
    apiDatabase.storeSettings.address = 'Rua Nova, 10 - Santo André - SP';
    render(<StoreLocation />);

    expect(screen.queryByRole('heading', { name: 'Onde estamos' })).not.toBeInTheDocument();
    expect(await screen.findByText('Rua Nova, 10 - Santo André - SP')).toBeInTheDocument();
    expect(screen.getByTitle('Mapa da loja MultiKoisas')).toHaveAttribute(
      'src',
      'https://www.google.com/maps?q=Rua%20Nova%2C%2010%20-%20Santo%20Andr%C3%A9%20-%20SP&output=embed',
    );
  });

  it('shows the default address when the saved settings cannot be read', async () => {
    server.use(http.get('*/configuracao', () => new HttpResponse(null, { status: 500 })));
    render(<StoreLocation />);
    expect(await screen.findByText(/Anhaia Melo, 2085/)).toBeInTheDocument();
  });
});
