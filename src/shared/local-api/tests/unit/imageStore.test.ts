import { describe, expect, it } from 'vitest';
import { createMemoryImageStore } from '../../imageStore';

describe('memory image store', () => {
  it('saves, reads and removes a photo', async () => {
    const store = createMemoryImageStore();
    await store.save(30, new Blob(['png-bytes'], { type: 'image/png' }));
    const saved = await store.get(30);
    expect(saved?.type).toBe('image/png');
    expect(await saved?.text()).toBe('png-bytes');

    await store.remove(30);
    expect(await store.get(30)).toBeUndefined();
  });
});
