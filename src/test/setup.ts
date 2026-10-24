import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { resetApiDatabase } from './msw/apiDatabase';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  server.events.removeAllListeners();
  resetApiDatabase();
});
afterAll(() => server.close());
