import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useVitrineSearch, VitrineSearchField, VitrineSearchProvider } from './VitrineSearch';

const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const SearchTermProbe = () => <output>{useVitrineSearch().searchTerm}</output>;

describe('VitrineSearch', () => {
  it('shares what the visitor types with the rest of the page', async () => {
    render(
      <VitrineSearchProvider>
        <VitrineSearchField id="header-search" label="Buscar no cabeçalho" />
        <SearchTermProbe />
      </VitrineSearchProvider>,
    );
    const input = screen.getByRole('searchbox', { name: 'Buscar produto' });
    expect(input).toHaveClass('text-base');
    expect(screen.getByRole('search', { name: 'Buscar no cabeçalho' })).toContainElement(input);
    await userEvent.type(input, 'balde');
    expect(screen.getByRole('status')).toHaveTextContent('balde');
  });

  it('scrolls to the showcase when the search is submitted', async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(
      <VitrineSearchProvider>
        <VitrineSearchField id="header-search" label="Buscar no cabeçalho" />
        <section id="vitrine" />
      </VitrineSearchProvider>,
    );
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar produto' }), 'balde{Enter}');
    expect(scrollIntoView).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('takes the visitor to the showcase with the term when the page has no showcase', async () => {
    render(
      <VitrineSearchProvider>
        <VitrineSearchField id="header-search" label="Buscar no cabeçalho" />
        <SearchTermProbe />
      </VitrineSearchProvider>,
    );
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar produto' }), 'balde{Enter}');
    expect(push).toHaveBeenCalledWith('/#vitrine');
    expect(screen.getByRole('status')).toHaveTextContent('balde');
  });

  it('moves the focus to the showcase heading after a header search', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    render(
      <VitrineSearchProvider>
        <VitrineSearchField id="header-search" label="Buscar no cabeçalho" />
        <section id="vitrine">
          <h2 tabIndex={-1}>Vitrine de produtos</h2>
        </section>
      </VitrineSearchProvider>,
    );
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar produto' }), 'balde{Enter}');
    expect(screen.getByRole('heading', { name: 'Vitrine de produtos' })).toHaveFocus();
  });

  it('keeps the focus in the showcase search when it is submitted', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    render(
      <VitrineSearchProvider>
        <section id="vitrine">
          <h2 tabIndex={-1}>Vitrine de produtos</h2>
          <VitrineSearchField id="vitrine-search" label="Buscar na vitrine" />
        </section>
      </VitrineSearchProvider>,
    );
    const input = screen.getByRole('searchbox', { name: 'Buscar produto' });
    await userEvent.type(input, 'balde{Enter}');
    expect(input).toHaveFocus();
  });

  it('refuses to work outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<SearchTermProbe />)).toThrow('VitrineSearchProvider');
  });
});
