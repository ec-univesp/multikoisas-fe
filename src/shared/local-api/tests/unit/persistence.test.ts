import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { imageStore } from '../../imageStore';
import { loadDatabase, resetDatabase, saveDatabase, STORAGE_KEY } from '../../persistence';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('local api persistence', () => {
  it('starts from the seed when nothing was saved', () => {
    const database = loadDatabase();
    expect(database.products).toHaveLength(5);
    expect(database.categories).toHaveLength(9);
    expect(database.nextId).toBe(27);
  });

  it('starts from the seed when the saved data is not json or has the wrong shape', () => {
    for (const saved of ['{not json', '[]', 'null', JSON.stringify({ products: [], nextId: 3 })]) {
      localStorage.setItem(STORAGE_KEY, saved);
      expect(loadDatabase().products).toHaveLength(5);
    }
  });

  it('reads back what was saved', () => {
    const database = loadDatabase();
    database.categories.push({ id: database.nextId++, nome: 'Jardim' });
    saveDatabase(database);
    const reloaded = loadDatabase();
    expect(reloaded.categories).toContainEqual({ id: 27, nome: 'Jardim' });
    expect(reloaded.nextId).toBe(28);
  });

  it('keeps working in memory when the storage is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => saveDatabase(loadDatabase())).not.toThrow();
    expect(console.warn).toHaveBeenCalled();
  });

  it('never hands out the seed itself', () => {
    loadDatabase().products.splice(0);
    expect(loadDatabase().products).toHaveLength(5);
  });

  it('resets the database to the seed and forgets the saved photos', async () => {
    const database = loadDatabase();
    database.products.splice(0);
    saveDatabase(database);
    await imageStore.save(27, new Blob(['foto'], { type: 'image/png' }));

    await resetDatabase(database);

    expect(database.products).toHaveLength(5);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(await imageStore.get(27)).toBeUndefined();
  });
});
