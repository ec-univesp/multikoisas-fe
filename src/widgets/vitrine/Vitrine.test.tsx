import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Vitrine } from './Vitrine';

describe('Vitrine', () => {
  it('mostra o título Produtos e produtos reais do catálogo', () => {
    render(<Vitrine />);
    expect(screen.getByRole('heading', { name: 'Produtos' })).toBeInTheDocument();
    expect(screen.getByText('Garrafa Térmica 1L')).toBeInTheDocument();
    expect(screen.getByText('Balde Multiuso 12L')).toBeInTheDocument();
  });
});
