import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GoogleReviewsBadge } from '../../GoogleReviewsBadge';

const MAPS_URL = 'https://maps.google.com/?cid=123';

const placeWith = (overrides: Partial<Parameters<typeof GoogleReviewsBadge>[0]['place'] & object> = {}) => ({
  rating: 4.7,
  reviewCount: 387,
  mapsUrl: MAPS_URL,
  ...overrides,
});

describe('GoogleReviewsBadge', () => {
  it('shows the google rating in the google colors with the G logo', () => {
    render(<GoogleReviewsBadge place={placeWith()} />);
    const badge = screen.getByRole('link', { name: 'Nota 4,7 de 5 no Google, 387 avaliações. Abre em outra aba.' });
    expect(badge).toHaveClass('bg-white');
    expect(badge.querySelector('[data-icon="google"]')).toBeInTheDocument();
  });

  it('opens the store on google maps in a new tab', () => {
    render(<GoogleReviewsBadge place={placeWith()} />);
    const badge = screen.getByRole('link');
    expect(badge).toHaveAttribute('href', MAPS_URL);
    expect(badge).toHaveAttribute('target', '_blank');
    expect(badge).toHaveAttribute('rel', 'noopener noreferrer');
    expect(badge).toHaveClass('h-11');
  });

  it('renders nothing when google could not be read', () => {
    const { container } = render(<GoogleReviewsBadge place={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing without an https link to the store on google', () => {
    const { container } = render(<GoogleReviewsBadge place={placeWith({ mapsUrl: 'http://maps.google.com/?cid=1' })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing without a link to the store on google', () => {
    const { container } = render(<GoogleReviewsBadge place={placeWith({ mapsUrl: null })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the rating with a comma and the review count from sm up', () => {
    render(<GoogleReviewsBadge place={placeWith({ rating: 4.8, reviewCount: 1234 })} />);
    expect(screen.getByRole('link')).toHaveTextContent('4,8');
    expect(screen.getByText('· 1.234 avaliações no Google')).toHaveClass('hidden', 'sm:inline');
  });

  it('keeps one decimal place on a whole rating', () => {
    render(<GoogleReviewsBadge place={placeWith({ rating: 5, reviewCount: 3 })} />);
    expect(screen.getByRole('link')).toHaveTextContent('5,0');
  });

  it('uses the singular for a single review', () => {
    render(<GoogleReviewsBadge place={placeWith({ rating: 5, reviewCount: 1 })} />);
    expect(
      screen.getByRole('link', { name: 'Nota 5,0 de 5 no Google, 1 avaliação. Abre em outra aba.' }),
    ).toBeInTheDocument();
  });

  it('shows the rating alone when the review count is missing', () => {
    render(<GoogleReviewsBadge place={placeWith({ rating: 4.5, reviewCount: null })} />);
    expect(screen.getByRole('link', { name: 'Nota 4,5 de 5 no Google. Abre em outra aba.' })).toBeInTheDocument();
    expect(screen.getByText('· Avaliações no Google')).toHaveClass('hidden', 'sm:inline');
  });

  it('names the google reviews when there is no rating', () => {
    render(<GoogleReviewsBadge place={placeWith({ rating: null, reviewCount: 12 })} />);
    const badge = screen.getByRole('link', { name: 'Avaliações no Google. Abre em outra aba.' });
    expect(badge).toHaveTextContent('Avaliações no Google');
    expect(badge).not.toHaveTextContent('12');
  });
});
