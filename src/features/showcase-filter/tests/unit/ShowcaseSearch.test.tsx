import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useShowcaseSearch, ShowcaseSearchField, ShowcaseSearchProvider } from '../../ShowcaseSearch';

const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const SearchTermProbe = () => <output>{useShowcaseSearch().searchTerm}</output>;

const HEADER_LABEL = 'Buscar produto no cabeçalho';
const SHOWCASE_LABEL = 'Buscar produto na vitrine';

const Showcase = ({ children }: { children?: React.ReactNode }) => (
  <section>
    <h2 id="showcase" tabIndex={-1}>
      Vitrine de produtos
    </h2>
    {children}
  </section>
);

describe('ShowcaseSearch', () => {
  it('shares what the visitor types with the rest of the page', async () => {
    render(
      <ShowcaseSearchProvider>
        <ShowcaseSearchField id="header-search" label={HEADER_LABEL} />
        <SearchTermProbe />
      </ShowcaseSearchProvider>,
    );
    const input = screen.getByRole('searchbox', { name: HEADER_LABEL });
    expect(input).toHaveClass('text-base');
    expect(screen.getByRole('search', { name: HEADER_LABEL })).toContainElement(input);
    await userEvent.type(input, 'balde');
    expect(screen.getByRole('status')).toHaveTextContent('balde');
  });

  it('scrolls to the showcase when the search is submitted', async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(
      <ShowcaseSearchProvider>
        <ShowcaseSearchField id="header-search" label={HEADER_LABEL} />
        <Showcase />
      </ShowcaseSearchProvider>,
    );
    await userEvent.type(screen.getByRole('searchbox', { name: HEADER_LABEL }), 'balde{Enter}');
    expect(scrollIntoView).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('takes the visitor to the showcase page with the term when the page has no showcase', async () => {
    render(
      <ShowcaseSearchProvider>
        <ShowcaseSearchField id="header-search" label={HEADER_LABEL} />
        <SearchTermProbe />
      </ShowcaseSearchProvider>,
    );
    await userEvent.type(screen.getByRole('searchbox', { name: HEADER_LABEL }), 'balde{Enter}');
    expect(push).toHaveBeenCalledWith('/showcase#showcase');
    expect(screen.getByRole('status')).toHaveTextContent('balde');
  });

  it('moves the focus to the showcase heading after a header search', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    render(
      <ShowcaseSearchProvider>
        <ShowcaseSearchField id="header-search" label={HEADER_LABEL} />
        <Showcase />
      </ShowcaseSearchProvider>,
    );
    await userEvent.type(screen.getByRole('searchbox', { name: HEADER_LABEL }), 'balde{Enter}');
    expect(screen.getByRole('heading', { name: 'Vitrine de produtos' })).toHaveFocus();
  });

  it('keeps the focus in the showcase search when it is submitted', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    render(
      <ShowcaseSearchProvider>
        <Showcase>
          <ShowcaseSearchField id="showcase-search" label={SHOWCASE_LABEL} />
        </Showcase>
      </ShowcaseSearchProvider>,
    );
    const input = screen.getByRole('searchbox', { name: SHOWCASE_LABEL });
    await userEvent.type(input, 'balde{Enter}');
    expect(input).toHaveFocus();
  });

  it('refuses to work outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<SearchTermProbe />)).toThrow('ShowcaseSearchProvider');
  });
});
