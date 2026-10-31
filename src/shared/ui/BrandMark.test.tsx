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
});
