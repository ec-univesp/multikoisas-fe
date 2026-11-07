import type { GooglePlace, GoogleReview } from './types';

// Public Google Maps id of the MultiKoisas store in Santo André, found with the Places text search.
export const MULTIKOISAS_PLACE_ID = 'ChIJO1R5r5RpzpQR00aC6OWTw6o';

const PLACE_URL = `https://places.googleapis.com/v1/places/${MULTIKOISAS_PLACE_ID}?languageCode=pt-BR`;
const FIELD_MASK = 'rating,userRatingCount,googleMapsUri,reviews,reviewSummary';
// Google bills every call: one call a day stays far inside the free monthly quota.
const ONE_DAY_IN_SECONDS = 86_400;

type PlacesReview = {
  rating?: number;
  relativePublishTimeDescription?: string;
  text?: { text?: string };
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
};

type PlacesResponse = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviewSummary?: { text?: { text?: string }; flagContentUri?: string };
  reviews?: PlacesReview[];
};

const toReview = ({ rating, relativePublishTimeDescription, text, authorAttribution }: PlacesReview): GoogleReview => ({
  authorName: authorAttribution?.displayName ?? '',
  authorUrl: authorAttribution?.uri ?? null,
  authorPhotoUrl: authorAttribution?.photoUri ?? null,
  rating: rating ?? 0,
  publishedAgo: relativePublishTimeDescription ?? '',
  text: text?.text ?? '',
});

const toGooglePlace = (place: PlacesResponse): GooglePlace => {
  const summaryText = place.reviewSummary?.text?.text;
  return {
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? null,
    mapsUrl: place.googleMapsUri ?? null,
    summary: summaryText ? { text: summaryText, reportUrl: place.reviewSummary?.flagContentUri ?? null } : null,
    reviews: (place.reviews ?? []).map(toReview),
  };
};

export const fetchGooglePlace = async (): Promise<GooglePlace | null> => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch(PLACE_URL, {
      headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELD_MASK },
      next: { revalidate: ONE_DAY_IN_SECONDS },
    });
    if (!response.ok) return null;
    const place: PlacesResponse = await response.json();
    return toGooglePlace(place);
  } catch {
    return null;
  }
};
