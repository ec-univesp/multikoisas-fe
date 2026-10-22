import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Vitrine } from './Vitrine';

describe('Vitrine', () => {
  it('renders the section heading, the api products and their categories', async () => {
    render(await Vitrine());
    expect(screen.getByRole('heading', { name: 'Produtos' })).toBeInTheDocument();
    expect(screen.getByText('Garrafa Térmica 1L')).toBeInTheDocument();
    expect(screen.getByText('Balde 12L')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Utensílios de Cozinha' })).toBeInTheDocument();
  });
});
