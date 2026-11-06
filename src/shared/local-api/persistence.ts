import { createDatabase, type ApiDatabase } from './database';
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
const isDatabase = (value: unknown): value is ApiDatabase => {
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
  return isDatabase(saved) ? saved : createDatabase(seed);
};

export const saveDatabase = (database: ApiDatabase) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  } catch (error) {
    console.warn('Dados mantidos só nesta aba: o navegador recusou salvar.', error);
  }
};

export const resetDatabase = async (database: ApiDatabase) => {
  Object.assign(database, createDatabase(seed));
  localStorage.removeItem(STORAGE_KEY);
  await imageStore.clear();
};
