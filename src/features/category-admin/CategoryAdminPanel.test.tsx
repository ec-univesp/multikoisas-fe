import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoryAdminPanel } from './CategoryAdminPanel';
import type { Category } from '@/entities/product';

const categories: Category[] = [
  { id: 2, name: 'Utensílios de Cozinha' },
  { id: 3, name: 'Banheiros' },
];

type ApiCall = { method: string; path: string; body: unknown };

let apiCalls: ApiCall[] = [];
let failingRequest: string | null = null;
let failingStatus = 500;
let hangingRequest: string | null = null;

const respondTo = (method: string, path: string, body: unknown): Response => {
  if (`${method} ${path}`.startsWith(failingRequest ?? '-')) return new Response(null, { status: failingStatus });
  if (method === 'POST' && path === '/api/categoria') {
    return Response.json({ id: 99, ...(body as { nome: string }) }, { status: 201 });
  }
  return new Response(null, { status: 204 });
};

beforeEach(() => {
  apiCalls = [];
  failingRequest = null;
  failingStatus = 500;
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

    await submitNewCategory(user, '  Lavanderia  ');

    expect(await screen.findByText('Lavanderia')).toBeInTheDocument();
    expect(screen.getByText('3 categorias cadastradas')).toBeInTheDocument();
    expect(apiCalls).toEqual([{ method: 'POST', path: '/api/categoria', body: { nome: 'Lavanderia' } }]);
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
    expect(apiCalls).toEqual([{ method: 'PUT', path: '/api/categoria/3', body: { nome: 'Banheiro e Lavabo' } }]);

    await user.click(screen.getByRole('button', { name: 'Editar Banheiro e Lavabo' }));
    expect(screen.getByLabelText('Nome da categoria')).toHaveValue('Banheiro e Lavabo');
  });

  it('requires a name before calling the api', async () => {
    const user = userEvent.setup();
    renderPanel();

    await submitNewCategory(user, '');

    expect(screen.getByText('Informe o nome da categoria.')).toBeInTheDocument();
    expect(apiCalls).toEqual([]);
  });

  it('rejects a name already used by another category, ignoring case', async () => {
    const user = userEvent.setup();
    renderPanel();

    await submitNewCategory(user, ' banheiros ');

    expect(screen.getByText('Já existe uma categoria com esse nome.')).toBeInTheDocument();
    expect(apiCalls).toEqual([]);
  });

  it('lets a category be saved keeping its own name', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Editar Banheiros' }));
    await user.click(screen.getByRole('button', { name: 'Salvar categoria' }));

    expect(screen.queryByLabelText('Nome da categoria')).not.toBeInTheDocument();
    expect(apiCalls).toEqual([{ method: 'PUT', path: '/api/categoria/3', body: { nome: 'Banheiros' } }]);
  });

  it('keeps the form open with a message when the api fails to save', async () => {
    failingRequest = 'POST /api/categoria';
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
    hangingRequest = 'POST /api/categoria';
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
    expect(apiCalls).toEqual([]);
  });

  it('deletes the category in the api after confirmation', async () => {
    const user = userEvent.setup();
    renderPanel([{ id: 3, name: 'Banheiros' }]);

    await user.click(screen.getByRole('button', { name: 'Apagar Banheiros' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText('Nenhuma categoria cadastrada.')).toBeInTheDocument();
    expect(apiCalls).toEqual([{ method: 'DELETE', path: '/api/categoria/3', body: undefined }]);
  });

  it('keeps a category that still has products and explains why', async () => {
    failingRequest = 'DELETE /api/categoria/3';
    failingStatus = 409;
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
    failingRequest = 'DELETE /api/categoria/3';
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
    hangingRequest = 'DELETE /api/categoria/3';
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Apagar Banheiros' }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByRole('button', { name: 'Apagando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });
});
