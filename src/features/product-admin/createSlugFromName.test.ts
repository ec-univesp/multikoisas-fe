import { describe, expect, it } from 'vitest';
import { createSlugFromName } from './createSlugFromName';

describe('createSlugFromName', () => {
  it('slugifies a plain name', () => {
    expect(createSlugFromName('Balde Multiuso 12L', [])).toBe('balde-multiuso-12l');
  });

  it('strips accents', () => {
    expect(createSlugFromName('Garrafa Térmica 1L', [])).toBe('garrafa-termica-1l');
  });

  it('falls back to a generic slug when the name has no usable characters', () => {
    expect(createSlugFromName('!!!', [])).toBe('produto');
  });

  it('appends a numeric suffix when the base slug already exists', () => {
    expect(createSlugFromName('Balde Multiuso 12L', ['balde-multiuso-12l'])).toBe(
      'balde-multiuso-12l-2',
    );
  });

  it('keeps incrementing the suffix until it finds a free slug', () => {
    expect(
      createSlugFromName('Balde Multiuso 12L', [
        'balde-multiuso-12l',
        'balde-multiuso-12l-2',
        'balde-multiuso-12l-3',
      ]),
    ).toBe('balde-multiuso-12l-4');
  });
});
