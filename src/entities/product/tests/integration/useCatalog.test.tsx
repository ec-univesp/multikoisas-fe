import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { recordApiRequests, server } from '@/test/msw/server';
import { useCatalog } from '../../useCatalog';

describe('useCatalog', () => {
  it('starts loading and then hands the catalog read through the browser api', async () => {
    const apiRequests = recordApiRequests();
    const { result } = renderHook(() => useCatalog());
    expect(result.current).toEqual({ status: 'loading' });

    await waitFor(() => expect(result.current.status).toBe('ready'));
    const products = result.current.status === 'ready' ? result.current.data.products : [];
    expect(products.map((product) => product.name)).toEqual(['Garrafa Térmica 1L', 'Balde 12L', 'Caixa']);
    expect(apiRequests).toContain('GET /api/produto');
  });

  it('reports the error when the catalog cannot be read', async () => {
    server.use(http.get('*/produto', () => new HttpResponse(null, { status: 500 })));
    const { result } = renderHook(() => useCatalog());
    await waitFor(() => expect(result.current).toEqual({ status: 'error' }));
  });

  it('ignores the answer that arrives after the component is gone', async () => {
    const apiRequests = recordApiRequests();
    const { result, unmount } = renderHook(() => useCatalog());
    unmount();
    await waitFor(() => expect(apiRequests).toContain('GET /api/canalvendaproduto'));
    expect(result.current).toEqual({ status: 'loading' });
  });
});
