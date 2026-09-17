import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutSection } from './AboutSection';

describe('AboutSection', () => {
  it('anchors the about section for the header link', () => {
    const { container } = render(<AboutSection />);
    expect(container.querySelector('section#sobre')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /sobre a loja/i })).toBeInTheDocument();
  });
});
