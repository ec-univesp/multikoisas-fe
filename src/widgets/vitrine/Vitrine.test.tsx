import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Vitrine } from './Vitrine';

const apiResponses: Record<string, unknown> = {
  '/produto': [
    { id: 1, nome: 'Garrafa Térmica 1L', descricaoProduto: 'Mantém a temperatura.' },
    { id: 2, nome: 'Balde Multiuso 12L', descricaoProduto: 'Resistente.' },
  ],
  '/categoria': [{ id: 7, nome: 'Utensílios de Cozinha' }],
  '/categoriaproduto': [{ produtoId: 1, categoriaId: 7 }],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Vitrine', () => {
  it('renders the section heading, the api products and their categories', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => new Response(JSON.stringify(apiResponses[new URL(url).pathname]))),
    );
    render(await Vitrine());
    expect(screen.getByRole('heading', { name: 'Produtos' })).toBeInTheDocument();
    expect(screen.getByText('Garrafa Térmica 1L')).toBeInTheDocument();
    expect(screen.getByText('Balde Multiuso 12L')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Utensílios de Cozinha' })).toBeInTheDocument();
  });
});
