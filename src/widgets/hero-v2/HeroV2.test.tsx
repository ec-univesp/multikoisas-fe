import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HeroV2 } from './HeroV2';

describe('HeroV2', () => {
  it('explains that the visitor picks here and buys at the partner store', () => {
    render(<HeroV2 />);
    expect(screen.getByText('Vitrine digital oficial')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Você escolhe na nossa vitrine e compra onde preferir!' }),
    ).toBeInTheDocument();
  });

  it('walks through the three purchase steps in order', () => {
    render(<HeroV2 />);
    const steps = within(screen.getByRole('list', { name: 'Como comprar' })).getAllByRole('heading', { level: 3 });
    expect(steps.map((step) => step.textContent)).toEqual([
      'Escolha o produto',
      'Sua plataforma favorita',
      'Compre com segurança',
    ]);
  });

  it('never shows a phone, price or company id', () => {
    const { container } = render(<HeroV2 />);
    expect(container.textContent).not.toMatch(/R\$|\(11\)|\d{4}-\d{4}|CNPJ|balcão/i);
  });
});
