'use client';

import { Star } from 'lucide-react';
import { isHttpsUrl } from '@/entities/social-network';
import { useStoreSettings, type StoreSettingsValues } from '@/entities/store-settings';

const NEW_TAB_NOTICE = 'Abre em outra aba.';
const GOOGLE_STAR_YELLOW = '#FBBC04';

// Google "G" mark in the brand colors.
const GoogleLogo = () => (
  <svg aria-hidden data-icon="google" viewBox="0 0 48 48" className="size-5 shrink-0">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

const formatRating = (rating: number): string =>
  rating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const formatReviewCount = (reviewCount: number): string =>
  `${reviewCount.toLocaleString('pt-BR')} ${reviewCount === 1 ? 'avaliação' : 'avaliações'}`;

const accessibleNameOf = (rating: number, reviewCount: number | null): string => {
  const ratingPhrase = `Nota ${formatRating(rating)} de 5 no Google`;
  if (reviewCount === null) return `${ratingPhrase}. ${NEW_TAB_NOTICE}`;
  return `${ratingPhrase}, ${formatReviewCount(reviewCount)}. ${NEW_TAB_NOTICE}`;
};

export const GoogleReviewsBadge = ({ settings }: { settings?: StoreSettingsValues }) => {
  const savedSettings = useStoreSettings();
  if (!settings && savedSettings.status === 'loading') return null;
  const { googleReviewsUrl, googleRating, googleReviewCount } = settings ?? savedSettings.settings;
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
