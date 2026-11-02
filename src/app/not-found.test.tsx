import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Error404 from './(full-width-pages)/(error-pages)/error-404/page';
import NotFound from './not-found';

describe.each([
  ['not-found', NotFound],
  ['error-404', Error404],
])('%s page', (_name, Page) => {
  it('sends the visitor back to the showcase page', () => {
    render(<Page />);
    expect(screen.getByRole('link', { name: 'Voltar para a vitrine' })).toHaveAttribute('href', '/vitrine');
  });
});
