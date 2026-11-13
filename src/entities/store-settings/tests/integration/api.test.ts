import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiDatabase, SUPABASE_IMAGES } from '@/test/msw/apiDatabase';
import { server } from '@/test/msw/server';
import {
  fetchStoreSettings,
  onStoreSettingsSaved,
  removeStoreImage,
  saveStoreImage,
  saveStoreSettings,
} from '../../api';

const PLACEHOLDER_LOGO = { id: 1, imagemUrl: 'URL 1', tipo: 'LOGO' };
const OLD_LOGO = { id: 2, imagemUrl: `${SUPABASE_IMAGES}/logo-antiga.png`, tipo: 'LOGO' };
const LOGO = { id: 3, imagemUrl: `${SUPABASE_IMAGES}/logo.png`, tipo: 'LOGO' };
const PHOTO = { id: 4, imagemUrl: `${SUPABASE_IMAGES}/fachada.jpg`, tipo: 'CAPA' };
const ADDRESS = 'Av. Prof. Luiz Inácio de Anhaia Melo, 2085 - Centreville, Santo André - SP';
const NEW_FILE = () => new File(['png'], 'nova.png', { type: 'image/png' });
const failing = () => new HttpResponse(null, { status: 500 });
const storeImageIds = () => apiDatabase.storeImages.map((storeImage) => storeImage.id);

describe('store settings api', () => {
  it('reads the description, the address and the newest displayable logo and photo, ignoring the other urls', async () => {
    apiDatabase.storeImages.push(
      LOGO,
      OLD_LOGO,
      { id: 9, imagemUrl: 'http://example.com/logo.png', tipo: 'LOGO' },
      { id: 10, imagemUrl: 'https://fotos.example.com/logo.png', tipo: 'LOGO' },
      PHOTO,
    );
    expect(await fetchStoreSettings()).toEqual({
      name: 'multikoisas',
      description: 'Tudo em um só lugar',
      address: ADDRESS,
      logoUrl: LOGO.imagemUrl,
      photoUrl: PHOTO.imagemUrl,
    });
  });

  it('fixes the storage path the api saves without /object/', async () => {
    apiDatabase.storeImages.push({
      id: 5,
      imagemUrl: 'https://avphmmvnlrbidhjrzozx.storage.supabase.co/storage/v1/public/imagem/logo.png',
      tipo: 'LOGO',
    });
    expect((await fetchStoreSettings()).logoUrl).toBe(
      'https://avphmmvnlrbidhjrzozx.storage.supabase.co/storage/v1/object/public/imagem/logo.png',
    );
  });

  it('reads the multikoisas row even when the api lists another store first', async () => {
    apiDatabase.stores.unshift({ id: 2, nomeLoja: 'outra loja', descricaoLoja: 'Outra descrição', endereco: null });
    expect((await fetchStoreSettings()).description).toBe('Tudo em um só lugar');
  });

  it('reads no description nor images when the store row and the valid images are missing', async () => {
    apiDatabase.stores = [];
    expect(await fetchStoreSettings()).toEqual({
      name: null,
      description: null,
      address: null,
      logoUrl: null,
      photoUrl: null,
    });
  });

  it('reads a blank store name as missing and trims a filled one', async () => {
    const storeNamed = (nomeLoja: string) =>
      server.use(
        http.get('*/loja', () => HttpResponse.json([{ id: 1, nomeLoja, descricaoLoja: null, endereco: null }])),
      );
    storeNamed('  ');
    expect((await fetchStoreSettings()).name).toBeNull();
    storeNamed('  Loja da Ana  ');
    expect((await fetchStoreSettings()).name).toBe('Loja da Ana');
  });

  it('reads a blank description as missing', async () => {
    apiDatabase.stores[0].descricaoLoja = '  ';
    expect((await fetchStoreSettings()).description).toBeNull();
  });

  it('reads a blank or missing address as missing and trims a filled one', async () => {
    apiDatabase.stores[0].endereco = null;
    expect((await fetchStoreSettings()).address).toBeNull();
    apiDatabase.stores[0].endereco = '  ';
    expect((await fetchStoreSettings()).address).toBeNull();
    apiDatabase.stores[0].endereco = '  Rua A, 1  ';
    expect((await fetchStoreSettings()).address).toBe('Rua A, 1');
  });

  it('fails when the store row cannot be read, so the panel never offers an empty description to save over the real one', async () => {
    apiDatabase.storeImages.push(LOGO);
    server.use(http.get('*/loja', failing));
    await expect(fetchStoreSettings()).rejects.toThrow();
  });

  it('still reads the description when the images cannot be read', async () => {
    server.use(http.get('*/imagemloja', failing));
    expect(await fetchStoreSettings()).toEqual({
      name: 'multikoisas',
      description: 'Tudo em um só lugar',
      address: ADDRESS,
      logoUrl: null,
      photoUrl: null,
    });
  });

  it('reads the logo and the photo with a single image request, so an empty store gets one 404 instead of two', async () => {
    apiDatabase.storeImages.push(LOGO, PHOTO);
    const imageRequests: string[] = [];
    server.events.on('request:start', ({ request }) => {
      if (new URL(request.url).pathname.endsWith('/imagemloja')) imageRequests.push(new URL(request.url).search);
    });
    expect(await fetchStoreSettings()).toEqual({
      name: 'multikoisas',
      description: 'Tudo em um só lugar',
      address: ADDRESS,
      logoUrl: LOGO.imagemUrl,
      photoUrl: PHOTO.imagemUrl,
    });
    expect(imageRequests).toEqual(['']);
  });

  it('saves the description and the address of the store by its id', async () => {
    const paths: string[] = [];
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'PUT') paths.push(new URL(request.url).pathname);
    });
    expect(await saveStoreSettings({ description: 'Nova descrição', address: 'Rua A, 1' })).toEqual(
      expect.objectContaining({ description: 'Nova descrição', address: 'Rua A, 1' }),
    );
    expect(apiDatabase.stores).toEqual([
      { id: 1, nomeLoja: 'multikoisas', descricaoLoja: 'Nova descrição', endereco: 'Rua A, 1' },
    ]);
    expect(paths).toEqual(['/api/loja/1']);
  });

  it('sends both fields on every change, even when only the description changed', async () => {
    const bodies: unknown[] = [];
    server.events.on('request:start', async ({ request }) => {
      if (request.method === 'PUT') bodies.push(await request.clone().json());
    });
    await saveStoreSettings({ description: 'Nova descrição', address: ADDRESS });
    expect(bodies).toEqual([{ descricaoLoja: 'Nova descrição', endereco: ADDRESS }]);
  });

  it('creates the store with its name, description and address when it does not exist yet', async () => {
    apiDatabase.stores = [];
    await saveStoreSettings({ description: 'Primeira', address: 'Rua A, 1' });
    expect(apiDatabase.stores).toEqual([
      expect.objectContaining({ nomeLoja: 'multikoisas', descricaoLoja: 'Primeira', endereco: 'Rua A, 1' }),
    ]);
  });

  it('uploads a new image and deletes only the older displayable ones of the same type', async () => {
    apiDatabase.storeImages.push(OLD_LOGO, PHOTO);
    const deletions: string[] = [];
    server.events.on('request:start', ({ request }) => {
      const url = new URL(request.url);
      if (request.method === 'DELETE') deletions.push(url.pathname + url.search);
    });
    const saved = await saveStoreImage('LOGO', NEW_FILE());
    expect(saved?.logoUrl).toBe(`${SUPABASE_IMAGES}/upload-100`);
    expect(storeImageIds()).toEqual([PLACEHOLDER_LOGO.id, PHOTO.id, 100]);
    expect(deletions).toEqual(['/api/imagemloja/2?tipo=LOGO']);
  });

  it('shows the new image even when an older one cannot be deleted', async () => {
    apiDatabase.storeImages.push(OLD_LOGO);
    server.use(http.delete('*/imagemloja/:id', failing));
    expect((await saveStoreImage('LOGO', NEW_FILE()))?.logoUrl).toBe(`${SUPABASE_IMAGES}/upload-100`);
    expect(storeImageIds()).toEqual([1, 2, 100]);
  });

  it('counts the upload as saved even when the settings cannot be read again', async () => {
    server.use(
      http.post('*/imagemloja', () => {
        server.use(http.get('*/loja', failing), http.get('*/imagemloja', failing));
      }),
    );
    await expect(saveStoreImage('LOGO', NEW_FILE())).resolves.toBeNull();
    expect(storeImageIds()).toContain(100);
  });

  it('keeps the old image when the upload fails', async () => {
    apiDatabase.storeImages.push(OLD_LOGO);
    server.use(http.post('*/imagemloja', failing));
    await expect(saveStoreImage('LOGO', NEW_FILE())).rejects.toThrow('POST /imagemloja?tipo=LOGO responded 500');
    expect(storeImageIds()).toEqual([1, 2]);
  });

  it('removes every displayable image of the type and leaves the placeholder rows alone', async () => {
    apiDatabase.storeImages.push(LOGO, PHOTO);
    expect(await removeStoreImage('LOGO')).toEqual(
      expect.objectContaining({ logoUrl: null, photoUrl: PHOTO.imagemUrl }),
    );
    expect(apiDatabase.storeImages).toEqual([PLACEHOLDER_LOGO, PHOTO]);
  });

  it('deletes what it can, shows the result and then fails when an image cannot be removed', async () => {
    apiDatabase.storeImages.push(OLD_LOGO, LOGO);
    server.use(http.delete('*/imagemloja/:id', ({ params }) => (params.id === '3' ? failing() : undefined)));
    const notified: (string | null)[] = [];
    const stopListening = onStoreSettingsSaved((settings) => notified.push(settings.logoUrl));

    await expect(removeStoreImage('LOGO')).rejects.toThrow('DELETE /imagemloja/3?tipo=LOGO responded 500');

    stopListening();
    expect(storeImageIds()).toEqual([1, 3]);
    expect(notified).toEqual([LOGO.imagemUrl]);
  });
});
