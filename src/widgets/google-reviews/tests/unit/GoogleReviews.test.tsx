import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { GooglePlace } from '@/entities/google-place';
import { GoogleReviews } from '../../GoogleReviews';

const placeWith = (overrides: Partial<GooglePlace>): GooglePlace => ({
  rating: 4.7,
  reviewCount: 387,
  mapsUrl: 'https://maps.google.com/?cid=123',
  summary: null,
  reviews: [],
  ...overrides,
});

const review = {
  authorName: 'Maria Souza',
  authorUrl: 'https://www.google.com/maps/contrib/1',
  authorPhotoUrl: 'https://lh3.googleusercontent.com/a/maria',
  rating: 5,
  publishedAgo: 'há 2 semanas',
  text: 'Loja muito organizada.',
};

describe('GoogleReviews', () => {
  it('shows the google rating and the review count', () => {
    render(<GoogleReviews place={placeWith({})} />);
    const section = screen.getByRole('region', { name: 'O que dizem no Google' });
    expect(within(section).getByText('4,7')).toBeInTheDocument();
    expect(within(section).getByRole('img', { name: 'Nota 4,7 de 5' })).toBeInTheDocument();
    expect(within(section).getByText('387 avaliações')).toBeInTheDocument();
  });

  it('links to every review on google in a new tab', () => {
    render(<GoogleReviews place={placeWith({})} />);
    const link = screen.getByRole('link', { name: 'Ver todas as avaliações no Google. Abre em outra aba.' });
    expect(link).toHaveAttribute('href', 'https://maps.google.com/?cid=123');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows the review summary with the google attribution and the report link', () => {
    render(
      <GoogleReviews
        place={placeWith({
          summary: {
            text: 'As pessoas elogiam a equipe.',
            disclosure: 'Resumido com o Gemini',
            reportUrl: 'https://google.com/report',
          },
        })}
      />,
    );
    expect(screen.getByText('As pessoas elogiam a equipe.')).toBeInTheDocument();
    expect(screen.getByText('Resumido com o Gemini')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Informar um problema no resumo. Abre em outra aba.' })).toHaveAttribute(
      'href',
      'https://google.com/report',
    );
  });

  it('falls back to a fixed gemini attribution when google sends none', () => {
    render(<GoogleReviews place={placeWith({ summary: { text: 'Resumo.', disclosure: null, reportUrl: null } })} />);
    expect(screen.getByText('Resumo das avaliações feito pelo Google com o Gemini.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Informar um problema/ })).not.toBeInTheDocument();
  });

  it('draws only the whole stars of the rating', () => {
    render(<GoogleReviews place={placeWith({ rating: 4.7 })} />);
    const stars = screen.getByRole('img', { name: 'Nota 4,7 de 5' }).querySelectorAll('svg');
    expect([...stars].map((star) => star.getAttribute('fill'))).toEqual([
      '#FBBC04',
      '#FBBC04',
      '#FBBC04',
      '#FBBC04',
      'none',
    ]);
  });

  it('shows each review with its author, rating, date and text', () => {
    render(<GoogleReviews place={placeWith({ reviews: [review] })} />);
    const card = screen.getByRole('listitem');
    expect(within(card).getByRole('link', { name: 'Maria Souza. Abre em outra aba.' })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/contrib/1',
    );
    expect(within(card).getByRole('img', { name: 'Nota 5 de 5' })).toBeInTheDocument();
    expect(within(card).getByText('há 2 semanas')).toBeInTheDocument();
    expect(within(card).getByText('Loja muito organizada.')).toBeInTheDocument();
  });

  it('shows the author name as text when google has no profile link', () => {
    render(<GoogleReviews place={placeWith({ reviews: [{ ...review, authorUrl: null, authorPhotoUrl: null }] })} />);
    const card = screen.getByRole('listitem');
    expect(within(card).queryByRole('link')).not.toBeInTheDocument();
    expect(within(card).getByText('Maria Souza')).toBeInTheDocument();
  });

  it('uses the singular for a single review', () => {
    render(<GoogleReviews place={placeWith({ reviewCount: 1 })} />);
    expect(screen.getByText('1 avaliação')).toBeInTheDocument();
  });

  it('renders nothing when google could not be read', () => {
    const { container } = render(<GoogleReviews place={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when google sent no rating', () => {
    const { container } = render(<GoogleReviews place={placeWith({ rating: null })} />);
    expect(container).toBeEmptyDOMElement();
  });
});
