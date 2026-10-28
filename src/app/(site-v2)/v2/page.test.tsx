import { describe, expect, it } from 'vitest';
import { metadata } from './page';

describe('VitrineV2Page metadata', () => {
  it('keeps the preview out of search engines under its own title', () => {
    expect(metadata.title).toBe('Vitrine v2 | MultiKoisas');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
