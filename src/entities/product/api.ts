import { type FetchOptions, getFromApi } from '@/shared/api/getFromApi';
import { toBaseSlug } from './toBaseSlug';
import type { Category, Product } from './types';

export type ProdutoResponse = { id: number; nome: string; descricaoProduto: string };
type CategoriaResponse = { id: number; nome: string };
type CategoriaProdutoResponse = { produtoId: number; categoriaId: number };
type Catalog = { products: Product[]; categories: Category[] };

const UNCATEGORIZED = 'Sem categoria';

const firstNonEmptyLine = (text: string): string =>
  text.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim() ?? '';

export const toProduct = (produto: ProdutoResponse, category: Category | undefined): Product => ({
  id: produto.id,
  slug: `${toBaseSlug(produto.nome)}-${produto.id}`,
  name: produto.nome,
  category: category?.name ?? UNCATEGORIZED,
  categoryId: category?.id ?? null,
  shortDescription: firstNonEmptyLine(produto.descricaoProduto),
  longDescription: produto.descricaoProduto.trim(),
  // ponytail: a API ainda não expõe imagem nem link de compra (UNIV-11, UNIV-12 no santi)
  images: [],
  storeLinks: [],
});

export const fetchCategories = async (options: FetchOptions = {}): Promise<Category[]> =>
  (await getFromApi<CategoriaResponse[]>('/categoria', options)).map((categoria) => ({
    id: categoria.id,
    name: categoria.nome,
  }));

export const fetchCatalog = async (options: FetchOptions = {}): Promise<Catalog> => {
  const [produtos, categories, vinculos] = await Promise.all([
    getFromApi<ProdutoResponse[]>('/produto', options),
    fetchCategories(options),
    getFromApi<CategoriaProdutoResponse[]>('/categoriaproduto', options),
  ]);
  const categoryOf = (produtoId: number): Category | undefined => {
    const vinculo = vinculos.find((candidate) => candidate.produtoId === produtoId);
    return categories.find((category) => category.id === vinculo?.categoriaId);
  };
  return { products: produtos.map((produto) => toProduct(produto, categoryOf(produto.id))), categories };
};

export const fetchProducts = async (options: FetchOptions = {}): Promise<Product[]> =>
  (await fetchCatalog(options)).products;

export const fetchProductBySlug = async (slug: string): Promise<Product | undefined> =>
  (await fetchProducts()).find((product) => product.slug === slug);
