import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AuthLayout from '../../layout';

describe('AuthLayout', () => {
  it('shows the login form and the text brand while the store logo loads', () => {
    render(AuthLayout({ children: <p>login</p> }));
    expect(screen.getByText('login')).toBeInTheDocument();
    expect(screen.getByText('koisas')).toBeInTheDocument();
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
  });
});
