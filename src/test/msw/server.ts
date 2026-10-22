import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

export const recordApiRequests = (): string[] => {
  const requests: string[] = [];
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    requests.push(`${request.method} ${url.pathname}${url.search}`);
  });
  return requests;
};
