import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/msw/server';
import { Vitrine } from './Vitrine';

describe('Vitrine', () => {
  it('renders the section heading, the api products and their categories', async () => {
    render(await Vitrine());
    expect(screen.getByRole('heading', { name: 'Produtos' })).toBeInTheDocument();
    expect(screen.getByText('Garrafa Térmica 1L')).toBeInTheDocument();
    expect(screen.getByText('Balde 12L')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Utensílios de Cozinha' })).toBeInTheDocument();
  });

  it('shows the first api photo of each product and the placeholder when it has none', async () => {
    render(await Vitrine());
    expect(screen.getByAltText('Garrafa Térmica 1L')).toHaveAttribute(
      'src',
      expect.stringContaining('garrafa-frente.webp'),
    );
    expect(screen.getByAltText('Balde 12L')).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });

  it('keeps the products on screen with the placeholder when the image list fails', async () => {
    server.use(http.get('*/imagem', () => new HttpResponse(null, { status: 500 })));
    render(await Vitrine());
    expect(screen.getByAltText('Garrafa Térmica 1L')).toHaveAttribute('src', expect.stringContaining('placeholder'));
    expect(screen.getByText('Balde 12L')).toBeInTheDocument();
  });
});
