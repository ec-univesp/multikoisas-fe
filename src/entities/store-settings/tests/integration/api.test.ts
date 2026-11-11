import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiDatabase, SUPABASE_IMAGES } from '@/test/msw/apiDatabase';
import { server } from '@/test/msw/server';
import { fetchStoreSettings, removeStoreImage, saveStoreDescription, saveStoreImage } from '../../api';

const OLD_LOGO = { id: 2, imagemUrl: `${SUPABASE_IMAGES}/logo-antiga.png`, tipo: 'LOGO' };
const LOGO = { id: 3, imagemUrl: `${SUPABASE_IMAGES}/logo.png`, tipo: 'LOGO' };
const PHOTO = { id: 4, imagemUrl: 'https://fotos.example.com/fachada.jpg', tipo: 'CAPA' };
const NEW_FILE = () => new File(['png'], 'nova.png', { type: 'image/png' });

describe('store settings api', () => {
  it('reads the description and the newest https logo and photo, ignoring the other urls', async () => {
    apiDatabase.storeImages.push(LOGO, OLD_LOGO, { id: 9, imagemUrl: 'http://example.com/logo.png', tipo: 'LOGO' }, PHOTO);
    expect(await fetchStoreSettings()).toEqual({
      description: 'Tudo em um só lugar',
      logoUrl: LOGO.imagemUrl,
      photoUrl: PHOTO.imagemUrl,
    });
  });

  it('reads no description nor images when the store row and the valid images are missing', async () => {
    apiDatabase.stores = [];
    expect(await fetchStoreSettings()).toEqual({ description: null, logoUrl: null, photoUrl: null });
  });

  it('reads a blank description as missing', async () => {
    apiDatabase.stores[0].descricaoLoja = '  ';
    expect((await fetchStoreSettings()).description).toBeNull();
  });

  it('saves the description of the store', async () => {
    expect(await saveStoreDescription('Nova descrição')).toEqual(
      expect.objectContaining({ description: 'Nova descrição' }),
    );
    expect(apiDatabase.stores).toEqual([{ id: 1, nomeLoja: 'multikoisas', descricaoLoja: 'Nova descrição' }]);
  });

  it('creates the store when it does not exist yet', async () => {
    apiDatabase.stores = [];
    await saveStoreDescription('Primeira');
    expect(apiDatabase.stores).toEqual([expect.objectContaining({ nomeLoja: 'multikoisas', descricaoLoja: 'Primeira' })]);
  });

  it('uploads a new image and deletes the older ones of the same type', async () => {
    apiDatabase.storeImages.push(OLD_LOGO, PHOTO);
    const saved = await saveStoreImage('LOGO', NEW_FILE());
    expect(saved.logoUrl).toBe(`${SUPABASE_IMAGES}/upload-100`);
    expect(apiDatabase.storeImages.map((storeImage) => storeImage.id)).toEqual([4, 100]);
  });

  it('shows the new image even when an older one cannot be deleted', async () => {
    apiDatabase.storeImages.push(OLD_LOGO);
    server.use(http.delete('*/imagemloja/:type', () => new HttpResponse(null, { status: 500 })));
    expect((await saveStoreImage('LOGO', NEW_FILE())).logoUrl).toBe(`${SUPABASE_IMAGES}/upload-100`);
    expect(apiDatabase.storeImages.map((storeImage) => storeImage.id)).toEqual([1, 2, 100]);
  });

  it('keeps the old image when the upload fails', async () => {
    apiDatabase.storeImages.push(OLD_LOGO);
    server.use(http.post('*/imagemloja', () => new HttpResponse(null, { status: 500 })));
    await expect(saveStoreImage('LOGO', NEW_FILE())).rejects.toThrow('POST /imagemloja?tipo=LOGO responded 500');
    expect(apiDatabase.storeImages.map((storeImage) => storeImage.id)).toEqual([1, 2]);
  });

  it('removes every image of the type', async () => {
    apiDatabase.storeImages.push(LOGO, PHOTO);
    expect(await removeStoreImage('LOGO')).toEqual(expect.objectContaining({ logoUrl: null, photoUrl: PHOTO.imagemUrl }));
    expect(apiDatabase.storeImages).toEqual([PHOTO]);
  });

  it('fails when the api cannot be read', async () => {
    server.use(http.get('*/loja', () => new HttpResponse(null, { status: 500 })));
    await expect(fetchStoreSettings()).rejects.toThrow('API /loja?nome=multikoisas responded 500');
  });
});
