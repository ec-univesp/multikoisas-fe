import { toBaseSlug } from './createSlugFromName';
import type { Product } from './types';

type ProdutoResponse = { id: number; nome: string; descricaoProduto: string };
type CategoriaResponse = { id: number; nome: string };
type CategoriaProdutoResponse = { produtoId: number; categoriaId: number };

export const API_URL = process.env.MULTIKOISAS_API_URL ?? 'https://multikoisas-univesp.onrender.com';
const REVALIDATE_SECONDS = 300;
const UNCATEGORIZED = 'Sem categoria';

const getFromApi = async <Body>(path: string): Promise<Body> => {
  const response = await fetch(`${API_URL}${path}`, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!response.ok) throw new Error(`API ${path} respondeu ${response.status}`);
  return response.json();
};

const firstNonEmptyLine = (text: string): string =>
  text.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim() ?? '';

const toProduct = (produto: ProdutoResponse, category: string): Product => ({
  id: produto.id,
  slug: `${toBaseSlug(produto.nome)}-${produto.id}`,
  name: produto.nome,
  category,
  shortDescription: firstNonEmptyLine(produto.descricaoProduto),
  longDescription: produto.descricaoProduto.trim(),
  // ponytail: a API ainda não expõe imagem nem link de compra (BE-1, BE-2 em docs/specs/2026-10-22-integracao-api.md)
  images: [],
  storeLinks: [],
});

export const fetchProducts = async (): Promise<Product[]> => {
  const [produtos, categorias, vinculos] = await Promise.all([
    getFromApi<ProdutoResponse[]>('/produto'),
    getFromApi<CategoriaResponse[]>('/categoria'),
    getFromApi<CategoriaProdutoResponse[]>('/categoriaproduto'),
  ]);
  const categoryNameById = new Map(categorias.map((categoria) => [categoria.id, categoria.nome]));
  const categoryNameOf = (produtoId: number): string => {
    const vinculo = vinculos.find((candidate) => candidate.produtoId === produtoId);
    return (vinculo && categoryNameById.get(vinculo.categoriaId)) ?? UNCATEGORIZED;
  };
  return produtos.map((produto) => toProduct(produto, categoryNameOf(produto.id)));
};

export const fetchProductBySlug = async (slug: string): Promise<Product | undefined> =>
  (await fetchProducts()).find((product) => product.slug === slug);
