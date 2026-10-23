import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { recordApiRequests, server } from '@/test/msw/server';
import { SalesChannelAdminScreen } from './SalesChannelAdminScreen';

let apiRequests: string[] = [];

beforeEach(() => {
  apiRequests = recordApiRequests();
});

describe('SalesChannelAdminScreen', () => {
  it('loads the sales channels through the site proxy in the browser', async () => {
    render(<SalesChannelAdminScreen />);

    expect(screen.getByText('Carregando canais...')).toBeInTheDocument();
    expect(await screen.findByText('Shopee')).toBeInTheDocument();
    expect(apiRequests).toEqual(['GET /api/canalvenda']);
  });

  it('offers a retry when the api fails to load', async () => {
    server.use(http.get('*/canalvenda', () => new HttpResponse(null, { status: 500 }), { once: true }));
    const user = userEvent.setup();
    render(<SalesChannelAdminScreen />);

    expect(await screen.findByText('Não foi possível carregar os canais.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Shopee')).toBeInTheDocument();
  });
});
