import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { STORAGE_KEY } from '@/shared/local-api/persistence';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { server } from '@/test/msw/server';
import { saveStoreSettings } from '../../api';
import { STORE_SETTINGS } from '../../storeSettings';
import { useStoreSettings } from '../../useStoreSettings';

describe('useStoreSettings', () => {
  it('uses the default settings while loading and then the saved ones', async () => {
    apiDatabase.storeSettings.googleRating = 3.5;
    const { result } = renderHook(() => useStoreSettings());
    expect(result.current).toEqual(expect.objectContaining({ status: 'loading', settings: STORE_SETTINGS }));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.settings.googleRating).toBe(3.5);
  });

  it('keeps the default settings when they cannot be read', async () => {
    server.use(http.get('*/configuracao', () => new HttpResponse(null, { status: 500 })));
    const { result } = renderHook(() => useStoreSettings());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.settings).toEqual(STORE_SETTINGS);
  });

  it('shows the settings saved by another part of the page', async () => {
    const { result } = renderHook(() => useStoreSettings());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(() =>
      saveStoreSettings({ address: 'Rua Nova, 10', googleReviewsUrl: null, googleRating: 5, googleReviewCount: 1 }),
    );

    expect(result.current.settings.address).toBe('Rua Nova, 10');
  });

  it('reads the settings again when another tab saves the local database', async () => {
    const { result } = renderHook(() => useStoreSettings());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    apiDatabase.storeSettings.googleRating = 2.5;
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));

    await waitFor(() => expect(result.current.settings.googleRating).toBe(2.5));
  });

  it('keeps the settings it has when reading them again fails', async () => {
    const { result } = renderHook(() => useStoreSettings());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    server.use(http.get('*/configuracao', () => new HttpResponse(null, { status: 500 })));

    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(result.current.status).toBe('ready');
  });

  it('reads the settings again on retry after a failure', async () => {
    server.use(http.get('*/configuracao', () => new HttpResponse(null, { status: 500 }), { once: true }));
    const { result } = renderHook(() => useStoreSettings());
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => result.current.retry());

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
  });
});
