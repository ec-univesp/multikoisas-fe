import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { server } from '@/test/msw/server';
import { fetchStoreSettings, removeStoreLogo, saveStoreLogo, saveStoreSettings } from '../../api';

const NEW_SETTINGS = { address: 'Rua Nova, 10' };

describe('store settings api', () => {
  it('reads the store settings', async () => {
    expect(await fetchStoreSettings()).toEqual(expect.objectContaining({ logoUrl: null }));
    expect(await fetchStoreSettings()).not.toHaveProperty('googleRating');
  });

  it('saves the store settings', async () => {
    expect(await saveStoreSettings(NEW_SETTINGS)).toEqual({ ...NEW_SETTINGS, logoUrl: null, showcaseColumns: 4, accentColor: '#facc15' });
    expect(apiDatabase.storeSettings.address).toBe('Rua Nova, 10');
  });

  it('saves a new logo and goes back to the default one', async () => {
    const saved = await saveStoreLogo(new File(['png'], 'logo.png', { type: 'image/png' }));
    expect(saved.logoUrl).toBe('/local-images/100');
    expect((await removeStoreLogo()).logoUrl).toBeNull();
  });

  it('fails when the api refuses', async () => {
    server.use(
      http.get('*/configuracao', () => new HttpResponse(null, { status: 500 })),
      http.put('*/configuracao', () => new HttpResponse(null, { status: 400 })),
    );
    await expect(fetchStoreSettings()).rejects.toThrow('API /configuracao responded 500');
    await expect(saveStoreSettings(NEW_SETTINGS)).rejects.toThrow('PUT /configuracao responded 400');
  });
});
