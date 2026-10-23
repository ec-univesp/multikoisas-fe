import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { fetchSalesChannels } from './api';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchSalesChannels', () => {
  it('maps the api sales channels into id and name', async () => {
    expect(await fetchSalesChannels()).toEqual([
      { id: 2, name: 'Shopee' },
      { id: 3, name: 'Instagram' },
      { id: 4, name: 'Facebook' },
      { id: 5, name: 'TikTok' },
    ]);
  });

  it('reads fresh through the site proxy in the browser', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await fetchSalesChannels({ fresh: true, fromBrowser: true });
    expect(fetchSpy).toHaveBeenCalledWith('/api/canalvenda', { cache: 'no-store' });
  });

  it('fails with the path and status when the api errors', async () => {
    server.use(http.get('*/canalvenda', () => new HttpResponse(null, { status: 500 })));
    await expect(fetchSalesChannels()).rejects.toThrow('/canalvenda respondeu 500');
  });
});
