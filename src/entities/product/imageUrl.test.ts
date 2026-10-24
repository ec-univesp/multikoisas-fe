import { describe, expect, it } from 'vitest';
import { toDisplayableImageUrl } from './imageUrl';

describe('toDisplayableImageUrl', () => {
  it('keeps a public supabase url from either host', () => {
    const urls = [
      'https://avphmmvnlrbidhjrzozx.supabase.co/storage/v1/object/public/imagem/a.webp',
      'https://avphmmvnlrbidhjrzozx.storage.supabase.co/storage/v1/object/public/imagem/b.jpeg',
    ];
    expect(urls.map(toDisplayableImageUrl)).toEqual(urls);
  });

  it('puts back the /object/ segment the api leaves out', () => {
    expect(
      toDisplayableImageUrl('https://avphmmvnlrbidhjrzozx.storage.supabase.co/storage/v1/public/imagem/b619ff2d.jpeg'),
    ).toBe('https://avphmmvnlrbidhjrzozx.storage.supabase.co/storage/v1/object/public/imagem/b619ff2d.jpeg');
  });

  it('drops urls next/image is not allowed to load', () => {
    const rejected = [
      'https://example.com/storage/v1/object/public/imagem/a.webp',
      'http://avphmmvnlrbidhjrzozx.supabase.co/storage/v1/object/public/imagem/a.webp',
      'https://avphmmvnlrbidhjrzozx.supabase.co/storage/v1/object/sign/imagem/a.webp',
      'not a url',
    ];
    expect(rejected.map(toDisplayableImageUrl)).toEqual([null, null, null, null]);
  });
});
