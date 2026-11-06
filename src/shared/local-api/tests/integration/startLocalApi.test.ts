import 'fake-indexeddb/auto';
import type { RequestHandler } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { STORAGE_KEY } from '../../persistence';
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

afterEach(() => localStorage.clear());

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
    expect(imagemUrl).toBe(`${location.origin}/local-images/28`);
    expect(await (await fetch(imagemUrl)).text()).toBe('png');
  });
});
