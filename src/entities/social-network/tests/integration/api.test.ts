import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { fetchSocialNetworks } from '../../api';

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

  it('completes with https a link registered without it, like wa.me/...', async () => {
    server.use(
      http.get('*/socialnetwork', () =>
        HttpResponse.json([{ id: 1, descricao: 'WhatsApp', link: ' wa.me/message/V4IAOMTCK5XHP1 ' }]),
      ),
    );
    expect(await fetchSocialNetworks()).toEqual([
      { id: 1, name: 'WhatsApp', url: 'https://wa.me/message/V4IAOMTCK5XHP1' },
    ]);
  });

  it('drops social networks whose link is not a valid https address', async () => {
    server.use(
      http.get('*/socialnetwork', () =>
        HttpResponse.json([
          { id: 1, descricao: 'Instagram', link: 'https://www.instagram.com/multikoisas' },
          { id: 2, descricao: 'Site', link: 'http://multikoisas.com.br' },
          { id: 3, descricao: 'Vazio', link: '   ' },
          { id: 4, descricao: 'Script', link: 'javascript:alert(1)' },
        ]),
      ),
    );
    expect(await fetchSocialNetworks()).toEqual([
      { id: 1, name: 'Instagram', url: 'https://www.instagram.com/multikoisas' },
    ]);
  });

  it('reads only through the local api in the browser', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await fetchSocialNetworks();
    expect(fetchSpy).toHaveBeenCalledWith('/api/socialnetwork', { cache: 'no-store' });
  });

  it('fails with the path and status when the api errors', async () => {
    server.use(http.get('*/socialnetwork', () => new HttpResponse(null, { status: 500 })));
    await expect(fetchSocialNetworks()).rejects.toThrow('/socialnetwork responded 500');
  });
});
