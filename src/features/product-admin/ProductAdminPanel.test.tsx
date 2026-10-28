import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductAdminPanel } from './ProductAdminPanel';
import type { Category, Product } from '@/entities/product';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { recordApiRequests, server } from '@/test/msw/server';

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

let apiRequests: string[] = [];

beforeEach(() => {
  apiRequests = recordApiRequests();
});

const respondWith = (method: 'post' | 'delete', path: string, status: number) =>
  server.use(http[method](path, () => new HttpResponse(null, { status })));

const hang = (method: 'get' | 'post', path: string) =>
  server.use(http[method](path, () => delay('infinite')));

const photo = (name: string, type = 'image/png', size = 3) =>
  new File(['x'.repeat(size)], name, { type });

const photoIdsOf = (produtoId: number) =>
  apiDatabase.imagens.filter((imagem) => imagem.produtoId === produtoId).map((imagem) => imagem.id);

const linksOf = (produtoId: number) =>
  apiDatabase.categoriaProduto.filter((link) => link.produtoId === produtoId);

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
    expect(apiDatabase.produtos).toContainEqual({
      id: 100,
      nome: 'Balde Multiuso 12L',
      descricaoProduto: 'Balde resistente.',
    });
    expect(linksOf(100)).toEqual([{ produtoId: 100, categoriaId: 3 }]);
  });

  it('loads the latest product from the api before editing it', async () => {
    apiDatabase.produtos[0].nome = 'Garrafa Térmica Nova';
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));

    expect(await screen.findByLabelText('Nome do produto')).toHaveValue('Garrafa Térmica Nova');
    expect(apiRequests).toEqual([
      'GET /api/produto/1',
      'GET /api/categoriaproduto?produtoId=1',
      'GET /api/imagem/1',
    ]);
  });

  it('reloads the api photos of the product opened for edit and keeps them after a rename', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
    const nameInput = await screen.findByLabelText('Nome do produto');
    expect(screen.getByAltText('Garrafa Térmica 1L')).toHaveAttribute(
      'src',
      expect.stringContaining('garrafa-frente.webp'),
    );
    await user.clear(nameInput);
    await user.type(nameInput, 'Garrafa Inox');
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByAltText('Garrafa Inox')).toHaveAttribute(
      'src',
      expect.stringContaining('garrafa-frente.webp'),
    );
  });

  it('keeps the store links of a product after editing it', async () => {
    const user = userEvent.setup();
    renderPanel([buildProduct({ storeLinks: [{ store: 'shopee', url: 'https://shopee.com.br/garrafa-termica' }] })]);

    await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
    const nameInput = await screen.findByLabelText('Nome do produto');
    await user.clear(nameInput);
    await user.type(nameInput, 'Garrafa Inox');
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByText('Garrafa Inox', { selector: 'a' })).toBeInTheDocument();
    expect(screen.getByText('Shopee')).toBeInTheDocument();
  });

  it('opens the edit with the photos it already had when the api photos fail', async () => {
    server.use(http.get('*/imagem/:produtoId', () => new HttpResponse(null, { status: 500 })));
    const user = userEvent.setup();
    renderPanel([buildProduct({ images: ['https://avphmmvnlrbidhjrzozx.supabase.co/storage/v1/object/public/imagem/antiga.webp'] })]);

    await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));

    expect(await screen.findByLabelText('Nome do produto')).toHaveValue('Garrafa Térmica 1L');
    expect(screen.getByAltText('Garrafa Térmica 1L')).toHaveAttribute('src', expect.stringContaining('antiga.webp'));
  });

  it('shows the placeholder for a newly created product', async () => {
    const user = userEvent.setup();
    renderPanel([]);

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await fillProductForm(user, { name: 'Vassoura', categoryId: '2', description: 'Macia.' });
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByAltText('Vassoura')).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });

  it('drops a product that was deleted elsewhere when opening it for edit', async () => {
    apiDatabase.produtos = apiDatabase.produtos.filter((produto) => produto.id !== 5);
    const user = userEvent.setup();
    renderPanel([buildProduct({}), buildProduct({ id: 5, slug: 'balde-12l-5', name: 'Balde 12L', categoryId: null })]);

    await user.click(screen.getByRole('button', { name: 'Editar Balde 12L' }));

    expect(
      await screen.findByText('Esse produto já tinha sido apagado. A lista foi atualizada.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Balde 12L')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nome do produto')).not.toBeInTheDocument();
  });

  it('updates the product in the api without touching an unchanged category', async () => {
    apiDatabase.produtos[0].descricaoProduto = 'Mantém a temperatura por 12 horas.\nAmpola de vidro.';
    const user = userEvent.setup();
    renderPanel([buildProduct({}), buildProduct({ id: 5, slug: 'balde-5', name: 'Balde 12L' })]);

    await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
    const nameInput = await screen.findByLabelText('Nome do produto');
    await user.clear(nameInput);
    await user.type(nameInput, 'Garrafa Térmica 1.5L');
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByText('Garrafa Térmica 1.5L')).toBeInTheDocument();
    expect(screen.getByText('Balde 12L')).toBeInTheDocument();
    expect(apiDatabase.produtos).toContainEqual({
      id: 1,
      nome: 'Garrafa Térmica 1.5L',
      descricaoProduto: 'Mantém a temperatura por 12 horas.\nAmpola de vidro.',
    });
    expect(apiRequests).toEqual([
      'GET /api/produto/1',
      'GET /api/categoriaproduto?produtoId=1',
      'GET /api/imagem/1',
      'PUT /api/produto/1',
    ]);
  });

  it('moves the product to the new category when it changes', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
    await user.selectOptions(await screen.findByLabelText('Categoria'), '3');
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByText('Banheiros')).toBeInTheDocument();
    expect(linksOf(1)).toEqual([{ produtoId: 1, categoriaId: 3 }]);
    expect(apiRequests.slice(-3)).toEqual([
      'GET /api/categoriaproduto?produtoId=1',
      'DELETE /api/categoriaproduto',
      'POST /api/categoriaproduto',
    ]);
  });

  it('keeps only the chosen category when the product had several', async () => {
    const user = userEvent.setup();
    renderPanel([buildProduct({ id: 7, slug: 'caixa-7', name: 'Caixa' })]);

    await user.click(screen.getByRole('button', { name: 'Editar Caixa' }));
    await user.selectOptions(await screen.findByLabelText('Categoria'), '3');
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByText('Banheiros')).toBeInTheDocument();
    expect(linksOf(7)).toEqual([{ produtoId: 7, categoriaId: 3 }]);
    expect(apiRequests).not.toContain('POST /api/categoriaproduto');
  });

  it('lists a created product without category when linking the category fails', async () => {
    respondWith('post', '*/categoriaproduto', 500);
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
    await user.type(await screen.findByLabelText('Nome do produto'), ' Inox');
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));
    await user.click(await screen.findByRole('button', { name: 'Editar Garrafa Térmica 1L Inox' }));

    expect(await screen.findByLabelText('Nome do produto')).toHaveValue('Garrafa Térmica 1L Inox');
  });

  it('blocks cancel and a second submit while the product is being saved', async () => {
    hang('post', '*/produto');
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await fillProductForm(user, { name: 'Vassoura', categoryId: '2', description: 'Macia.' });
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });

  it('blocks a second confirmation while the product is being deleted', async () => {
    hang('get', '*/categoriaproduto');
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Garrafa Térmica 1L' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByRole('button', { name: 'Apagando...' })).toBeDisabled();
  });

  it('keeps the form open with a message when the api fails to save', async () => {
    respondWith('post', '*/produto', 500);
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
    expect(apiRequests).toEqual([]);
  });

  it('keeps the product when the deletion is cancelled', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Garrafa Térmica 1L' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByText('Garrafa Térmica 1L', { selector: 'a' })).toBeInTheDocument();
    expect(apiRequests).toEqual([]);
  });

  it('unlinks the categories, deletes the product in the api and shows the empty state', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Garrafa Térmica 1L' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText('Nenhum produto cadastrado.')).toBeInTheDocument();
    expect(apiRequests).toEqual([
      'GET /api/categoriaproduto?produtoId=1',
      'DELETE /api/categoriaproduto',
      'DELETE /api/produto/1',
    ]);
    expect(apiDatabase.produtos.map((produto) => produto.id)).not.toContain(1);
    expect(linksOf(1)).toEqual([]);
    expect(linksOf(7)).toEqual([
      { produtoId: 7, categoriaId: 2 },
      { produtoId: 7, categoriaId: 3 },
    ]);
  });

  it('deletes a product without category even though the api answers 404 for its links', async () => {
    const user = userEvent.setup();
    renderPanel([buildProduct({ id: 5, slug: 'balde-5', name: 'Balde 12L', categoryId: null })]);

    await user.click(screen.getByRole('button', { name: 'Apagar Balde 12L' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText('Nenhum produto cadastrado.')).toBeInTheDocument();
    expect(apiRequests).toEqual([
      'GET /api/categoriaproduto?produtoId=5',
      'DELETE /api/produto/5',
    ]);
  });

  it('keeps the product with a message when the api fails to delete it', async () => {
    respondWith('delete', '*/produto/:id', 500);
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Garrafa Térmica 1L' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(
      await screen.findByText('Não foi possível apagar o produto. Recarregue a página e tente de novo.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Garrafa Térmica 1L', { selector: 'a' })).toBeInTheDocument();
  });

  describe('photos of a new product', () => {
    it('creates the product and then uploads the chosen photos in order', async () => {
      const user = userEvent.setup();
      renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await fillProductForm(user, { name: 'Vassoura', categoryId: '2', description: 'Macia.' });
      expect(screen.getByText('JPG, PNG ou WebP, até 1 MB cada.')).toBeInTheDocument();
      await user.upload(screen.getByLabelText('Fotos'), [photo('frente.png'), photo('lado.webp', 'image/webp')]);
      expect(screen.getByAltText('Foto 1')).toHaveAttribute('src', expect.stringMatching(/^blob:/));
      expect(screen.getByAltText('Foto 2')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(await screen.findByAltText('Vassoura')).toHaveAttribute(
        'src',
        expect.stringContaining('upload-101'),
      );
      expect(apiRequests).toEqual([
        'POST /api/produto',
        'POST /api/categoriaproduto',
        'POST /api/imagem',
        'POST /api/imagem',
      ]);
      expect(photoIdsOf(100)).toEqual([101, 102]);
      expect(screen.queryByLabelText('Fotos')).not.toBeInTheDocument();
    });

    it('lets a chosen photo be dropped before saving and releases its preview', async () => {
      const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');
      const user = userEvent.setup();
      renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await fillProductForm(user, { name: 'Vassoura', categoryId: '2', description: 'Macia.' });
      await user.upload(screen.getByLabelText('Fotos'), [photo('frente.png'), photo('lado.png')]);
      const droppedPreview = screen.getByAltText('Foto 1').getAttribute('src');
      await user.click(screen.getByRole('button', { name: 'Remover foto 1' }));

      expect(revokeObjectURL).toHaveBeenCalledWith(droppedPreview);
      expect(screen.queryByAltText('Foto 2')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(await screen.findByAltText('Vassoura')).toBeInTheDocument();
      expect(apiRequests.filter((request) => request === 'POST /api/imagem')).toHaveLength(1);
      expect(photoIdsOf(100)).toEqual([101]);
    });

    it('discards the chosen photos and their previews when the form is cancelled', async () => {
      const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');
      const user = userEvent.setup();
      renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await user.upload(screen.getByLabelText('Fotos'), [photo('frente.png'), photo('lado.png')]);
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(revokeObjectURL).toHaveBeenCalledTimes(2);
      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      expect(screen.queryByAltText('Foto 1')).not.toBeInTheDocument();
      expect(apiRequests).toEqual([]);
    });
  });
});
