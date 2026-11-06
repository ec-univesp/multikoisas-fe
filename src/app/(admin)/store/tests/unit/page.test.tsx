import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StorePage from '../../page';

describe('StorePage', () => {
  it('renders the site settings title with the store logo, store data and social networks sections', async () => {
    render(<StorePage />);

    expect(screen.getByRole('heading', { name: 'Configurações de site' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Logo da vitrine' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dados da loja' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar dados' })).toBeDisabled();
    expect(screen.getByRole('heading', { name: 'Redes sociais' })).toBeInTheDocument();
    expect(await screen.findByText('Instagram')).toBeInTheDocument();
  });
});
