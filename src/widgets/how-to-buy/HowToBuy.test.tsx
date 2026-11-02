import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/msw/server';
import { HowToBuy } from './HowToBuy';

const renderHowToBuy = async () => render(await HowToBuy());

describe('HowToBuy', () => {
  it('titles the steps below the store title, without a second page title', async () => {
    await renderHowToBuy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Você escolhe na nossa vitrine e compra onde preferir!' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('walks through the three purchase steps in order', async () => {
    await renderHowToBuy();
    const steps = within(screen.getByRole('list', { name: 'Como comprar' })).getAllByRole('heading', { level: 3 });
    expect(steps.map((step) => step.textContent)).toEqual([
      'Escolha o produto',
      'Sua plataforma favorita',
      'Compre com segurança',
    ]);
  });

  it('names the stores that appear in the catalog links', async () => {
    await renderHowToBuy();
    expect(screen.getByText('Conclua a compra na Shopee pelo botão da loja que preferir.')).toBeInTheDocument();
  });

  it('falls back to a store-neutral step when the catalog cannot be read', async () => {
    server.use(http.get('*/produto', () => new HttpResponse(null, { status: 500 })));
    await renderHowToBuy();
    expect(screen.getByText('Conclua a compra pelo botão da loja que preferir.')).toBeInTheDocument();
  });

  it('never shows a phone, price or company id', async () => {
    const { container } = await renderHowToBuy();
    expect(container.textContent).not.toMatch(/R\$|\(11\)|\d{4}-\d{4}|CNPJ|balcão/i);
  });
});
