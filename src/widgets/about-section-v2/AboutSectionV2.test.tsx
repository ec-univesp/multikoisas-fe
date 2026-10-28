import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/msw/server';
import { AboutSectionV2 } from './AboutSectionV2';

describe('AboutSectionV2', () => {
  it('anchors the about section for the header link', async () => {
    const { container } = render(await AboutSectionV2());
    expect(container.querySelector('section#sobre')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Sobre a MultiKoisas e nossas lojas parceiras' }),
    ).toBeInTheDocument();
  });

  it('links the real store social networks in a new tab', async () => {
    render(await AboutSectionV2());
    const instagram = screen.getByRole('link', { name: 'Instagram' });
    expect(instagram).toHaveAttribute('href', 'https://www.instagram.com/multikoisas');
    expect(instagram).toHaveAttribute('target', '_blank');
    expect(instagram).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'Shopee' })).toHaveAttribute('href', 'https://shopee.com.br/multikoisas');
  });

  it('keeps the text without links when the social networks cannot be read', async () => {
    server.use(http.get('*/socialnetwork', () => new HttpResponse(null, { status: 500 })));
    render(await AboutSectionV2());
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Como funciona a compra' })).toBeInTheDocument();
  });

  it('describes how the purchase works without inventing guarantees or contacts', async () => {
    const { container } = render(await AboutSectionV2());
    const purchaseSteps = screen.getByRole('list', { name: 'Como funciona a compra' });
    expect(within(purchaseSteps).getAllByRole('listitem')).toHaveLength(3);
    expect(container.textContent).not.toMatch(/R\$|\(11\)|\d{4}-\d{4}|CNPJ|NF-e|balcão|logística/i);
  });
});
