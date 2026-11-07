'use client';

import { Star } from 'lucide-react';
import {
  formatRating,
  formatReviewCount,
  GOOGLE_STAR_YELLOW,
  GoogleLogo,
  type GooglePlace,
} from '@/entities/google-place';
import { isHttpsUrl } from '@/entities/social-network';
import { useStoreSettings, type StoreSettingsValues } from '@/entities/store-settings';

const NEW_TAB_NOTICE = 'Abre em outra aba.';

const accessibleNameOf = (rating: number, reviewCount: number | null): string => {
  const ratingPhrase = `Nota ${formatRating(rating)} de 5 no Google`;
  if (reviewCount === null) return `${ratingPhrase}. ${NEW_TAB_NOTICE}`;
  return `${ratingPhrase}, ${formatReviewCount(reviewCount)}. ${NEW_TAB_NOTICE}`;
};

type GoogleReviewsBadgeProps = {
  settings?: StoreSettingsValues;
  livePlace?: Pick<GooglePlace, 'rating' | 'reviewCount'>;
};

export const GoogleReviewsBadge = ({ settings, livePlace }: GoogleReviewsBadgeProps) => {
  const savedSettings = useStoreSettings();
  if (!settings && savedSettings.status === 'loading') return null;
  const { googleReviewsUrl, ...savedValues } = settings ?? savedSettings.settings;
  const googleRating = livePlace?.rating ?? savedValues.googleRating;
  const googleReviewCount = livePlace?.reviewCount ?? savedValues.googleReviewCount;
  if (!googleReviewsUrl || !isHttpsUrl(googleReviewsUrl)) return null;

  const reviewsPhrase =
    googleReviewCount === null ? 'Avaliações no Google' : `${formatReviewCount(googleReviewCount)} no Google`;

  return (
    <a
      href={googleReviewsUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        googleRating === null
          ? `Avaliações no Google. ${NEW_TAB_NOTICE}`
          : accessibleNameOf(googleRating, googleReviewCount)
      }
      className="flex h-11 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-bold text-gray-800 shadow-lg hover:bg-gray-50 focus-visible:ring-4 focus-visible:ring-[#4285F4] focus-visible:outline-none"
    >
      <GoogleLogo />
      <Star aria-hidden className="size-4" fill={GOOGLE_STAR_YELLOW} color={GOOGLE_STAR_YELLOW} />
      {googleRating === null ? (
        'Avaliações no Google'
      ) : (
        <>
          {formatRating(googleRating)}
          <span className="hidden font-medium text-gray-600 sm:inline">{`· ${reviewsPhrase}`}</span>
        </>
      )}
    </a>
  );
};
