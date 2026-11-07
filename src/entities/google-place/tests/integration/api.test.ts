import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { fetchGooglePlace, MULTIKOISAS_PLACE_ID } from '../../api';

const PLACE_URL = `https://places.googleapis.com/v1/places/${MULTIKOISAS_PLACE_ID}`;

const googleResponse = {
  rating: 4.7,
  userRatingCount: 387,
  googleMapsUri: 'https://maps.google.com/?cid=123',
  reviewSummary: {
    text: { text: 'As pessoas elogiam a equipe atenciosa.', languageCode: 'pt-BR' },
    flagContentUri: 'https://www.google.com/local/content/rap/report?postId=1',
  },
  reviews: [
    {
      rating: 5,
      relativePublishTimeDescription: 'há 2 semanas',
      text: { text: 'Loja muito organizada.', languageCode: 'pt-BR' },
      authorAttribution: {
        displayName: 'Maria Souza',
        uri: 'https://www.google.com/maps/contrib/1',
        photoUri: 'https://lh3.googleusercontent.com/a/maria',
      },
      googleMapsUri: 'https://www.google.com/maps/reviews/1',
    },
    { rating: 4, relativePublishTimeDescription: 'há 1 mês', authorAttribution: { displayName: 'João' } },
  ],
};

describe('fetchGooglePlace', () => {
  beforeEach(() => vi.stubEnv('GOOGLE_PLACES_API_KEY', 'test-key'));
  afterEach(() => vi.unstubAllEnvs());

  it('asks google for the store rating and reviews in portuguese with the server key', async () => {
    let request: Request | undefined;
    server.use(
      http.get(PLACE_URL, ({ request: googleRequest }) => {
        request = googleRequest;
        return HttpResponse.json(googleResponse);
      }),
    );
    await fetchGooglePlace();
    expect(request?.headers.get('X-Goog-Api-Key')).toBe('test-key');
    expect(request?.headers.get('X-Goog-FieldMask')).toBe('rating,userRatingCount,googleMapsUri,reviews,reviewSummary');
    expect(new URL(request?.url ?? '').searchParams.get('languageCode')).toBe('pt-BR');
  });

  it('returns the rating, the summary and the reviews', async () => {
    server.use(http.get(PLACE_URL, () => HttpResponse.json(googleResponse)));
    expect(await fetchGooglePlace()).toEqual({
      rating: 4.7,
      reviewCount: 387,
      mapsUrl: 'https://maps.google.com/?cid=123',
      summary: {
        text: 'As pessoas elogiam a equipe atenciosa.',
        reportUrl: 'https://www.google.com/local/content/rap/report?postId=1',
      },
      reviews: [
        {
          authorName: 'Maria Souza',
          authorUrl: 'https://www.google.com/maps/contrib/1',
          authorPhotoUrl: 'https://lh3.googleusercontent.com/a/maria',
          rating: 5,
          publishedAgo: 'há 2 semanas',
          text: 'Loja muito organizada.',
        },
        { authorName: 'João', authorUrl: null, authorPhotoUrl: null, rating: 4, publishedAgo: 'há 1 mês', text: '' },
      ],
    });
  });

  it('returns empty fields when google omits them, as with a demo key', async () => {
    server.use(http.get(PLACE_URL, () => HttpResponse.json({})));
    expect(await fetchGooglePlace()).toEqual({
      rating: null,
      reviewCount: null,
      mapsUrl: null,
      summary: null,
      reviews: [],
    });
  });

  it('returns null without calling google when there is no key', async () => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY', '');
    expect(await fetchGooglePlace()).toBeNull();
  });

  it('returns null when google refuses the request', async () => {
    server.use(http.get(PLACE_URL, () => HttpResponse.json({ error: { code: 403 } }, { status: 403 })));
    expect(await fetchGooglePlace()).toBeNull();
  });

  it('returns null when google cannot be reached', async () => {
    server.use(http.get(PLACE_URL, () => HttpResponse.error()));
    expect(await fetchGooglePlace()).toBeNull();
  });
});
