import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductAdminPanel } from '../../ProductAdminPanel';
import type { Category, Product } from '@/entities/product';
import type { SalesChannel } from '@/entities/sales-channel';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { recordApiRequests, server } from '@/test/msw/server';

const categories: Category[] = [
  { id: 2, name: 'Utensílios de Cozinha' },
  { id: 3, name: 'Banheiros' },
];

const salesChannels: SalesChannel[] = [
  { id: 2, name: 'Shopee' },
  { id: 3, name: 'Instagram' },
  { id: 4, name: 'Facebook' },
  { id: 8, name: 'MagaLu' },
  { id: 14, name: 'MAGAZINE LUIZA' },
  { id: 15, name: 'Mercado Livre' },
];

const buildProduct = (overrides: Partial<Product>): Product => ({
  id: 1,
  slug: 'garrafa-termica-1l-1',
  name: 'Garrafa Térmica 1L',
  categories: [{ id: 2, name: 'Utensílios de Cozinha' }],
  shortDescription: 'Mantém a temperatura por 12 horas.',
  longDescription: 'Mantém a temperatura por 12 horas.\nAmpola de vidro.',
  images: [],
  storeLinks: [],
  ...overrides,
});

let apiRequests: string[] = [];

beforeEach(() => {
  vi.restoreAllMocks();
  apiRequests = recordApiRequests();
});

const respondWith = (method: 'post' | 'put' | 'delete', path: string, status: number) =>
  server.use(http[method](path, () => new HttpResponse(null, { status })));

const hang = (method: 'get' | 'post' | 'delete', path: string) =>
  server.use(http[method](path, () => delay('infinite')));

const photo = (name: string, type = 'image/png', size = 3) => new File(['x'.repeat(size)], name, { type });

const photoIdsOf = (produtoId: number) =>
  apiDatabase.productImages
    .filter((productImage) => productImage.produtoId === produtoId)
    .map((productImage) => productImage.id);

const purchaseLinksOf = (produtoId: number) => apiDatabase.purchaseLinks.filter((link) => link.produtoId === produtoId);

const linksOf = (produtoId: number) => apiDatabase.productCategories.filter((link) => link.produtoId === produtoId);

const renderPanel = (products: Product[] = [buildProduct({})], availableSalesChannels = salesChannels) =>
  render(
    <ProductAdminPanel initialProducts={products} categories={categories} salesChannels={availableSalesChannels} />,
  );

const optionsOf = (select: HTMLElement) =>
  Array.from(select.querySelectorAll('option:not([disabled])')).map((option) => option.textContent);

const fillProductForm = async (
  user: ReturnType<typeof userEvent.setup>,
  fields: { name: string; categories: string[]; description: string },
) => {
  await user.type(screen.getByLabelText('Nome do produto'), fields.name);
  for (const categoryName of fields.categories) await user.click(screen.getByRole('checkbox', { name: categoryName }));
  await user.type(screen.getByLabelText('Descrição'), fields.description);
};

describe('ProductAdminPanel', () => {
  it('shows a placeholder photo for a product without images', () => {
    renderPanel();
    expect(screen.getByAltText('Garrafa Térmica 1L')).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });

  it('creates the product in the api, links every chosen category and lists it', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await fillProductForm(user, {
      name: 'Balde Multiuso 12L',
      categories: ['Banheiros', 'Utensílios de Cozinha'],
      description: 'Balde resistente.',
    });
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByText('Balde Multiuso 12L')).toBeInTheDocument();
    expect(screen.getByText('Utensílios de Cozinha, Banheiros')).toBeInTheDocument();
    expect(apiDatabase.products).toContainEqual({
      id: 100,
      nome: 'Balde Multiuso 12L',
      descricaoProduto: 'Balde resistente.',
    });
    expect(linksOf(100)).toEqual([
      { produtoId: 100, categoriaId: 2 },
      { produtoId: 100, categoriaId: 3 },
    ]);
  });

  it('offers a large checkbox per category', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));

    const categoryGroup = screen.getByRole('group', { name: 'Categorias' });
    expect(within(categoryGroup).getAllByRole('checkbox')).toHaveLength(2);
    expect(within(categoryGroup).getByText('Banheiros')).toHaveClass('text-base');
    expect(within(categoryGroup).getByText('Banheiros').closest('label')).toHaveClass('min-h-11');
  });

  it('loads the latest product from the api before editing it', async () => {
    apiDatabase.products[0].nome = 'Garrafa Térmica Nova';
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));

    expect(await screen.findByLabelText('Nome do produto')).toHaveValue('Garrafa Térmica Nova');
    expect(apiRequests).toEqual([
      'GET /api/produto?id=1',
      'GET /api/categoriaproduto?produtoId=1',
      'GET /api/imagem?produtoId=1',
      'GET /api/canalvendaproduto?produtoId=1',
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
    server.use(http.get('*/imagem', () => new HttpResponse(null, { status: 500 })));
    const user = userEvent.setup();
    renderPanel([
      buildProduct({
        images: ['https://avphmmvnlrbidhjrzozx.supabase.co/storage/v1/object/public/imagem/antiga.webp'],
      }),
    ]);

    await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));

    expect(await screen.findByLabelText('Nome do produto')).toHaveValue('Garrafa Térmica 1L');
    expect(screen.getByAltText('Garrafa Térmica 1L')).toHaveAttribute('src', expect.stringContaining('antiga.webp'));
  });

  it('shows the placeholder for a newly created product', async () => {
    const user = userEvent.setup();
    renderPanel([]);

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await fillProductForm(user, { name: 'Vassoura', categories: ['Utensílios de Cozinha'], description: 'Macia.' });
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByAltText('Vassoura')).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });

  it('drops a product that was deleted elsewhere when opening it for edit', async () => {
    apiDatabase.products = apiDatabase.products.filter((product) => product.id !== 5);
    const user = userEvent.setup();
    renderPanel([buildProduct({}), buildProduct({ id: 5, slug: 'balde-12l-5', name: 'Balde 12L', categories: [] })]);

    await user.click(screen.getByRole('button', { name: 'Editar Balde 12L' }));

    expect(await screen.findByText('Esse produto já tinha sido apagado. A lista foi atualizada.')).toBeInTheDocument();
    expect(screen.queryByText('Balde 12L')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nome do produto')).not.toBeInTheDocument();
  });

  it('updates the product in the api without touching an unchanged category', async () => {
    apiDatabase.products[0].descricaoProduto = 'Mantém a temperatura por 12 horas.\nAmpola de vidro.';
    const user = userEvent.setup();
    renderPanel([buildProduct({}), buildProduct({ id: 5, slug: 'balde-5', name: 'Balde 12L' })]);

    await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
    const nameInput = await screen.findByLabelText('Nome do produto');
    await user.clear(nameInput);
    await user.type(nameInput, 'Garrafa Térmica 1.5L');
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByText('Garrafa Térmica 1.5L')).toBeInTheDocument();
    expect(screen.getByText('Balde 12L')).toBeInTheDocument();
    expect(apiDatabase.products).toContainEqual({
      id: 1,
      nome: 'Garrafa Térmica 1.5L',
      descricaoProduto: 'Mantém a temperatura por 12 horas.\nAmpola de vidro.',
    });
    expect(apiRequests).toEqual([
      'GET /api/produto?id=1',
      'GET /api/categoriaproduto?produtoId=1',
      'GET /api/imagem?produtoId=1',
      'GET /api/canalvendaproduto?produtoId=1',
      'PUT /api/produto/1',
    ]);
  });

  it('unlinks the removed category and links the added one with one request each', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
    await user.click(await screen.findByRole('checkbox', { name: 'Utensílios de Cozinha' }));
    await user.click(screen.getByRole('checkbox', { name: 'Banheiros' }));
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByText('Banheiros')).toBeInTheDocument();
    expect(linksOf(1)).toEqual([{ produtoId: 1, categoriaId: 3 }]);
    expect(apiRequests.slice(-3)).toEqual([
      'PUT /api/produto/1',
      'DELETE /api/categoriaproduto',
      'POST /api/categoriaproduto',
    ]);
  });

  it('loads every category of a product and unlinks only the unchecked one', async () => {
    const user = userEvent.setup();
    renderPanel([buildProduct({ id: 7, slug: 'caixa-7', name: 'Caixa' })]);

    await user.click(screen.getByRole('button', { name: 'Editar Caixa' }));
    expect(await screen.findByRole('checkbox', { name: 'Banheiros' })).toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'Utensílios de Cozinha' }));
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByText('Banheiros')).toBeInTheDocument();
    expect(linksOf(7)).toEqual([{ produtoId: 7, categoriaId: 3 }]);
    expect(apiRequests).not.toContain('POST /api/categoriaproduto');
  });

  it('asks for at least one category when every box is unchecked', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
    await user.click(await screen.findByRole('checkbox', { name: 'Utensílios de Cozinha' }));
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(screen.getByText('Escolha pelo menos uma categoria do produto.')).toHaveAttribute('role', 'alert');
    expect(apiRequests).not.toContain('PUT /api/produto/1');
  });

  it('lists a created product with the categories that were linked when another link fails', async () => {
    server.use(
      http.post<never, { produtoId: number; categoriaId: number }>('*/categoriaproduto', async ({ request }) => {
        const { categoriaId } = await request.clone().json();
        return categoriaId === 3 ? new HttpResponse(null, { status: 500 }) : undefined;
      }),
    );
    const user = userEvent.setup();
    renderPanel([]);

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await fillProductForm(user, {
      name: 'Vassoura',
      categories: ['Utensílios de Cozinha', 'Banheiros'],
      description: 'Macia.',
    });
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(
      await screen.findByText(
        'Produto salvo, mas nem todas as categorias foram salvas. Edite o produto para escolher de novo.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Utensílios de Cozinha', { selector: 'td' })).toBeInTheDocument();
    expect(linksOf(100)).toEqual([{ produtoId: 100, categoriaId: 2 }]);
  });

  it('lists a created product without category when linking the category fails', async () => {
    respondWith('post', '*/categoriaproduto', 500);
    const user = userEvent.setup();
    renderPanel([]);

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await fillProductForm(user, { name: 'Vassoura', categories: ['Utensílios de Cozinha'], description: 'Macia.' });
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(
      await screen.findByText(
        'Produto salvo, mas nem todas as categorias foram salvas. Edite o produto para escolher de novo.',
      ),
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
    await fillProductForm(user, { name: 'Vassoura', categories: ['Utensílios de Cozinha'], description: 'Macia.' });
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });

  it('blocks a second confirmation while the product is being deleted', async () => {
    hang('delete', '*/produto/:id');
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
    await fillProductForm(user, { name: 'Vassoura', categories: ['Utensílios de Cozinha'], description: 'Macia.' });
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByText('Não foi possível salvar o produto. Tente de novo.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do produto')).toBeInTheDocument();
    expect(screen.queryByText('Vassoura', { selector: 'a' })).not.toBeInTheDocument();
  });

  it('requires name, category and description before calling the api', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(screen.getByText('Informe o nome do produto.')).toBeInTheDocument();
    expect(screen.getByText('Escolha pelo menos uma categoria do produto.')).toHaveAttribute('role', 'alert');
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

  it('deletes the product in one call, which also drops its categories and store links', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Garrafa Térmica 1L' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText('Nenhum produto cadastrado.')).toBeInTheDocument();
    expect(apiRequests).toEqual(['DELETE /api/produto/1']);
    expect(apiDatabase.products.map((product) => product.id)).not.toContain(1);
    expect(linksOf(1)).toEqual([]);
    expect(purchaseLinksOf(1)).toEqual([]);
    expect(linksOf(7)).toEqual([
      { produtoId: 7, categoriaId: 2 },
      { produtoId: 7, categoriaId: 3 },
    ]);
  });

  it('explains that the api only deletes a product with category and store link', async () => {
    const user = userEvent.setup();
    renderPanel([buildProduct({ id: 5, slug: 'balde-5', name: 'Balde 12L', categories: [] })]);

    await user.click(screen.getByRole('button', { name: 'Apagar Balde 12L' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(
      await screen.findByText(
        'A API só apaga produto que tem categoria e link de compra. Edite o produto, complete os dois e tente de novo.',
      ),
    ).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Balde 12L', { selector: 'a' })).toBeInTheDocument();
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
      await fillProductForm(user, { name: 'Vassoura', categories: ['Utensílios de Cozinha'], description: 'Macia.' });
      expect(screen.getByText('JPG, PNG ou WebP, até 5 MB cada.')).toBeInTheDocument();
      await user.upload(screen.getByLabelText('Fotos'), [photo('frente.png'), photo('lado.webp', 'image/webp')]);
      expect(screen.getByAltText('Foto 1')).toHaveAttribute('src', expect.stringMatching(/^blob:/));
      expect(screen.getByAltText('Foto 2')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(await screen.findByAltText('Vassoura')).toHaveAttribute('src', expect.stringContaining('upload-101'));
      expect(apiRequests).toEqual([
        'POST /api/produto',
        'POST /api/categoriaproduto',
        'POST /api/imagem?produtoId=100',
        'POST /api/imagem?produtoId=100',
      ]);
      expect(photoIdsOf(100)).toEqual([101, 102]);
      expect(screen.queryByLabelText('Fotos')).not.toBeInTheDocument();
    });

    it('lets a chosen photo be dropped before saving and releases its preview', async () => {
      const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');
      const user = userEvent.setup();
      renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await fillProductForm(user, { name: 'Vassoura', categories: ['Utensílios de Cozinha'], description: 'Macia.' });
      await user.upload(screen.getByLabelText('Fotos'), [photo('frente.png'), photo('lado.png')]);
      const droppedPreview = screen.getByAltText('Foto 1').getAttribute('src');
      await user.click(screen.getByRole('button', { name: 'Remover foto 1' }));

      expect(revokeObjectURL).toHaveBeenCalledWith(droppedPreview);
      expect(screen.queryByAltText('Foto 2')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(await screen.findByAltText('Vassoura')).toBeInTheDocument();
      expect(apiRequests.filter((request) => request === 'POST /api/imagem?produtoId=100')).toHaveLength(1);
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

    it('disables the photo controls while the product is being saved', async () => {
      hang('post', '*/produto');
      const user = userEvent.setup();
      renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await fillProductForm(user, { name: 'Vassoura', categories: ['Utensílios de Cozinha'], description: 'Macia.' });
      await user.upload(screen.getByLabelText('Fotos'), photo('frente.png'));
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeDisabled();
      expect(screen.getByLabelText('Fotos')).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Adicionar fotos' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Remover foto 1' })).toBeDisabled();
    });

    it('releases the chosen previews when the panel goes away', async () => {
      const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');
      const user = userEvent.setup();
      const { unmount } = renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await user.upload(screen.getByLabelText('Fotos'), [photo('frente.png'), photo('lado.png')]);
      unmount();

      expect(revokeObjectURL).toHaveBeenCalledTimes(2);
    });

    it('opens the photo picker from a button in portuguese', async () => {
      const user = userEvent.setup();
      renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      const photoInput = screen.getByLabelText('Fotos');
      const openPicker = vi.spyOn(photoInput, 'click');
      await user.click(screen.getByRole('button', { name: 'Adicionar fotos' }));

      expect(openPicker).toHaveBeenCalledTimes(1);
      expect(photoInput).toHaveAttribute('type', 'file');
    });
  });

  describe('photos of an existing product', () => {
    it('removes the marked photos and uploads the new ones only when the product is saved', async () => {
      const user = userEvent.setup();
      renderPanel();

      await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
      expect(await screen.findByAltText('Foto 1')).toHaveAttribute(
        'src',
        expect.stringContaining('garrafa-frente.webp'),
      );
      expect(screen.getByAltText('Foto 3')).toHaveAttribute('src', expect.stringContaining('garrafa-lado.webp'));
      await user.click(screen.getByRole('button', { name: 'Remover foto 1' }));
      await user.upload(screen.getByLabelText('Fotos'), photo('nova.png'));

      expect(screen.getByRole('button', { name: 'Desfazer remoção da foto 1' })).toBeInTheDocument();
      expect(screen.getByAltText('Foto 4')).toHaveAttribute('src', expect.stringMatching(/^blob:/));
      expect(apiRequests).toHaveLength(4);
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(await screen.findByAltText('Garrafa Térmica 1L')).toHaveAttribute(
        'src',
        expect.stringContaining('garrafa-tampa.jpeg'),
      );
      expect(apiRequests.slice(4)).toEqual([
        'PUT /api/produto/1',
        'DELETE /api/imagem',
        'POST /api/imagem?produtoId=1',
      ]);
      expect(photoIdsOf(1)).toEqual([12, 11, 100]);
    });

    it('keeps a photo whose removal was undone before saving', async () => {
      const user = userEvent.setup();
      renderPanel();

      await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
      await user.click(await screen.findByRole('button', { name: 'Remover foto 2' }));
      await user.click(screen.getByRole('button', { name: 'Desfazer remoção da foto 2' }));
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(await screen.findByAltText('Garrafa Térmica 1L')).toBeInTheDocument();
      expect(apiRequests).not.toContain('DELETE /api/imagem');
      expect(photoIdsOf(1)).toEqual([12, 10, 11]);
    });

    it('discards the marks and the new photos when the edit is cancelled', async () => {
      const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');
      const user = userEvent.setup();
      renderPanel();

      await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
      await user.click(await screen.findByRole('button', { name: 'Remover foto 1' }));
      await user.upload(screen.getByLabelText('Fotos'), photo('nova.png'));
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(revokeObjectURL).toHaveBeenCalledTimes(1);
      await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
      expect(await screen.findByRole('button', { name: 'Remover foto 1' })).toBeInTheDocument();
      expect(screen.queryByAltText('Foto 4')).not.toBeInTheDocument();
      expect(apiRequests.filter((request) => !request.startsWith('GET'))).toEqual([]);
    });

    it('shows the placeholder for a photo the storefront cannot display and still lets it be removed', async () => {
      const user = userEvent.setup();
      renderPanel([buildProduct({ id: 7, slug: 'caixa-7', name: 'Caixa' })]);

      await user.click(screen.getByRole('button', { name: 'Editar Caixa' }));
      expect(await screen.findByAltText('Foto 3')).toHaveAttribute('src', expect.stringContaining('placeholder'));
      await user.click(screen.getByRole('button', { name: 'Remover foto 3' }));
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(await screen.findByAltText('Caixa')).toBeInTheDocument();
      expect(photoIdsOf(7)).toEqual([20, 21]);
    });

    it('warns that the current photos could not be loaded and still accepts new ones', async () => {
      server.use(http.get('*/imagem', () => new HttpResponse(null, { status: 500 })));
      const user = userEvent.setup();
      renderPanel();

      await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));

      expect(
        await screen.findByText(
          'Não foi possível carregar as fotos atuais. Feche e abra de novo para tentar outra vez.',
        ),
      ).toBeInTheDocument();
      expect(screen.queryByAltText('Foto 1')).not.toBeInTheDocument();
      await user.upload(screen.getByLabelText('Fotos'), photo('nova.png'));
      expect(screen.getByAltText('Foto 1')).toHaveAttribute('src', expect.stringMatching(/^blob:/));
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(await screen.findByAltText('Garrafa Térmica 1L')).toHaveAttribute(
        'src',
        expect.stringContaining('upload-100'),
      );
      expect(photoIdsOf(1)).toEqual([12, 10, 11, 100]);
    });
  });

  describe('photo validation and partial failures', () => {
    it('keeps out of the list the files that are not jpg, png or webp or pass 5 MB', async () => {
      const user = userEvent.setup({ applyAccept: false });
      renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await fillProductForm(user, { name: 'Vassoura', categories: ['Utensílios de Cozinha'], description: 'Macia.' });
      await user.upload(screen.getByLabelText('Fotos'), [
        photo('nota.pdf', 'application/pdf'),
        photo('grande.png', 'image/png', 5_242_881),
        photo('frente.jpg', 'image/jpeg'),
        photo('limite.webp', 'image/webp', 5_242_880),
      ]);

      expect(screen.getByText('nota.pdf: use JPG, PNG ou WebP.')).toBeInTheDocument();
      expect(screen.getByText('grande.png: a foto passa de 5 MB.')).toBeInTheDocument();
      expect(screen.getByAltText('Foto 2')).toBeInTheDocument();
      expect(screen.queryByAltText('Foto 3')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(await screen.findByAltText('Vassoura')).toBeInTheDocument();
      expect(photoIdsOf(100)).toEqual([101, 102]);
    });

    it('lists every rejected file even when two share a name', async () => {
      const consoleError = vi.spyOn(console, 'error');
      const user = userEvent.setup({ applyAccept: false });
      renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await user.upload(screen.getByLabelText('Fotos'), [
        photo('nota.pdf', 'application/pdf'),
        photo('nota.pdf', 'application/pdf'),
      ]);

      expect(screen.getAllByText('nota.pdf: use JPG, PNG ou WebP.')).toHaveLength(2);
      expect(consoleError.mock.calls.flat().join(' ')).not.toContain('same key');
    });

    it('does not add the same file twice', async () => {
      const user = userEvent.setup();
      renderPanel([]);
      const frente = photo('frente.png');

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await user.upload(screen.getByLabelText('Fotos'), frente);
      await user.upload(screen.getByLabelText('Fotos'), [frente, photo('lado.png')]);

      expect(screen.getByAltText('Foto 2')).toBeInTheDocument();
      expect(screen.queryByAltText('Foto 3')).not.toBeInTheDocument();
    });

    it('lists the new product with the photos that worked and never creates it twice', async () => {
      server.use(
        http.post('*/imagem', () => new HttpResponse('erro interno do bucket', { status: 500 }), { once: true }),
      );
      const user = userEvent.setup();
      renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await fillProductForm(user, { name: 'Vassoura', categories: ['Utensílios de Cozinha'], description: 'Macia.' });
      await user.upload(screen.getByLabelText('Fotos'), [photo('frente.png'), photo('lado.png')]);
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(
        await screen.findByText('Produto salvo, mas 1 foto(s) não foram atualizadas. Tente de novo pelo Editar.'),
      ).toBeInTheDocument();
      expect(screen.queryByText(/bucket/)).not.toBeInTheDocument();
      expect(screen.getByAltText('Vassoura')).toHaveAttribute('src', expect.stringContaining('upload-101'));
      expect(screen.getByRole('button', { name: 'Salvar produto' })).toBeDisabled();
      expect(screen.getByLabelText('Fotos')).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Remover foto 1' })).toBeDisabled();
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));
      expect(apiRequests.filter((request) => request === 'POST /api/produto')).toHaveLength(1);

      await user.click(screen.getByRole('button', { name: 'Fechar' }));
      expect(screen.queryByLabelText('Fotos')).not.toBeInTheDocument();
    });

    it('keeps a photo whose removal failed and warns about it', async () => {
      respondWith('delete', '*/imagem', 500);
      const user = userEvent.setup();
      renderPanel();

      await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
      await user.click(await screen.findByRole('button', { name: 'Remover foto 1' }));
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(
        await screen.findByText('Produto salvo, mas 1 foto(s) não foram atualizadas. Tente de novo pelo Editar.'),
      ).toBeInTheDocument();
      expect(screen.getByAltText('Garrafa Térmica 1L')).toHaveAttribute(
        'src',
        expect.stringContaining('garrafa-frente.webp'),
      );
      expect(photoIdsOf(1)).toEqual([12, 10, 11]);
    });
  });

  describe('purchase links', () => {
    it('creates the product with a link to buy it at the chosen store', async () => {
      const user = userEvent.setup();
      renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await fillProductForm(user, { name: 'Vassoura', categories: ['Utensílios de Cozinha'], description: 'Macia.' });
      await user.click(screen.getByRole('button', { name: 'Adicionar loja' }));
      await user.selectOptions(screen.getByLabelText('Loja 1'), '2');
      await user.type(screen.getByLabelText('Link da loja 1'), ' https://shopee.com.br/vassoura ');
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(await screen.findByText('Vassoura')).toBeInTheDocument();
      expect(purchaseLinksOf(100)).toEqual([
        { produtoId: 100, canalVendaId: 2, link: 'https://shopee.com.br/vassoura' },
      ]);
      expect(apiRequests).toEqual(['POST /api/produto', 'POST /api/categoriaproduto', 'POST /api/canalvendaproduto']);
    });

    it('shows the saved links when editing and saves only what changed', async () => {
      const user = userEvent.setup();
      renderPanel();

      await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
      expect(await screen.findByLabelText('Loja 1')).toHaveValue('2');
      expect(screen.getByLabelText('Link da loja 1')).toHaveValue('https://shopee.com.br/garrafa-termica');
      expect(screen.getByLabelText('Loja 2')).toHaveValue('3');

      const shopeeLink = screen.getByLabelText('Link da loja 1');
      await user.clear(shopeeLink);
      await user.type(shopeeLink, 'https://shopee.com.br/garrafa-nova');
      await user.click(screen.getByRole('button', { name: 'Remover loja 2' }));
      await user.click(screen.getByRole('button', { name: 'Adicionar loja' }));
      await user.selectOptions(screen.getByLabelText('Loja 2'), '8');
      await user.type(screen.getByLabelText('Link da loja 2'), 'https://magazineluiza.com.br/garrafa');
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      await vi.waitFor(() => expect(screen.queryByLabelText('Loja 1')).not.toBeInTheDocument());
      expect(purchaseLinksOf(1)).toEqual([
        { produtoId: 1, canalVendaId: 2, link: 'https://shopee.com.br/garrafa-nova' },
        { produtoId: 1, canalVendaId: 8, link: 'https://magazineluiza.com.br/garrafa' },
      ]);
      expect(apiRequests).toEqual([
        'GET /api/produto?id=1',
        'GET /api/categoriaproduto?produtoId=1',
        'GET /api/imagem?produtoId=1',
        'GET /api/canalvendaproduto?produtoId=1',
        'PUT /api/produto/1',
        'DELETE /api/canalvendaproduto',
        'PUT /api/canalvendaproduto?produtoId=1&canalVendaId=2',
        'POST /api/canalvendaproduto',
      ]);
    });

    it('updates the store button of the product after saving a new link', async () => {
      const user = userEvent.setup();
      renderPanel();

      await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
      await user.click(await screen.findByRole('button', { name: 'Remover loja 2' }));
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));
      await user.click(await screen.findByRole('button', { name: 'Editar Garrafa Térmica 1L' }));

      expect(await screen.findByLabelText('Loja 1')).toHaveValue('2');
      expect(screen.queryByLabelText('Loja 2')).not.toBeInTheDocument();
    });

    it.each([
      ['without a store', '', 'https://shopee.com.br/x', 'Escolha a loja e cole um link que comece com https://.'],
      [
        'with a link that is not https',
        '2',
        'shopee.com.br/x',
        'Escolha a loja e cole um link que comece com https://.',
      ],
    ])('blocks a row %s before calling the api', async (_case, store, link, message) => {
      const user = userEvent.setup();
      renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await fillProductForm(user, { name: 'Vassoura', categories: ['Utensílios de Cozinha'], description: 'Macia.' });
      await user.click(screen.getByRole('button', { name: 'Adicionar loja' }));
      if (store) await user.selectOptions(screen.getByLabelText('Loja 1'), store);
      await user.type(screen.getByLabelText('Link da loja 1'), link);
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(screen.getByText(message)).toHaveAttribute('role', 'alert');
      expect(apiRequests).toEqual([]);
    });

    it('blocks the same store twice before calling the api', async () => {
      const user = userEvent.setup();
      renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await fillProductForm(user, { name: 'Vassoura', categories: ['Utensílios de Cozinha'], description: 'Macia.' });
      for (const row of [1, 2]) {
        await user.click(screen.getByRole('button', { name: 'Adicionar loja' }));
        await user.selectOptions(screen.getByLabelText(`Loja ${row}`), '2');
        await user.type(screen.getByLabelText(`Link da loja ${row}`), `https://shopee.com.br/${row}`);
      }
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(screen.getByText('Cada loja só pode aparecer uma vez.')).toHaveAttribute('role', 'alert');
      expect(apiRequests).toEqual([]);
    });

    it('keeps the saved product and warns when the links could not be saved', async () => {
      respondWith('post', '*/canalvendaproduto', 403);
      const user = userEvent.setup();
      renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await fillProductForm(user, { name: 'Vassoura', categories: ['Utensílios de Cozinha'], description: 'Macia.' });
      await user.click(screen.getByRole('button', { name: 'Adicionar loja' }));
      await user.selectOptions(screen.getByLabelText('Loja 1'), '2');
      await user.type(screen.getByLabelText('Link da loja 1'), 'https://shopee.com.br/vassoura');
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(await screen.findByText('Vassoura')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Produto salvo, mas os links de compra não foram atualizados. Edite o produto para tentar de novo.',
        ),
      ).toHaveAttribute('role', 'alert');
    });

    it('offers only the stores that become a buy button, keeping a channel already saved on the product', async () => {
      const user = userEvent.setup();
      renderPanel();

      await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
      expect(await screen.findByLabelText('Loja 2')).toHaveValue('3');
      expect(optionsOf(screen.getByLabelText('Loja 2'))).toEqual([
        'Shopee',
        'Instagram',
        'MagaLu',
        'MAGAZINE LUIZA',
        'Mercado Livre',
      ]);
      await user.click(screen.getByRole('button', { name: 'Adicionar loja' }));
      expect(optionsOf(screen.getByLabelText('Loja 3'))).toEqual([
        'Shopee',
        'MagaLu',
        'MAGAZINE LUIZA',
        'Mercado Livre',
      ]);
    });

    it('shows the links the api really kept when changing a link fails halfway', async () => {
      respondWith('put', '*/canalvendaproduto', 500);
      const user = userEvent.setup();
      renderPanel();

      await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
      const shopeeLink = await screen.findByLabelText('Link da loja 1');
      await user.clear(shopeeLink);
      await user.type(shopeeLink, 'https://shopee.com.br/garrafa-nova');
      await user.click(screen.getByRole('button', { name: 'Remover loja 2' }));
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(
        await screen.findByText(
          'Produto salvo, mas os links de compra não foram atualizados. Edite o produto para tentar de novo.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('Shopee')).toBeInTheDocument();
      expect(purchaseLinksOf(1)).toEqual([
        { produtoId: 1, canalVendaId: 2, link: 'https://shopee.com.br/garrafa-termica' },
      ]);
    });

    it('keeps the store links untouched when nothing changed, even without the store list', async () => {
      const user = userEvent.setup();
      renderPanel(
        [buildProduct({ storeLinks: [{ store: 'shopee', url: 'https://shopee.com.br/garrafa-termica' }] })],
        [],
      );

      await user.click(screen.getByRole('button', { name: 'Editar Garrafa Térmica 1L' }));
      expect(
        await screen.findByText('Não foi possível carregar as lojas. Recarregue a página para mexer nos links.'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Adicionar loja' })).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      await vi.waitFor(() => expect(screen.queryByLabelText('Loja 1')).not.toBeInTheDocument());
      expect(screen.getByText('Shopee')).toBeInTheDocument();
      expect(
        apiRequests.filter((request) => request.includes('canalvendaproduto') && !request.startsWith('GET')),
      ).toEqual([]);
    });

    it('tells every failure when both the category and the links fail on create', async () => {
      respondWith('post', '*/categoriaproduto', 500);
      respondWith('post', '*/canalvendaproduto', 500);
      const user = userEvent.setup();
      renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await fillProductForm(user, { name: 'Vassoura', categories: ['Utensílios de Cozinha'], description: 'Macia.' });
      await user.click(screen.getByRole('button', { name: 'Adicionar loja' }));
      await user.selectOptions(screen.getByLabelText('Loja 1'), '2');
      await user.type(screen.getByLabelText('Link da loja 1'), 'https://shopee.com.br/vassoura');
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(await screen.findByText(/Produto salvo, mas nem todas as categorias foram salvas\./)).toHaveTextContent(
        'Produto salvo, mas nem todas as categorias foram salvas. Edite o produto para escolher de novo. Produto salvo, mas os links de compra não foram atualizados. Edite o produto para tentar de novo.',
      );
    });

    it('points the invalid row out to assistive technology', async () => {
      const user = userEvent.setup();
      renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await fillProductForm(user, { name: 'Vassoura', categories: ['Utensílios de Cozinha'], description: 'Macia.' });
      await user.click(screen.getByRole('button', { name: 'Adicionar loja' }));
      await user.selectOptions(screen.getByLabelText('Loja 1'), '2');
      await user.type(screen.getByLabelText('Link da loja 1'), 'https://shopee.com.br/ok');
      await user.click(screen.getByRole('button', { name: 'Adicionar loja' }));
      await user.type(screen.getByLabelText('Link da loja 2'), 'sem-https');
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      const message = screen.getByText('Escolha a loja e cole um link que comece com https://.');
      expect(screen.getByLabelText('Link da loja 2')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('Link da loja 2')).toHaveAttribute('aria-describedby', message.id);
      expect(screen.getByLabelText('Link da loja 1')).not.toHaveAttribute('aria-invalid');
    });

    it('locks the store choice while the product is being saved', async () => {
      hang('post', '*/produto');
      const user = userEvent.setup();
      renderPanel([]);

      await user.click(screen.getByRole('button', { name: 'Novo produto' }));
      await fillProductForm(user, { name: 'Vassoura', categories: ['Utensílios de Cozinha'], description: 'Macia.' });
      await user.click(screen.getByRole('button', { name: 'Adicionar loja' }));
      await user.selectOptions(screen.getByLabelText('Loja 1'), '2');
      await user.type(screen.getByLabelText('Link da loja 1'), 'https://shopee.com.br/vassoura');
      await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

      expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeDisabled();
      expect(screen.getByLabelText('Loja 1')).toBeDisabled();
    });
  });
});
