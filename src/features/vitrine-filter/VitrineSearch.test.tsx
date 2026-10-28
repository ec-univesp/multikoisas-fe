import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useVitrineSearch, VitrineSearchField, VitrineSearchProvider } from './VitrineSearch';

const SearchTermProbe = () => <output>{useVitrineSearch().searchTerm}</output>;

describe('VitrineSearch', () => {
  it('shares what the visitor types with the rest of the page', async () => {
    render(
      <VitrineSearchProvider>
        <VitrineSearchField id="header-search" />
        <SearchTermProbe />
      </VitrineSearchProvider>,
    );
    const input = screen.getByRole('searchbox', { name: 'Buscar produto' });
    expect(input).toHaveClass('text-base');
    await userEvent.type(input, 'balde');
    expect(screen.getByRole('status')).toHaveTextContent('balde');
  });

  it('scrolls to the showcase when the search is submitted', async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(
      <VitrineSearchProvider>
        <VitrineSearchField id="header-search" />
        <section id="vitrine" />
      </VitrineSearchProvider>,
    );
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar produto' }), 'balde{Enter}');
    expect(scrollIntoView).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('refuses to work outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<SearchTermProbe />)).toThrow('VitrineSearchProvider');
  });
});
