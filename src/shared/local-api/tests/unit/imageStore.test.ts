import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createMemoryImageStore, imageStore } from '../../imageStore';

describe.each([
  ['IndexedDB', imageStore],
  ['memory', createMemoryImageStore()],
])('%s image store', (_name, store) => {
  it('saves, reads and removes a photo', async () => {
    await store.save(30, new Blob(['png-bytes'], { type: 'image/png' }));
    const saved = await store.get(30);
    expect(saved?.type).toBe('image/png');
    expect(await saved?.text()).toBe('png-bytes');

    await store.remove(30);
    expect(await store.get(30)).toBeUndefined();
  });

  it('forgets every photo on clear', async () => {
    await store.save(31, new Blob(['a']));
    await store.save(32, new Blob(['b']));
    await store.clear();
    expect(await store.get(31)).toBeUndefined();
    expect(await store.get(32)).toBeUndefined();
  });
});
