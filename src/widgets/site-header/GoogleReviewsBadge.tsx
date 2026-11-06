import { Star } from 'lucide-react';
import { isHttpsUrl } from '@/entities/social-network';
import type { StoreSettings } from '@/entities/store-settings';

const NEW_TAB_NOTICE = 'Abre em outra aba.';

const formatRating = (rating: number): string =>
  rating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const formatReviewCount = (reviewCount: number): string =>
  `${reviewCount.toLocaleString('pt-BR')} ${reviewCount === 1 ? 'avaliação' : 'avaliações'}`;

const accessibleNameOf = (rating: number, reviewCount: number | null): string => {
  const ratingPhrase = `Nota ${formatRating(rating)} de 5 no Google`;
  if (reviewCount === null) return `${ratingPhrase}. ${NEW_TAB_NOTICE}`;
  return `${ratingPhrase}, ${formatReviewCount(reviewCount)}. ${NEW_TAB_NOTICE}`;
};

export const GoogleReviewsBadge = ({ settings, className = '' }: { settings: StoreSettings; className?: string }) => {
  const { googleReviewsUrl, googleRating, googleReviewCount } = settings;
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
      className={`flex h-11 w-fit shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-sm font-bold text-white hover:bg-white/20 ${className}`}
    >
      <Star aria-hidden className="size-4 fill-store-yellow text-store-yellow" />
      {googleRating === null ? (
        'Avaliações no Google'
      ) : (
        <>
          {formatRating(googleRating)}
          <span className="hidden font-medium sm:inline">{`· ${reviewsPhrase}`}</span>
        </>
      )}
    </a>
  );
};
