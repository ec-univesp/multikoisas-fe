import 'fake-indexeddb/auto';
import type { RequestHandler } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { loadDatabase, saveDatabase, STORAGE_KEY } from '../../persistence';
import { startLocalApi } from '../../startLocalApi';

const { workerStart, setupWorker, workerHandlers } = vi.hoisted(() => {
  const start = vi.fn(async () => undefined);
  const handlers: RequestHandler[] = [];
  const setup = vi.fn((...given: RequestHandler[]) => {
    handlers.push(...given);
    return { start };
  });
  return { workerStart: start, setupWorker: setup, workerHandlers: handlers };
});

vi.mock('msw/browser', () => ({ setupWorker }));

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

const saveFromAnotherTab = (categoryName: string) => {
  const otherTab = loadDatabase();
  otherTab.categories.push({ id: otherTab.nextId++, nome: categoryName });
  saveDatabase(otherTab);
};

const categoryNames = async () =>
  ((await (await fetch('/api/categoria')).json()) as { nome: string }[]).map((category) => category.nome);

describe('startLocalApi', () => {
  it('starts the service worker once, even when called again', async () => {
    await Promise.all([startLocalApi(), startLocalApi()]);
    await startLocalApi();
    expect(setupWorker).toHaveBeenCalledTimes(1);
    expect(workerStart).toHaveBeenCalledTimes(1);
    expect(workerStart).toHaveBeenCalledWith({
      onUnhandledRequest: 'bypass',
      quiet: true,
      serviceWorker: { url: '/mockServiceWorker.js' },
    });
  });

  it('saves every write in the browser and serves uploaded photos from this origin', async () => {
    await startLocalApi();
    server.use(...workerHandlers);

    expect((await fetch('/api/categoria', { method: 'POST', body: JSON.stringify({ nome: 'Jardim' }) })).status).toBe(
      201,
    );
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Jardim');

    const socialNetwork = { descricao: 'TikTok', link: 'https://tiktok.com/@multikoisas' };
    expect((await fetch('/api/socialnetwork', { method: 'POST', body: JSON.stringify(socialNetwork) })).status).toBe(
      201,
    );

    const uploaded = await fetch('/api/imagem?produtoId=1', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=limite' },
      body: [
        '--limite',
        'Content-Disposition: form-data; name="file"; filename="a.png"',
        'Content-Type: image/png',
        '',
        'png',
        '--limite--',
        '',
      ].join('\r\n'),
    });
    const { imagemUrl } = await uploaded.json();
    expect(imagemUrl).toBe(`${location.origin}/local-images/29`);
    expect(await (await fetch(imagemUrl)).text()).toBe('png');
  });

  it('keeps what another tab saved when writing', async () => {
    await startLocalApi();
    server.use(...workerHandlers);
    saveFromAnotherTab('Varanda');

    expect((await fetch('/api/categoria', { method: 'POST', body: JSON.stringify({ nome: 'Jardim' }) })).status).toBe(
      201,
    );

    expect(await categoryNames()).toEqual(expect.arrayContaining(['Varanda', 'Jardim']));
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Varanda');
  });

  it('shows what another tab saved without writing', async () => {
    await startLocalApi();
    server.use(...workerHandlers);
    saveFromAnotherTab('Quintal');

    window.dispatchEvent(new StorageEvent('storage', { key: 'outra-chave' }));
    expect(await categoryNames()).not.toContain('Quintal');

    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    expect(await categoryNames()).toContain('Quintal');
  });

  it('answers 507 when the browser storage is full', async () => {
    await startLocalApi();
    server.use(...workerHandlers);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    expect((await fetch('/api/categoria', { method: 'POST', body: JSON.stringify({ nome: 'Horta' }) })).status).toBe(
      507,
    );
  });
});
