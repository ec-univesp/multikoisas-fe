import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Hero } from './Hero';

describe('Hero', () => {
  it('mostra o slogan da loja', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1, name: /tudo em um só lugar/i })).toBeInTheDocument();
  });
});
