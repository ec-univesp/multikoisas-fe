import { http, HttpResponse } from 'msw';
import { createApiHandlers } from '@/shared/local-api/handlers';
import { createMemoryImageStore } from '@/shared/local-api/imageStore';
import { apiDatabase, SUPABASE_IMAGES } from './apiDatabase';

export const TEST_API_CREDENTIALS = { username: 'api-admin', password: 'api-secret', token: 'jwt-de-teste' };

const loginHandler = http.post<never, { username?: string; password?: string }>('*/auth/login', async ({ request }) => {
  const { username, password } = await request.json();
  if (username !== TEST_API_CREDENTIALS.username || password !== TEST_API_CREDENTIALS.password) {
    return HttpResponse.json(
      { timestamp: new Date().toISOString(), status: 403, error: 'Forbidden', path: new URL(request.url).pathname },
      { status: 403 },
    );
  }
  return HttpResponse.json({ token: TEST_API_CREDENTIALS.token });
});

export const handlers = [
  loginHandler,
  ...createApiHandlers(apiDatabase, {
    onChange: () => {},
    images: createMemoryImageStore(),
    // Vitest jsdom replaces the file name with "blob" in the multipart body.
    imageUrl: (id) => `${SUPABASE_IMAGES}/upload-${id}`,
    reproduceApiBugs: true,
  }),
];
