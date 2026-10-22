import { describe, expect, it } from 'vitest';
import { toBaseSlug } from './toBaseSlug';

describe('toBaseSlug', () => {
  it('slugifies a plain name', () => {
    expect(toBaseSlug('Balde Multiuso 12L')).toBe('balde-multiuso-12l');
  });

  it('strips accents', () => {
    expect(toBaseSlug('Garrafa Térmica 1L')).toBe('garrafa-termica-1l');
  });

  it('falls back to a generic slug when the name has no usable characters', () => {
    expect(toBaseSlug('!!!')).toBe('produto');
  });
});
