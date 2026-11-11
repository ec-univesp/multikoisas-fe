export type ImageStore = {
  save: (id: number, file: Blob) => Promise<void>;
  get: (id: number) => Promise<Blob | undefined>;
  remove: (id: number) => Promise<void>;
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
  };
};
