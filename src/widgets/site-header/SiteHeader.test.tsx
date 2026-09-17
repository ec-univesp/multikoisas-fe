import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteHeader } from './SiteHeader';

describe('SiteHeader', () => {
  it('tem link "multikoisas" para a home', () => {
    render(<SiteHeader />);
    expect(screen.getByRole('link', { name: /multikoisas/i })).toHaveAttribute('href', '/');
  });

  it('tem link "Sobre" para a âncora #sobre', () => {
    render(<SiteHeader />);
    expect(screen.getByRole('link', { name: /sobre/i })).toHaveAttribute('href', '#sobre');
  });
});
