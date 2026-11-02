import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Product } from '@/entities/product';
import { ProductCarousel } from './ProductCarousel';

const buildProduct = (id: number): Product => ({
  id,
  slug: `produto-${id}`,
  name: `Produto ${id}`,
  category: 'Banheiros',
  categoryId: 3,
  shortDescription: '',
  longDescription: '',
  images: [],
  storeLinks: [],
});

const CARD_WIDTH = 250;

const renderCarousel = () => {
  render(<ProductCarousel products={[1, 2, 3, 4, 5].map(buildProduct)} />);
  const list = within(screen.getByRole('region', { name: 'Produtos em destaque' })).getByRole('list');
  const scrollBy = vi.fn();
  list.scrollBy = scrollBy;
  Object.defineProperty(list.querySelector('li'), 'offsetWidth', { value: CARD_WIDTH });
  Object.defineProperty(list, 'clientWidth', { value: 600 });
  Object.defineProperty(list, 'scrollWidth', { value: 1300 });
  const scrollTo = (scrollLeft: number) => {
    Object.defineProperty(list, 'scrollLeft', { value: scrollLeft, configurable: true });
    fireEvent.scroll(list);
  };
  return { list, scrollBy, scrollTo };
};

const previousButton = () => screen.getByRole('button', { name: 'Ver produtos anteriores' });
const nextButton = () => screen.getByRole('button', { name: 'Ver próximos produtos' });

describe('ProductCarousel', () => {
  it('shows every product card in a horizontal scroll strip that snaps to each card', () => {
    const { list } = renderCarousel();
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    expect(list).toHaveClass('overflow-x-auto', 'snap-x');
    expect(within(list).getByRole('heading', { name: 'Produto 1' })).toBeInTheDocument();
  });

  it('disables both buttons while every card fits on the screen', () => {
    renderCarousel();
    expect(previousButton()).toBeDisabled();
    expect(nextButton()).toBeDisabled();
  });

  it('scrolls one card at a time and disables the button at each edge', async () => {
    const { scrollBy, scrollTo } = renderCarousel();
    scrollTo(0);
    expect(previousButton()).toBeDisabled();
    expect(nextButton()).toBeEnabled();

    await userEvent.click(nextButton());
    expect(scrollBy).toHaveBeenLastCalledWith({ left: CARD_WIDTH, behavior: 'smooth' });

    scrollTo(700);
    expect(previousButton()).toBeEnabled();
    expect(nextButton()).toBeDisabled();

    await userEvent.click(previousButton());
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -CARD_WIDTH, behavior: 'smooth' });
  });

  it('updates the buttons when the visitor drags the strip to the middle', () => {
    const { scrollTo } = renderCarousel();
    scrollTo(300);
    expect(previousButton()).toBeEnabled();
    expect(nextButton()).toBeEnabled();
  });

  it('rechecks the edges when the window is resized', () => {
    const { list } = renderCarousel();
    Object.defineProperty(list, 'scrollLeft', { value: 0, configurable: true });
    fireEvent(window, new Event('resize'));
    expect(nextButton()).toBeEnabled();
  });

  it('gives the buttons a 44px touch target', () => {
    renderCarousel();
    expect(nextButton()).toHaveClass('size-11');
    expect(previousButton()).toHaveClass('size-11');
  });
});
