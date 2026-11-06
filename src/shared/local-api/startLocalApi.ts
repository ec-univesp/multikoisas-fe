import { createApiHandlers, createLocalImagesHandler } from './handlers';
import { imageStore } from './imageStore';
import { loadDatabase, saveDatabase } from './persistence';

let workerStarted: Promise<void> | undefined;

const startWorker = async () => {
  // msw/browser has no server build: imported only once the page runs in the browser.
  const { setupWorker } = await import('msw/browser');
  const database = loadDatabase();
  const worker = setupWorker(
    ...createApiHandlers(database, {
      baseUrl: '/api',
      onChange: () => saveDatabase(database),
      images: imageStore,
      imageUrl: (id) => `${window.location.origin}/local-images/${id}`,
    }),
    createLocalImagesHandler(imageStore),
  );
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true, serviceWorker: { url: '/mockServiceWorker.js' } });
};

export const startLocalApi = () => {
  workerStarted ??= startWorker();
  return workerStarted;
};
