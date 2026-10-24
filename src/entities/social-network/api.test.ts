import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { fetchSocialNetworks } from './api';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchSocialNetworks', () => {
  it('maps the api social networks into name and url', async () => {
    expect(await fetchSocialNetworks()).toEqual([
      { id: 1, name: 'Instagram', url: 'https://www.instagram.com/multikoisas' },
      { id: 2, name: 'Shopee', url: 'https://shopee.com.br/multikoisas' },
    ]);
  });

  it('calls the api with a revalidation window', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await fetchSocialNetworks();
    expect(fetchSpy).toHaveBeenCalledWith('https://multikoisas-univesp.onrender.com/socialnetwork', {
      next: { revalidate: 300 },
    });
  });

  it('fails with the path and status when the api errors', async () => {
    server.use(http.get('*/socialnetwork', () => new HttpResponse(null, { status: 500 })));
    await expect(fetchSocialNetworks()).rejects.toThrow('/socialnetwork respondeu 500');
  });
});
