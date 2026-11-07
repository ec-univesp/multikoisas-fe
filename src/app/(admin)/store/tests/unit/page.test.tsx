import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StorePage from '../../page';

describe('StorePage', () => {
  it('renders the site settings title with the store logo, store data, showcase appearance and social networks sections, ending with the sample data reset', async () => {
    render(<StorePage />);

    expect(screen.getByRole('heading', { name: 'Configurações de site' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Logo da vitrine' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dados da loja' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Salvar dados' })).toBeEnabled();
    expect(await screen.findByRole('button', { name: 'Salvar aparência' })).toBeEnabled();
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      'Logo da vitrine',
      'Dados da loja',
      'Aparência da vitrine',
      'Redes sociais',
      'Dados de exemplo',
    ]);
    expect(await screen.findByText('Instagram')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dados de exemplo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restaurar dados iniciais' })).toBeInTheDocument();
  });
});
