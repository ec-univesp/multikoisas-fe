import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { recordApiRequests, server } from '@/test/msw/server';
import { useSocialNetworks } from '../../useSocialNetworks';

describe('useSocialNetworks', () => {
  it('starts loading and then hands the social networks read through the browser api', async () => {
    const apiRequests = recordApiRequests();
    const { result } = renderHook(() => useSocialNetworks());
    expect(result.current).toEqual({ status: 'loading' });

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'ready',
        data: [
          { id: 1, name: 'Instagram', url: 'https://www.instagram.com/multikoisas' },
          { id: 2, name: 'Shopee', url: 'https://shopee.com.br/multikoisas' },
        ],
      }),
    );
    expect(apiRequests).toEqual(['GET /api/socialnetwork']);
  });

  it('reports the error when the social networks cannot be read', async () => {
    server.use(http.get('*/socialnetwork', () => new HttpResponse(null, { status: 500 })));
    const { result } = renderHook(() => useSocialNetworks());
    await waitFor(() => expect(result.current).toEqual({ status: 'error' }));
  });
});
