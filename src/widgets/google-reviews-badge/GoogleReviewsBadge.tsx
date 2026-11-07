import { Star } from 'lucide-react';
import {
  formatRating,
  formatReviewCount,
  GOOGLE_STAR_YELLOW,
  GoogleLogo,
  type GooglePlace,
} from '@/entities/google-place';
import { isHttpsUrl } from '@/entities/social-network';

const NEW_TAB_NOTICE = 'Abre em outra aba.';

const accessibleNameOf = (rating: number, reviewCount: number | null): string => {
  const ratingPhrase = `Nota ${formatRating(rating)} de 5 no Google`;
  if (reviewCount === null) return `${ratingPhrase}. ${NEW_TAB_NOTICE}`;
  return `${ratingPhrase}, ${formatReviewCount(reviewCount)}. ${NEW_TAB_NOTICE}`;
};

type GoogleReviewsBadgeProps = {
  place: Pick<GooglePlace, 'rating' | 'reviewCount' | 'mapsUrl'> | null;
};

export const GoogleReviewsBadge = ({ place }: GoogleReviewsBadgeProps) => {
  if (!place?.mapsUrl || !isHttpsUrl(place.mapsUrl)) return null;
  const { rating, reviewCount, mapsUrl } = place;

  const reviewsPhrase = reviewCount === null ? 'Avaliações no Google' : `${formatReviewCount(reviewCount)} no Google`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={rating === null ? `Avaliações no Google. ${NEW_TAB_NOTICE}` : accessibleNameOf(rating, reviewCount)}
      className="flex h-11 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-bold text-gray-800 shadow-lg hover:bg-gray-50 focus-visible:ring-4 focus-visible:ring-[#4285F4] focus-visible:outline-none"
    >
      <GoogleLogo />
      <Star aria-hidden className="size-4" fill={GOOGLE_STAR_YELLOW} color={GOOGLE_STAR_YELLOW} />
      {rating === null ? (
        'Avaliações no Google'
      ) : (
        <>
          {formatRating(rating)}
          <span className="hidden font-medium text-gray-600 sm:inline">{`· ${reviewsPhrase}`}</span>
        </>
      )}
    </a>
  );
};
