import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StorePage from '../../page';

describe('StorePage', () => {
  it('renders the site settings title with the store logo, store data and social networks sections, ending with the sample data reset', async () => {
    render(<StorePage />);

    expect(screen.getByRole('heading', { name: 'Configurações de site' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Logo da vitrine' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dados da loja' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Salvar dados' })).toBeEnabled();
    expect(screen.getByRole('heading', { name: 'Redes sociais' })).toBeInTheDocument();
    expect(await screen.findByText('Instagram')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dados de exemplo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restaurar dados iniciais' })).toBeInTheDocument();
  });
});
