let workerStarted: Promise<void> | undefined;

const READ_METHODS = new Set(['GET', 'HEAD']);

const startWorker = async () => {
  // msw/browser has no server build: the local api loads only once the page runs in the browser.
  const [{ http }, { setupWorker }, { createApiHandlers, createLocalImagesHandler }, { imageStore }, persistence] =
    await Promise.all([
      import('msw'),
      import('msw/browser'),
      import('./handlers'),
      import('./imageStore'),
      import('./persistence'),
    ]);
  const database = persistence.loadDatabase();
  const reloadSavedDatabase = () => persistence.reloadDatabase(database);
  window.addEventListener('storage', (event) => {
    if (event.key === persistence.STORAGE_KEY) reloadSavedDatabase();
  });
  const worker = setupWorker(
    // Another tab may have saved since this one last read the browser storage.
    http.all('/api/*', ({ request }) => {
      if (!READ_METHODS.has(request.method)) reloadSavedDatabase();
    }),
    ...createApiHandlers(database, {
      baseUrl: '/api',
      onChange: () => persistence.saveDatabase(database),
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
