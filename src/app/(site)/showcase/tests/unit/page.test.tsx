import { describe, expect, it } from 'vitest';
import { Showcase } from '@/widgets/showcase';
import ShowcasePage, { metadata } from '../../page';

describe('ShowcasePage', () => {
  it('names the page for search engines and the browser tab', () => {
    expect(metadata.title).toBe('Vitrine de produtos');
    expect(metadata.description).toEqual(expect.stringContaining('produtos'));
  });

  it('shows the full showcase with search and categories', () => {
    expect(ShowcasePage().type).toBe(Showcase);
  });
});
