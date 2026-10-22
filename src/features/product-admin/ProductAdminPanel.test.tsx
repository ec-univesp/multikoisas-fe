import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductAdminPanel } from './ProductAdminPanel';
import type { Category, Product } from '@/entities/product';

const categories: Category[] = [
  { id: 2, name: 'Utensílios de Cozinha' },
  { id: 3, name: 'Banheiros' },
];

const buildProduct = (overrides: Partial<Product>): Product => ({
  id: 1,
  slug: 'garrafa-termica-1l-1',
  name: 'Garrafa Térmica 1L',
  category: 'Utensílios de Cozinha',
  categoryId: 2,
  shortDescription: 'Mantém a temperatura por 12 horas.',
  longDescription: 'Mantém a temperatura por 12 horas.\nAmpola de vidro.',
  images: [],
  storeLinks: [],
  ...overrides,
});

type ApiCall = { method: string; path: string; body: unknown };

let apiCalls: ApiCall[] = [];
let failingRequest: string | null = null;
let hangingRequest: string | null = null;

const respondTo = (method: string, path: string, body: unknown): Response => {
  if (`${method} ${path}`.startsWith(failingRequest ?? '-')) return new Response(null, { status: 500 });
  if (method === 'POST' && path === '/api/produto') {
    const request = body as { nome: string; descricaoProduto: string };
    return Response.json({ id: 99, ...request });
  }
  if (method === 'GET' && path === '/api/categoriaproduto?produto=5') {
    return new Response(null, { status: 404 });
  }
  if (method === 'GET' && path === '/api/categoriaproduto?produto=1') {
    return Response.json([{ produtoId: 1, categoriaId: 2 }]);
  }
  if (method === 'GET' && path === '/api/categoriaproduto?produto=7') {
    return Response.json([
      { produtoId: 7, categoriaId: 2 },
      { produtoId: 7, categoriaId: 3 },
    ]);
  }
  return new Response(null, { status: 200 });
};

beforeEach(() => {
  apiCalls = [];
  failingRequest = null;
  hangingRequest = null;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init: RequestInit = {}) => {
      const method = init.method ?? 'GET';
      const body = init.body ? JSON.parse(String(init.body)) : undefined;
      apiCalls.push({ method, path, body });
      if (`${method} ${path}`.startsWith(hangingRequest ?? '-')) return new Promise<Response>(() => {});
      return respondTo(method, path, body);
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const renderPanel = (products: Product[] = [buildProduct({})]) =>
  render(<ProductAdminPanel initialProducts={products} categories={categories} />);

const fillProductForm = async (
  user: ReturnType<typeof userEvent.setup>,
  fields: { name: string; categoryId: string; description: string },
) => {
  await user.type(screen.getByLabelText('Nome do produto'), fields.name);
  await user.selectOptions(screen.getByLabelText('Categoria'), fields.categoryId);
  await user.type(screen.getByLabelText('Descrição'), fields.description);
};

describe('ProductAdminPanel', () => {
  it('shows a placeholder photo for a product without images', () => {
    renderPanel();
    expect(screen.getByAltText('Garrafa Térmica 1L')).toHaveAttribute(
      'src',
      expect.stringContaining('placeholder'),
    );
  });

  it('creates the product in the api, links its category and lists it', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await fillProductForm(user, {
      name: 'Balde Multiuso 12L',
      categoryId: '3',
      description: 'Balde resistente.',
    });
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByText('Balde Multiuso 12L')).toBeInTheDocument();
    expect(apiCalls).toEqual([
      {
        method: 'POST',
        path: '/api/produto',
        body: { nome: 'Balde Multiuso 12L', descricaoProduto: 'Balde resistente.' },
      },
      { method: 'POST', path: '/api/categoriaproduto', body: { produtoId: 99, categoriaId: 3 } },
    ]);
  });

  it('updates the product in the api without touching an unchanged category', async () => {
    const user = userEvent.setup();
    renderPanel([buildProduct({}), buildProduct({ id: 5, slug: 'balde-5', name: 'Balde 12L' })]);

    await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
    const nameInput = screen.getByLabelText('Nome do produto');
    await user.clear(nameInput);
    await user.type(nameInput, 'Garrafa Térmica 1.5L');
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByText('Garrafa Térmica 1.5L')).toBeInTheDocument();
    expect(screen.getByText('Balde 12L')).toBeInTheDocument();
    expect(apiCalls).toEqual([
      {
        method: 'PUT',
        path: '/api/produto/1',
        body: {
          nome: 'Garrafa Térmica 1.5L',
          descricaoProduto: 'Mantém a temperatura por 12 horas.\nAmpola de vidro.',
        },
      },
    ]);
  });

  it('moves the product to the new category when it changes', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
    await user.selectOptions(screen.getByLabelText('Categoria'), '3');
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByText('Banheiros')).toBeInTheDocument();
    expect(apiCalls.slice(1)).toEqual([
      { method: 'GET', path: '/api/categoriaproduto?produto=1', body: undefined },
      { method: 'DELETE', path: '/api/categoriaproduto', body: { produtoId: 1, categoriaId: 2 } },
      { method: 'POST', path: '/api/categoriaproduto', body: { produtoId: 1, categoriaId: 3 } },
    ]);
  });

  it('keeps only the chosen category when the product had several', async () => {
    const user = userEvent.setup();
    renderPanel([buildProduct({ id: 7, slug: 'caixa-7', name: 'Caixa' })]);

    await user.click(screen.getByRole('button', { name: 'Editar Caixa' }));
    await user.selectOptions(screen.getByLabelText('Categoria'), '3');
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByText('Banheiros')).toBeInTheDocument();
    expect(apiCalls.slice(1).map(({ method, path, body }) => [method, path, body])).toEqual([
      ['GET', '/api/categoriaproduto?produto=7', undefined],
      ['DELETE', '/api/categoriaproduto', { produtoId: 7, categoriaId: 2 }],
    ]);
  });

  it('lists a created product without category when linking the category fails', async () => {
    failingRequest = 'POST /api/categoriaproduto';
    const user = userEvent.setup();
    renderPanel([]);

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await fillProductForm(user, { name: 'Vassoura', categoryId: '2', description: 'Macia.' });
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(
      await screen.findByText('Produto salvo, mas sem categoria. Edite o produto para escolher de novo.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Vassoura', { selector: 'a' })).toBeInTheDocument();
    expect(screen.getByText('Sem categoria')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nome do produto')).not.toBeInTheDocument();
  });

  it('shows the saved data when the same product is edited again', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
    await user.type(screen.getByLabelText('Nome do produto'), ' Inox');
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));
    await user.click(await screen.findByRole('button', { name: 'Editar Garrafa Térmica 1L Inox' }));

    expect(screen.getByLabelText('Nome do produto')).toHaveValue('Garrafa Térmica 1L Inox');
  });

  it('blocks cancel and a second submit while the product is being saved', async () => {
    hangingRequest = 'POST /api/produto';
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await fillProductForm(user, { name: 'Vassoura', categoryId: '2', description: 'Macia.' });
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });

  it('blocks a second confirmation while the product is being deleted', async () => {
    hangingRequest = 'GET /api/categoriaproduto';
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Garrafa Térmica 1L' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByRole('button', { name: 'Apagando...' })).toBeDisabled();
  });

  it('keeps the form open with a message when the api fails to save', async () => {
    failingRequest = 'POST /api/produto';
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await fillProductForm(user, { name: 'Vassoura', categoryId: '2', description: 'Macia.' });
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(
      await screen.findByText('Não foi possível salvar o produto. Tente de novo.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do produto')).toBeInTheDocument();
    expect(screen.queryByText('Vassoura', { selector: 'a' })).not.toBeInTheDocument();
  });

  it('requires name, category and description before calling the api', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(screen.getByText('Informe o nome do produto.')).toBeInTheDocument();
    expect(screen.getByText('Escolha a categoria do produto.')).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Informe a descrição do produto.')).toBeInTheDocument();
    expect(apiCalls).toEqual([]);
  });

  it('keeps the product when the deletion is cancelled', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Garrafa Térmica 1L' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByText('Garrafa Térmica 1L', { selector: 'a' })).toBeInTheDocument();
    expect(apiCalls).toEqual([]);
  });

  it('unlinks the categories, deletes the product in the api and shows the empty state', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Garrafa Térmica 1L' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText('Nenhum produto cadastrado.')).toBeInTheDocument();
    expect(apiCalls).toEqual([
      { method: 'GET', path: '/api/categoriaproduto?produto=1', body: undefined },
      { method: 'DELETE', path: '/api/categoriaproduto', body: { produtoId: 1, categoriaId: 2 } },
      { method: 'DELETE', path: '/api/produto/1', body: undefined },
    ]);
  });

  it('deletes a product without category even though the api answers 404 for its links', async () => {
    const user = userEvent.setup();
    renderPanel([buildProduct({ id: 5, slug: 'balde-5', name: 'Balde 12L', categoryId: null })]);

    await user.click(screen.getByRole('button', { name: 'Apagar Balde 12L' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText('Nenhum produto cadastrado.')).toBeInTheDocument();
    expect(apiCalls.map(({ method, path }) => `${method} ${path}`)).toEqual([
      'GET /api/categoriaproduto?produto=5',
      'DELETE /api/produto/5',
    ]);
  });

  it('keeps the product with a message when the api fails to delete it', async () => {
    failingRequest = 'DELETE /api/produto';
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Garrafa Térmica 1L' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(
      await screen.findByText('Não foi possível apagar o produto. Recarregue a página e tente de novo.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Garrafa Térmica 1L', { selector: 'a' })).toBeInTheDocument();
  });
});
