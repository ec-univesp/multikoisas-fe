import type { StoreSettings } from './types';

// The API does not store these yet (SKI-135). Fill by hand, for example
// { address: 'Rua Exemplo, 100 - São Paulo, SP', googleReviewsUrl: 'https://g.page/r/.../review', googleRating: 4.8, googleReviewCount: 123 }.
export const STORE_SETTINGS: StoreSettings = {
  address: null,
  googleReviewsUrl: null,
  googleRating: null,
  googleReviewCount: null,
};
