import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { imageStore } from '../../imageStore';
import { loadDatabase, reloadDatabase, resetDatabase, saveDatabase, STORAGE_KEY } from '../../persistence';

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

  it('tells whether the browser saved the data', () => {
    expect(saveDatabase(loadDatabase())).toBe(true);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(saveDatabase(loadDatabase())).toBe(false);
  });

  it('never hands out an id already taken by a saved row', () => {
    const database = loadDatabase();
    database.categories.push({ id: 40, nome: 'Jardim' });
    saveDatabase({ ...database, nextId: 3 });
    expect(loadDatabase().nextId).toBe(41);
  });

  it('replaces the data in memory with what another tab saved', () => {
    const database = loadDatabase();
    const otherTab = loadDatabase();
    otherTab.categories.push({ id: otherTab.nextId++, nome: 'Jardim' });
    saveDatabase(otherTab);

    reloadDatabase(database);

    expect(database.categories).toContainEqual({ id: 27, nome: 'Jardim' });
    expect(database.nextId).toBe(28);
  });

  it('starts the store settings from the seed with the default logo', () => {
    expect(loadDatabase().storeSettings).toEqual({
      address: 'Av. Prof. Luiz Inácio de Anhaia Melo, 2085 - Centreville, Santo André - SP',
      logoUrl: null,
    });
  });

  it('fills the store settings of data saved before they existed and keeps the rest', () => {
    const database = loadDatabase();
    database.products.splice(1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...database, storeSettings: undefined }));

    const reloaded = loadDatabase();

    expect(reloaded.products).toHaveLength(1);
    expect(reloaded.storeSettings.address).toBe(
      'Av. Prof. Luiz Inácio de Anhaia Melo, 2085 - Centreville, Santo André - SP',
    );
    expect(reloaded.storeSettings.logoUrl).toBeNull();
  });

  it.each([null, {}, 'Rua Nova'])('uses the default store settings when the saved ones are %j', (storeSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadDatabase(), storeSettings }));
    expect(loadDatabase().storeSettings).toEqual({
      address: 'Av. Prof. Luiz Inácio de Anhaia Melo, 2085 - Centreville, Santo André - SP',
      logoUrl: null,
    });
  });

  it('keeps each valid saved store setting and replaces the ones with the wrong type', () => {
    const storeSettings = { address: 7, googleRating: 4.9, logoUrl: '/local-images/9' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadDatabase(), storeSettings }));
    expect(loadDatabase().storeSettings).toEqual({
      address: 'Av. Prof. Luiz Inácio de Anhaia Melo, 2085 - Centreville, Santo André - SP',
      logoUrl: '/local-images/9',
    });
  });

  it('starts the users from the seed with the admin account', () => {
    expect(loadDatabase().users).toEqual([{ id: 8, username: 'admin', email: 'pi2alunos@gmail.com', role: 'ADMIN' }]);
  });

  it('fills the users of data saved before they existed and keeps the rest', () => {
    const database = loadDatabase();
    database.products.splice(1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...database, users: undefined }));

    const reloaded = loadDatabase();

    expect(reloaded.products).toHaveLength(1);
    expect(reloaded.users.map((user) => user.username)).toEqual(['admin']);
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

    await resetDatabase();

    expect(loadDatabase().products).toHaveLength(5);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(await imageStore.get(27)).toBeUndefined();
  });

  it('keeps the data and the photos when the browser refuses the reset', async () => {
    saveDatabase(loadDatabase());
    await imageStore.save(27, new Blob(['foto'], { type: 'image/png' }));
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });

    await expect(resetDatabase()).rejects.toThrow('denied');

    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(await imageStore.get(27)).toBeDefined();
  });
});
