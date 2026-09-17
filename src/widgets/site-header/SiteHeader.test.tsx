import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteHeader } from './SiteHeader';

describe('SiteHeader', () => {
  it('links the wordmark to the home page', () => {
    render(<SiteHeader />);
    expect(screen.getByRole('link', { name: /multikoisas/i })).toHaveAttribute('href', '/');
  });

  it('links to the about section', () => {
    render(<SiteHeader />);
    expect(screen.getByRole('link', { name: /sobre/i })).toHaveAttribute('href', '#sobre');
  });
  it('links to the admin panel', () => {
    render(<SiteHeader />);
    expect(screen.getByRole('link', { name: 'Painel' })).toHaveAttribute('href', '/admin');
  });
});
