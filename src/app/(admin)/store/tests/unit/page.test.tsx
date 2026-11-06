import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StorePage from '../../page';

describe('StorePage', () => {
  it('renders the site settings title with the social networks section', async () => {
    render(<StorePage />);

    expect(screen.getByRole('heading', { name: 'Configurações de site' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Redes sociais' })).toBeInTheDocument();
    expect(await screen.findByText('Instagram')).toBeInTheDocument();
  });
});
