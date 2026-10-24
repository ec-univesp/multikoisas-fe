import { type FetchOptions, getFromApi } from '@/shared/api/getFromApi';
import { toBaseSlug } from './toBaseSlug';
import type { Category, Product } from './types';

export type ProdutoResponse = { id: number; nome: string; descricaoProduto: string };
type CategoriaResponse = { id: number; nome: string };
type CategoriaProdutoResponse = { produtoId: number; categoriaId: number };
type ImagemResponse = { id: number; produtoId: number; imagemUrl: string };
type Catalog = { products: Product[]; categories: Category[] };

const UNCATEGORIZED = 'Sem categoria';

const firstNonEmptyLine = (text: string): string =>
  text.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim() ?? '';

const toImageUrls = (imagens: readonly ImagemResponse[]): string[] =>
  [...imagens].sort((first, second) => first.id - second.id).map((imagem) => imagem.imagemUrl);

export const toProduct = (
  produto: ProdutoResponse,
  category: Category | undefined,
  images: string[] = [],
): Product => ({
  id: produto.id,
  slug: `${toBaseSlug(produto.nome)}-${produto.id}`,
  name: produto.nome,
  category: category?.name ?? UNCATEGORIZED,
  categoryId: category?.id ?? null,
  shortDescription: firstNonEmptyLine(produto.descricaoProduto),
  longDescription: produto.descricaoProduto.trim(),
  images,
  // ponytail: a API ainda não expõe link de compra (UNIV-12 no santi)
  storeLinks: [],
});

export const fetchCategories = async (options: FetchOptions = {}): Promise<Category[]> =>
  (await getFromApi<CategoriaResponse[]>('/categoria', options)).map((categoria) => ({
    id: categoria.id,
    name: categoria.nome,
  }));

export const fetchProductImages = async (produtoId: number, options: FetchOptions = {}): Promise<string[]> =>
  toImageUrls(await getFromApi<ImagemResponse[]>(`/imagem/${produtoId}`, options));

export const fetchCatalog = async (options: FetchOptions = {}): Promise<Catalog> => {
  const [produtos, categories, vinculos, imagens] = await Promise.all([
    getFromApi<ProdutoResponse[]>('/produto', options),
    fetchCategories(options),
    getFromApi<CategoriaProdutoResponse[]>('/categoriaproduto', options),
    // Foto é acessória: sem a lista de imagens a vitrine segue com o placeholder.
    getFromApi<ImagemResponse[]>('/imagem', options).catch((): ImagemResponse[] => []),
  ]);
  const categoryOf = (produtoId: number): Category | undefined => {
    const vinculo = vinculos.find((candidate) => candidate.produtoId === produtoId);
    return categories.find((category) => category.id === vinculo?.categoriaId);
  };
  const imagesOf = (produtoId: number): string[] =>
    toImageUrls(imagens.filter((imagem) => imagem.produtoId === produtoId));
  return {
    products: produtos.map((produto) => toProduct(produto, categoryOf(produto.id), imagesOf(produto.id))),
    categories,
  };
};

export const fetchProducts = async (options: FetchOptions = {}): Promise<Product[]> =>
  (await fetchCatalog(options)).products;

export const fetchProductBySlug = async (slug: string): Promise<Product | undefined> =>
  (await fetchProducts()).find((product) => product.slug === slug);
