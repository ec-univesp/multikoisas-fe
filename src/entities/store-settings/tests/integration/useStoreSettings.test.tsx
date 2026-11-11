import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { server } from '@/test/msw/server';
import { saveStoreDescription } from '../../api';
import { STORE_SETTINGS } from '../../storeSettings';
import { useStoreSettings } from '../../useStoreSettings';

describe('useStoreSettings', () => {
  it('uses the default settings while loading and then the saved ones', async () => {
    apiDatabase.stores[0].descricaoLoja = 'Descrição salva';
    const { result } = renderHook(() => useStoreSettings());
    expect(result.current).toEqual(expect.objectContaining({ status: 'loading', settings: STORE_SETTINGS }));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.settings.description).toBe('Descrição salva');
  });

  it('keeps the default settings when they cannot be read', async () => {
    server.use(http.get('*/loja', () => new HttpResponse(null, { status: 500 })));
    const { result } = renderHook(() => useStoreSettings());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.settings).toEqual(STORE_SETTINGS);
  });

  it('shows the settings saved by another part of the page', async () => {
    const { result } = renderHook(() => useStoreSettings());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(() => saveStoreDescription('Nova descrição'));

    expect(result.current.settings.description).toBe('Nova descrição');
  });

  it('keeps the saved settings when a read started before them fails afterwards', async () => {
    let failRead = () => {};
    server.use(
      http.get(
        '*/loja',
        () => new Promise<Response>((resolve) => (failRead = () => resolve(new HttpResponse(null, { status: 500 })))),
        { once: true },
      ),
    );
    const { result } = renderHook(() => useStoreSettings());
    await act(() => saveStoreDescription('Nova descrição'));
    expect(result.current.status).toBe('ready');

    await act(async () => failRead());

    expect(result.current.status).toBe('ready');
    expect(result.current.settings.description).toBe('Nova descrição');
  });

  it('reads the settings again on retry after a failure', async () => {
    server.use(http.get('*/loja', () => new HttpResponse(null, { status: 500 }), { once: true }));
    const { result } = renderHook(() => useStoreSettings());
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => result.current.retry());

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
  });
});
