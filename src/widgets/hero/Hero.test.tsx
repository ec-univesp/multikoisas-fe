import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/msw/server';
import { Hero } from './Hero';

const renderHero = async () => render(await Hero());

describe('Hero', () => {
  it('explains that the visitor picks here and buys at the partner store', async () => {
    await renderHero();
    expect(screen.getByText('Vitrine digital oficial')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Você escolhe na nossa vitrine e compra onde preferir!' }),
    ).toBeInTheDocument();
  });

  it('walks through the three purchase steps in order, below the single page title', async () => {
    await renderHero();
    const steps = within(screen.getByRole('list', { name: 'Como comprar' })).getAllByRole('heading', { level: 3 });
    expect(steps.map((step) => step.textContent)).toEqual([
      'Escolha o produto',
      'Sua plataforma favorita',
      'Compre com segurança',
    ]);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('names the stores that appear in the catalog links', async () => {
    await renderHero();
    expect(screen.getByText('Conclua a compra na Shopee pelo botão da loja que preferir.')).toBeInTheDocument();
  });

  it('falls back to a store-neutral step when the catalog cannot be read', async () => {
    server.use(http.get('*/produto', () => new HttpResponse(null, { status: 500 })));
    await renderHero();
    expect(screen.getByText('Conclua a compra pelo botão da loja que preferir.')).toBeInTheDocument();
  });

  it('never shows a phone, price or company id', async () => {
    const { container } = await renderHero();
    expect(container.textContent).not.toMatch(/R\$|\(11\)|\d{4}-\d{4}|CNPJ|balcão/i);
  });
});
