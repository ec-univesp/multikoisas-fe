import type { StoreSettings } from './types';

// The API does not store these yet (SKI-135). Values from the store Google listing on 2026-11-06;
// update the rating and the review count by hand until the panel can save them.
export const STORE_SETTINGS: StoreSettings = {
  address: 'Av. Prof. Luiz Inácio de Anhaia Melo, 2085 - Centreville, Santo André - SP',
  googleReviewsUrl:
    'https://www.google.com/maps/search/?api=1&query=MultiKoisas%20Av.%20Prof.%20Luiz%20In%C3%A1cio%20de%20Anhaia%20Melo%202085%20Santo%20Andr%C3%A9',
  googleRating: 4.7,
  googleReviewCount: 387,
};
