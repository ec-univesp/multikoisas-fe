import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandMark } from './BrandMark';

describe('BrandMark', () => {
  it('shows the M square and the MultiKoisas wordmark', () => {
    const { container } = render(<BrandMark />);
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('Koisas')).toBeInTheDocument();
    expect(container).toHaveTextContent('MMultiKoisas');
  });

  it('shows only the M square when compact, keeping the store name for screen readers', () => {
    render(<BrandMark compact />);
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.queryByText('Koisas')).not.toBeInTheDocument();
    expect(screen.getByText('MultiKoisas')).toHaveClass('sr-only');
  });

  it('keeps the wordmark readable on a dark background with the tone for it', () => {
    render(<BrandMark tone="onDark" />);
    expect(screen.getByText('M')).toHaveClass('bg-store-yellow');
    expect(screen.getByText('Multi')).toHaveClass('text-white');
    expect(screen.getByText('Koisas')).toHaveClass('text-store-yellow');
    expect(screen.getByText('Koisas')).not.toHaveClass('bg-store-navy');
  });

  it('draws the wordmark in navy on a light background by default', () => {
    render(<BrandMark />);
    expect(screen.getByText('Multi')).toHaveClass('text-store-navy');
    expect(screen.getByText('Koisas')).toHaveClass('bg-store-navy', 'text-store-yellow');
  });
});
