import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { StoreSettings } from '@/entities/store-settings';
import { GoogleReviewsBadge } from '../../GoogleReviewsBadge';

const REVIEWS_URL = 'https://g.page/r/multikoisas/review';

const settingsWith = (overrides: Partial<StoreSettings>): StoreSettings => ({
  address: null,
  googleReviewsUrl: REVIEWS_URL,
  googleRating: null,
  googleReviewCount: null,
  ...overrides,
});

describe('GoogleReviewsBadge', () => {
  it('floats on the right with the store settings by default', () => {
    render(<GoogleReviewsBadge />);
    expect(
      screen.getByRole('link', { name: 'Nota 4,7 de 5 no Google, 387 avaliações. Abre em outra aba.' }),
    ).toHaveClass('fixed');
  });

  it('renders nothing without a reviews link', () => {
    const { container } = render(<GoogleReviewsBadge settings={settingsWith({ googleReviewsUrl: null })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the reviews link is not https', () => {
    const { container } = render(
      <GoogleReviewsBadge settings={settingsWith({ googleReviewsUrl: 'http://g.page/r/multikoisas/review' })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('opens the google reviews page in a new tab', () => {
    render(<GoogleReviewsBadge settings={settingsWith({})} />);
    const badge = screen.getByRole('link');
    expect(badge).toHaveAttribute('href', REVIEWS_URL);
    expect(badge).toHaveAttribute('target', '_blank');
    expect(badge).toHaveAttribute('rel', 'noopener noreferrer');
    expect(badge).toHaveClass('fixed', 'right-4', 'bottom-20', 'h-11');
  });

  it('shows the rating with a comma and the review count from sm up', () => {
    render(<GoogleReviewsBadge settings={settingsWith({ googleRating: 4.8, googleReviewCount: 1234 })} />);
    const badge = screen.getByRole('link', {
      name: 'Nota 4,8 de 5 no Google, 1.234 avaliações. Abre em outra aba.',
    });
    expect(badge).toHaveTextContent('4,8');
    expect(screen.getByText('· 1.234 avaliações no Google')).toHaveClass('hidden', 'sm:inline');
  });

  it('keeps one decimal place on a whole rating', () => {
    render(<GoogleReviewsBadge settings={settingsWith({ googleRating: 5, googleReviewCount: 3 })} />);
    expect(screen.getByRole('link')).toHaveTextContent('5,0');
  });

  it('uses the singular for a single review', () => {
    render(<GoogleReviewsBadge settings={settingsWith({ googleRating: 5, googleReviewCount: 1 })} />);
    expect(
      screen.getByRole('link', { name: 'Nota 5,0 de 5 no Google, 1 avaliação. Abre em outra aba.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('· 1 avaliação no Google')).toBeInTheDocument();
  });

  it('shows the rating alone when the review count is missing', () => {
    render(<GoogleReviewsBadge settings={settingsWith({ googleRating: 4.5 })} />);
    expect(screen.getByRole('link', { name: 'Nota 4,5 de 5 no Google. Abre em outra aba.' })).toBeInTheDocument();
    expect(screen.getByText('· Avaliações no Google')).toHaveClass('hidden', 'sm:inline');
  });

  it('names the google reviews when there is no rating', () => {
    render(<GoogleReviewsBadge settings={settingsWith({ googleReviewCount: 12 })} />);
    const badge = screen.getByRole('link', { name: 'Avaliações no Google. Abre em outra aba.' });
    expect(badge).toHaveTextContent('Avaliações no Google');
    expect(badge).not.toHaveTextContent('12');
  });
});
