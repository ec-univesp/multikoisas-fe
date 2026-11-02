import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { VitrineHeading, VitrineLink } from './VitrineAnchor';

afterEach(() => window.history.replaceState(null, '', '/'));

describe('VitrineHeading', () => {
  it('is the visible page title and takes the focus when the visitor arrives from a header search', () => {
    window.history.replaceState(null, '', '/vitrine#vitrine');
    render(<VitrineHeading />);
    const heading = screen.getByRole('heading', { level: 1, name: 'Vitrine de produtos' });
    expect(heading).toHaveAttribute('id', 'vitrine');
    expect(heading).not.toHaveClass('sr-only');
    expect(heading).toHaveFocus();
  });

  it('leaves the focus alone on a plain visit to the showcase page', () => {
    window.history.replaceState(null, '', '/vitrine');
    render(<VitrineHeading />);
    expect(screen.getByRole('heading', { name: 'Vitrine de produtos' })).not.toHaveFocus();
  });
});

describe('VitrineLink', () => {
  it('points to the showcase and moves the focus to its heading when it is on the page', async () => {
    render(
      <>
        <VitrineLink className="nav-link" />
        <VitrineHeading />
      </>,
    );
    const link = screen.getByRole('link', { name: 'Vitrine de produtos' });
    expect(link).toHaveAttribute('href', '/vitrine');
    expect(link).toHaveClass('nav-link');
    await userEvent.click(link);
    expect(screen.getByRole('heading', { name: 'Vitrine de produtos' })).toHaveFocus();
  });

  it('just navigates when the showcase is on another page', async () => {
    render(<VitrineLink className="nav-link" />);
    const link = screen.getByRole('link', { name: 'Vitrine de produtos' });
    await userEvent.click(link);
    expect(link).toHaveFocus();
  });
});
