import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  images: [`/products/produto-${id}.webp`],
  storeLinks: [],
});

const CARD_WIDTH = 250;
const VISIBLE_WIDTH = 600;

const stubReducedMotion = (prefersReducedMotion: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: prefersReducedMotion && query === '(prefers-reduced-motion: reduce)' })),
  );

const stubStripSizeBeforeMount = (scrollWidth: number) => {
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(CARD_WIDTH);
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(VISIBLE_WIDTH);
  vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(scrollWidth);
};

const renderCarousel = ({ scrollWidth = 1300 } = {}) => {
  stubStripSizeBeforeMount(scrollWidth);
  render(<ProductCarousel products={[1, 2, 3, 4, 5].map(buildProduct)} />);
  const list = within(screen.getByRole('region', { name: 'Produtos em destaque' })).getByRole('list');
  const scrollBy = vi.fn();
  list.scrollBy = scrollBy;
  const scrollTo = (scrollLeft: number) => {
    Object.defineProperty(list, 'scrollLeft', { value: scrollLeft, configurable: true });
    fireEvent.scroll(list);
  };
  return { list, scrollBy, scrollTo };
};

const previousButton = () => screen.getByRole('button', { name: 'Ver produtos anteriores' });
const nextButton = () => screen.getByRole('button', { name: 'Ver próximos produtos' });
const expectUnavailable = (button: HTMLElement) => expect(button).toHaveAttribute('aria-disabled', 'true');
const expectAvailable = (button: HTMLElement) => expect(button).toHaveAttribute('aria-disabled', 'false');

describe('ProductCarousel', () => {
  beforeEach(() => stubReducedMotion(false));
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows every product card in a horizontal scroll strip that snaps to each card', () => {
    const { list } = renderCarousel();
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    expect(list).toHaveClass('overflow-x-auto', 'snap-x', 'no-scrollbar');
    expect(within(list).getByRole('heading', { name: 'Produto 1' })).toBeInTheDocument();
  });

  it('marks both buttons unavailable when every card fits on mount', () => {
    renderCarousel({ scrollWidth: VISIBLE_WIDTH });
    expectUnavailable(previousButton());
    expectUnavailable(nextButton());
  });

  it('offers the next button on mount when the cards overflow, before any scroll', () => {
    renderCarousel();
    expectUnavailable(previousButton());
    expectAvailable(nextButton());
  });

  it('scrolls one card at a time and marks the button unavailable at each edge', async () => {
    const { scrollBy, scrollTo } = renderCarousel();
    scrollTo(0);
    expectUnavailable(previousButton());
    expectAvailable(nextButton());

    await userEvent.click(nextButton());
    expect(scrollBy).toHaveBeenLastCalledWith({ left: CARD_WIDTH, behavior: 'smooth' });

    scrollTo(700);
    expectAvailable(previousButton());
    expectUnavailable(nextButton());

    await userEvent.click(previousButton());
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -CARD_WIDTH, behavior: 'smooth' });
  });

  it('keeps keyboard focus on the next button once it reaches the end, without scrolling further', async () => {
    const { scrollBy, scrollTo } = renderCarousel();
    nextButton().focus();
    await userEvent.keyboard('{Enter}');
    expect(scrollBy).toHaveBeenCalledTimes(1);

    scrollTo(700);
    expect(nextButton()).toHaveFocus();
    expectUnavailable(nextButton());

    await userEvent.keyboard('{Enter}');
    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(nextButton()).toHaveFocus();
  });

  it('keeps the previous button reachable by tab at the start, without scrolling back', async () => {
    const { scrollBy } = renderCarousel();
    await userEvent.tab();
    expect(previousButton()).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('jumps without animation when the visitor prefers reduced motion', async () => {
    stubReducedMotion(true);
    const { scrollBy } = renderCarousel();
    await userEvent.click(nextButton());
    expect(scrollBy).toHaveBeenLastCalledWith({ left: CARD_WIDTH, behavior: 'auto' });
  });

  it('updates the buttons when the visitor drags the strip to the middle', () => {
    const { scrollTo } = renderCarousel();
    scrollTo(300);
    expectAvailable(previousButton());
    expectAvailable(nextButton());
  });

  it('rechecks the edges when the window is resized', () => {
    const { list } = renderCarousel({ scrollWidth: VISIBLE_WIDTH });
    expectUnavailable(nextButton());
    vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(1300);
    Object.defineProperty(list, 'scrollLeft', { value: 0, configurable: true });
    fireEvent(window, new Event('resize'));
    expectAvailable(nextButton());
  });

  it('gives the buttons a 44px touch target', () => {
    renderCarousel();
    expect(nextButton()).toHaveClass('size-11');
    expect(previousButton()).toHaveClass('size-11');
  });

  it('passes the carousel card widths as image sizes', () => {
    const { list } = renderCarousel();
    expect(within(list).getByAltText('Produto 1')).toHaveAttribute(
      'sizes',
      '(max-width: 640px) 80vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
    );
  });
});
