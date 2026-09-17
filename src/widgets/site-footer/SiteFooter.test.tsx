import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteFooter } from './SiteFooter';

describe('SiteFooter', () => {
  it('mostra o nome da loja e o ano atual', () => {
    render(<SiteFooter />);
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(/multikoisas/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
  });
});
