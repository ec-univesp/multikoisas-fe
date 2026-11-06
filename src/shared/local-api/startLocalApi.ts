import type { ApiDatabase } from './database';
import { createApiHandlers, createLocalImagesHandler } from './handlers';
import { imageStore } from './imageStore';
import { loadDatabase, saveDatabase } from './persistence';

let workerStarted: Promise<void> | undefined;
let localDatabase: ApiDatabase | undefined;

export const getLocalDatabase = (): ApiDatabase => (localDatabase ??= loadDatabase());

const startWorker = async () => {
  // msw/browser has no server build: imported only once the page runs in the browser.
  const { setupWorker } = await import('msw/browser');
  const database = getLocalDatabase();
  const worker = setupWorker(
    ...createApiHandlers(database, {
      baseUrl: '/api',
      onChange: () => saveDatabase(database),
      images: imageStore,
      imageUrl: (id) => `${window.location.origin}/local-images/${id}`,
      reproduceApiBugs: false,
    }),
    createLocalImagesHandler(imageStore),
  );
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true, serviceWorker: { url: '/mockServiceWorker.js' } });
};

export const startLocalApi = () => {
  workerStarted ??= startWorker();
  return workerStarted;
};
