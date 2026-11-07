export type ImageStore = {
  save: (id: number, file: Blob) => Promise<void>;
  get: (id: number) => Promise<Blob | undefined>;
  remove: (id: number) => Promise<void>;
  clear: () => Promise<void>;
};

type StoredImage = { type: string; bytes: ArrayBuffer };

const DATABASE_NAME = 'multikoisas-images';
const STORE_NAME = 'images';

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const runInStore = async <Result>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<Result>,
): Promise<Result> => {
  const database = await openDatabase();
  try {
    return await new Promise<Result>((resolve, reject) => {
      const request = operation(database.transaction(STORE_NAME, mode).objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
};

// Bytes, not the Blob itself: not every structured clone implementation accepts a Blob.
export const imageStore: ImageStore = {
  save: async (id, file) => {
    const storedImage: StoredImage = { type: file.type, bytes: await file.arrayBuffer() };
    await runInStore('readwrite', (store) => store.put(storedImage, id));
  },
  get: async (id) => {
    const storedImage = await runInStore<StoredImage | undefined>('readonly', (store) => store.get(id));
    return storedImage && new Blob([storedImage.bytes], { type: storedImage.type });
  },
  remove: async (id) => {
    await runInStore('readwrite', (store) => store.delete(id));
  },
  clear: async () => {
    await runInStore('readwrite', (store) => store.clear());
  },
};

export const createMemoryImageStore = (): ImageStore => {
  const files = new Map<number, Blob>();
  return {
    save: async (id, file) => {
      files.set(id, file);
    },
    get: async (id) => files.get(id),
    remove: async (id) => {
      files.delete(id);
    },
    clear: async () => files.clear(),
  };
};
