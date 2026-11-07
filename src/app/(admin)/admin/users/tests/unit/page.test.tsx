import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import UsersPage, { metadata } from '../../page';

describe('UsersPage', () => {
  it('renders the users title and loads the users', async () => {
    render(<UsersPage />);

    expect(metadata.title).toBe('Usuários | MultiKoisas');
    expect(screen.getByRole('heading', { name: 'Usuários' })).toBeInTheDocument();
    expect(await screen.findByText('pi2alunos@gmail.com')).toBeInTheDocument();
  });
});
