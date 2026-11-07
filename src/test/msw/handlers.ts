import { createApiHandlers } from '@/shared/local-api/handlers';
import { createMemoryImageStore } from '@/shared/local-api/imageStore';
import { apiDatabase, SUPABASE_IMAGES } from './apiDatabase';

export const handlers = [
  ...createApiHandlers(apiDatabase, {
    onChange: () => true,
    images: createMemoryImageStore(),
    // Vitest jsdom replaces the file name with "blob" in the multipart body.
    imageUrl: (id) => `${SUPABASE_IMAGES}/upload-${id}`,
    reproduceApiBugs: true,
  }),
];
