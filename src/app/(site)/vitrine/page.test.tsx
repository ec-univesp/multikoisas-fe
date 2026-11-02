import { describe, expect, it } from 'vitest';
import { Vitrine } from '@/widgets/vitrine';
import VitrinePage, { metadata } from './page';

describe('VitrinePage', () => {
  it('names the page for search engines and the browser tab', () => {
    expect(metadata.title).toBe('Vitrine de produtos');
    expect(metadata.description).toEqual(expect.stringContaining('produtos'));
  });

  it('shows the full showcase with search and categories', () => {
    expect(VitrinePage().type).toBe(Vitrine);
  });
});
