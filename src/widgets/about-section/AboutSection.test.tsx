import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutSection } from './AboutSection';

describe('AboutSection', () => {
  it('tem id="sobre" e heading "Sobre a loja"', () => {
    const { container } = render(<AboutSection />);
    expect(container.querySelector('section#sobre')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /sobre a loja/i })).toBeInTheDocument();
  });
});
