import type { GooglePlace, GoogleReview } from './types';

export const MULTIKOISAS_PLACE_ID = 'ChIJO1R5r5RpzpQR00aC6OWTw6o';

const PLACE_URL = `https://places.googleapis.com/v1/places/${MULTIKOISAS_PLACE_ID}?languageCode=pt-BR`;
const FIELD_MASK = 'rating,userRatingCount,googleMapsUri,reviews,reviewSummary';
const ONE_DAY_IN_SECONDS = 86_400;
const GOOGLE_TIMEOUT_IN_MILLISECONDS = 5_000;

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
  reviewSummary?: { text?: { text?: string }; disclosureText?: { text?: string }; flagContentUri?: string };
  reviews?: PlacesReview[];
};

type RatedPlacesReview = PlacesReview & { rating: number };

const hasRating = (review: PlacesReview): review is RatedPlacesReview => typeof review.rating === 'number';

const toReview = ({
  rating,
  relativePublishTimeDescription,
  text,
  authorAttribution,
}: RatedPlacesReview): GoogleReview => ({
  authorName: authorAttribution?.displayName ?? '',
  authorUrl: authorAttribution?.uri ?? null,
  authorPhotoUrl: authorAttribution?.photoUri ?? null,
  rating,
  publishedAgo: relativePublishTimeDescription ?? '',
  text: text?.text ?? '',
});

const toGooglePlace = (place: PlacesResponse): GooglePlace => {
  const { reviewSummary } = place;
  const summaryText = reviewSummary?.text?.text;
  return {
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? null,
    mapsUrl: place.googleMapsUri ?? null,
    summary: summaryText
      ? {
          text: summaryText,
          disclosure: reviewSummary?.disclosureText?.text ?? null,
          reportUrl: reviewSummary?.flagContentUri ?? null,
        }
      : null,
    reviews: (place.reviews ?? []).filter(hasRating).map(toReview),
  };
};

export const fetchGooglePlace = async (): Promise<GooglePlace | null> => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch(PLACE_URL, {
      headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELD_MASK },
      next: { revalidate: ONE_DAY_IN_SECONDS },
      signal: AbortSignal.timeout(GOOGLE_TIMEOUT_IN_MILLISECONDS),
    });
    if (!response.ok) return null;
    const place: PlacesResponse = await response.json();
    return toGooglePlace(place);
  } catch {
    return null;
  }
};
