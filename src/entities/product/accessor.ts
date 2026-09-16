import rawProducts from '@/data/products.json';
import type { Product, StoreLink } from './types';
import { STORE_LABELS } from './types';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isStoreLink = (value: unknown): value is StoreLink => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.url) &&
    typeof candidate.store === 'string' &&
    candidate.store in STORE_LABELS
  );
};

const assertProduct = (value: unknown, index: number): Product => {
  const candidate = (value ?? {}) as Record<string, unknown>;
  const slug = isNonEmptyString(candidate.slug) ? candidate.slug : `produto na posição ${index}`;
  const fail = (reason: string): never => {
    throw new Error(`Produto inválido (${slug}): ${reason}`);
  };

  if (!isNonEmptyString(candidate.slug)) fail('slug ausente');
  if (!isNonEmptyString(candidate.name)) fail('name ausente');
  if (!isNonEmptyString(candidate.category)) fail('category ausente');
  if (!isNonEmptyString(candidate.shortDescription)) fail('shortDescription ausente');
  if (!isNonEmptyString(candidate.longDescription)) fail('longDescription ausente');
  if (
    !Array.isArray(candidate.images) ||
    candidate.images.length === 0 ||
    !candidate.images.every(isNonEmptyString)
  )
    fail('images deve ter ao menos um caminho');
  if (
    !Array.isArray(candidate.storeLinks) ||
    candidate.storeLinks.length === 0 ||
    !candidate.storeLinks.every(isStoreLink)
  )
    fail('storeLinks deve ter ao menos uma loja conhecida');

  return value as Product;
};

export const parseProducts = (rawList: unknown): readonly Product[] => {
  if (!Array.isArray(rawList)) throw new Error('products.json deve conter uma lista');
  const products = rawList.map(assertProduct);
  const uniqueSlugs = new Set(products.map((product) => product.slug));
  if (uniqueSlugs.size !== products.length) throw new Error('products.json contém slug duplicado');
  return products;
};

const products = parseProducts(rawProducts);

export const getProducts = (): readonly Product[] => products;

export const getProductBySlug = (slug: string): Product | undefined =>
  products.find((product) => product.slug === slug);

export const getCategories = (): readonly string[] =>
  [...new Set(products.map((product) => product.category))].sort();
