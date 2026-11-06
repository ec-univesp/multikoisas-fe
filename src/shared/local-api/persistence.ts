import { createDatabase, type ApiDatabase, type DatabaseSeed } from './database';
import { imageStore } from './imageStore';
import seed from './seed.json';

export const STORAGE_KEY = 'multikoisas:local-api:v1';

const TABLES = [
  'products',
  'categories',
  'productCategories',
  'productImages',
  'socialNetworks',
  'salesChannels',
  'purchaseLinks',
] as const;

// ponytail: checks the tables, not each row; a hand-edited broken row needs the reset.
const isDatabase = (value: unknown): value is DatabaseSeed & { nextId: number } => {
  if (typeof value !== 'object' || value === null) return false;
  const fields = new Map<string, unknown>(Object.entries(value));
  return typeof fields.get('nextId') === 'number' && TABLES.every((table) => Array.isArray(fields.get(table)));
};

const readSaved = (): unknown => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
  } catch {
    return null;
  }
};

export const loadDatabase = (): ApiDatabase => {
  const saved = readSaved();
  if (!isDatabase(saved)) return createDatabase(seed);
  const database = createDatabase(saved);
  return { ...database, nextId: Math.max(saved.nextId, database.nextId) };
};

export const reloadDatabase = (database: ApiDatabase) => {
  Object.assign(database, loadDatabase());
};

export const saveDatabase = (database: ApiDatabase) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
    return true;
  } catch {
    return false;
  }
};

export const resetDatabase = async () => {
  localStorage.removeItem(STORAGE_KEY);
  await imageStore.clear();
};
