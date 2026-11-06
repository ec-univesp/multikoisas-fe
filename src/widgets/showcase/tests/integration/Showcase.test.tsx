import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { ShowcaseSearchProvider } from '@/features/showcase-filter';
import { server } from '@/test/msw/server';
import { waitForLoaded } from '@/test/waitForLoaded';
import { Showcase } from '../../Showcase';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const renderShowcase = async () => {
  const view = render(
    <ShowcaseSearchProvider>
      <Showcase />
    </ShowcaseSearchProvider>,
  );
  await waitForLoaded();
  return view;
};

describe('Showcase', () => {
  it('keeps the heading in place and announces the products while they load', () => {
    window.location.hash = '#showcase';
    render(
      <ShowcaseSearchProvider>
        <Showcase />
      </ShowcaseSearchProvider>,
    );
    const showcaseHeading = screen.getByRole('heading', { level: 1, name: 'Vitrine de produtos' });
    expect(showcaseHeading).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando produtos...');
    expect(showcaseHeading.closest('section')).toHaveAttribute('aria-busy', 'true');
    window.location.hash = '';
  });

  it('titles the page with the focusable showcase heading and lists the api products', async () => {
    const { container } = await renderShowcase();
    const showcaseHeading = screen.getByRole('heading', { level: 1, name: 'Vitrine de produtos' });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('search', { name: 'Buscar produto na vitrine' })).toBeInTheDocument();
    expect(container.querySelector('#showcase')).toBe(showcaseHeading);
    expect(showcaseHeading).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('heading', { name: 'Garrafa Térmica 1L' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Balde 12L' })).toBeInTheDocument();
  });

  it('offers a chip per real product category', async () => {
    await renderShowcase();
    expect(screen.getByRole('button', { name: 'Todas as categorias' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Utensílios de Cozinha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sem categoria' })).toBeInTheDocument();
  });

  it('turns only real store links into buy buttons', async () => {
    await renderShowcase();
    expect(screen.getAllByRole('link', { name: /^Comprar na Shopee: / })).toHaveLength(2);
    expect(screen.queryByRole('link', { name: /instagram/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^Opções de compra: / })).toHaveLength(3);
  });

  it('shows the empty showcase instead of breaking the page when the catalog cannot be read', async () => {
    server.use(http.get('*/produto', () => new HttpResponse(null, { status: 500 })));
    await renderShowcase();
    expect(screen.getByRole('heading', { name: 'Vitrine de produtos' })).toBeInTheDocument();
    expect(screen.getByText('Nenhum produto encontrado.')).toBeInTheDocument();
  });
});
