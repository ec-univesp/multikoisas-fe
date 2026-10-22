import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { CategoryAdminPanel } from './CategoryAdminPanel';
import type { Category } from '@/entities/product';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { recordApiRequests, server } from '@/test/msw/server';

const categories: Category[] = [
  { id: 2, name: 'Utensílios de Cozinha' },
  { id: 3, name: 'Banheiros' },
];

let apiRequests: string[] = [];

beforeEach(() => {
  apiRequests = recordApiRequests();
});

const respondWith = (method: 'post' | 'delete', path: string, status: number) =>
  server.use(http[method](path, () => new HttpResponse(null, { status })));

const hang = (method: 'post' | 'delete', path: string) =>
  server.use(http[method](path, () => delay('infinite')));

const unlinkProductsFrom = (categoriaId: number) => {
  apiDatabase.categoriaProduto = apiDatabase.categoriaProduto.filter((link) => link.categoriaId !== categoriaId);
};

const deleteFromApi = (categoriaId: number) => {
  apiDatabase.categorias = apiDatabase.categorias.filter((categoria) => categoria.id !== categoriaId);
};

const renderPanel = (initialCategories: Category[] = categories) =>
  render(<CategoryAdminPanel initialCategories={initialCategories} />);

const submitNewCategory = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole('button', { name: 'Nova categoria' }));
  if (name) await user.type(screen.getByLabelText('Nome da categoria'), name);
  await user.click(screen.getByRole('button', { name: 'Salvar categoria' }));
};

describe('CategoryAdminPanel', () => {
  it('lists the categories with their count', () => {
    renderPanel();
    expect(screen.getByText('2 categorias cadastradas')).toBeInTheDocument();
    expect(screen.getByText('Utensílios de Cozinha')).toBeInTheDocument();
    expect(screen.getByText('Banheiros')).toBeInTheDocument();
  });

  it('uses the singular count for a single category', () => {
    renderPanel([{ id: 3, name: 'Banheiros' }]);
    expect(screen.getByText('1 categoria cadastrada')).toBeInTheDocument();
  });

  it('shows the empty state without categories', () => {
    renderPanel([]);
    expect(screen.getByText('Nenhuma categoria cadastrada.')).toBeInTheDocument();
  });

  it('creates the category in the api with the trimmed name and lists it', async () => {
    const user = userEvent.setup();
    renderPanel();

    await submitNewCategory(user, '  Casa  e   Banho  ');

    expect(await screen.findByText('Casa e Banho')).toBeInTheDocument();
    expect(screen.getByText('3 categorias cadastradas')).toBeInTheDocument();
    expect(apiDatabase.categorias).toContainEqual({ id: 100, nome: 'Casa e Banho' });
    expect(apiRequests).toEqual(['POST /api/categoria']);
  });

  it('renames the category in the api and shows the saved name when reopened', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Editar Banheiros' }));
    const nameInput = screen.getByLabelText('Nome da categoria');
    await user.clear(nameInput);
    await user.type(nameInput, 'Banheiro e Lavabo');
    await user.click(screen.getByRole('button', { name: 'Salvar categoria' }));

    expect(await screen.findByText('Banheiro e Lavabo')).toBeInTheDocument();
    expect(screen.queryByText('Banheiros')).not.toBeInTheDocument();
    expect(apiDatabase.categorias).toContainEqual({ id: 3, nome: 'Banheiro e Lavabo' });

    await user.click(screen.getByRole('button', { name: 'Editar Banheiro e Lavabo' }));
    expect(screen.getByLabelText('Nome da categoria')).toHaveValue('Banheiro e Lavabo');
  });

  it('requires a name before calling the api', async () => {
    const user = userEvent.setup();
    renderPanel();

    await submitNewCategory(user, '');

    expect(screen.getByText('Informe o nome da categoria.')).toBeInTheDocument();
    expect(apiRequests).toEqual([]);
  });

  it('rejects a name already used by another category, ignoring case', async () => {
    const user = userEvent.setup();
    renderPanel();

    await submitNewCategory(user, ' banheiros ');

    expect(screen.getByText('Já existe uma categoria com esse nome.')).toHaveAttribute('role', 'alert');
    expect(apiRequests).toEqual([]);
  });

  it('rejects a repeated name that differs only in accents or spacing', async () => {
    const user = userEvent.setup();
    renderPanel();

    await submitNewCategory(user, 'Utensilios  de cozinha');

    expect(screen.getByText('Já existe uma categoria com esse nome.')).toBeInTheDocument();
    expect(apiRequests).toEqual([]);
  });

  it('drops a category that no longer exists when renaming it', async () => {
    deleteFromApi(3);
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Editar Banheiros' }));
    await user.type(screen.getByLabelText('Nome da categoria'), ' Sociais');
    await user.click(screen.getByRole('button', { name: 'Salvar categoria' }));

    expect(
      await screen.findByText('Essa categoria já tinha sido apagada. A lista foi atualizada.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Banheiros/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nome da categoria')).not.toBeInTheDocument();
  });

  it('drops a category that was already deleted elsewhere', async () => {
    deleteFromApi(3);
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Banheiros' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText('1 categoria cadastrada')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the deletion dialog open on Escape while the category is being deleted', async () => {
    hang('delete', '*/categoria/:id');
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Banheiros' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));
    await user.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Apagando...' })).toBeInTheDocument();
  });

  it('lets a category be saved keeping its own name', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Editar Banheiros' }));
    await user.click(screen.getByRole('button', { name: 'Salvar categoria' }));

    expect(screen.queryByLabelText('Nome da categoria')).not.toBeInTheDocument();
    expect(apiRequests).toEqual(['PUT /api/categoria/3']);
    expect(apiDatabase.categorias).toContainEqual({ id: 3, nome: 'Banheiros' });
  });

  it('keeps the form open with a message when the api fails to save', async () => {
    respondWith('post', '*/categoria', 500);
    const user = userEvent.setup();
    renderPanel();

    await submitNewCategory(user, 'Lavanderia');

    expect(
      await screen.findByText('Não foi possível salvar a categoria. Tente de novo.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Nome da categoria')).toBeInTheDocument();
    expect(screen.getByText('2 categorias cadastradas')).toBeInTheDocument();
  });

  it('blocks cancel and a second submit while the category is being saved', async () => {
    hang('post', '*/categoria');
    const user = userEvent.setup();
    renderPanel();

    await submitNewCategory(user, 'Lavanderia');

    expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });

  it('keeps the category when the deletion is cancelled', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Banheiros' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByText('Banheiros')).toBeInTheDocument();
    expect(apiRequests).toEqual([]);
  });

  it('deletes the category in the api after confirmation', async () => {
    unlinkProductsFrom(3);
    const user = userEvent.setup();
    renderPanel([{ id: 3, name: 'Banheiros' }]);

    await user.click(screen.getByRole('button', { name: 'Apagar Banheiros' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText('Nenhuma categoria cadastrada.')).toBeInTheDocument();
    expect(apiDatabase.categorias.map((categoria) => categoria.id)).toEqual([2]);
  });

  it('keeps a category that still has products and explains why', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Banheiros' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(
      await screen.findByText(
        'Esta categoria tem produtos. Troque a categoria desses produtos antes de apagar.',
      ),
    ).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Banheiros')).toBeInTheDocument();
  });

  it('keeps the category with a message when the api fails to delete it', async () => {
    respondWith('delete', '*/categoria/:id', 500);
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Banheiros' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(
      await screen.findByText(
        'Não foi possível apagar a categoria. Recarregue a página e tente de novo.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Banheiros')).toBeInTheDocument();
  });

  it('blocks cancel and a second confirmation while the category is being deleted', async () => {
    hang('delete', '*/categoria/:id');
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Banheiros' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByRole('button', { name: 'Apagando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });
});
