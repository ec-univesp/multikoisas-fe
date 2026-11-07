import {
  formatRating,
  formatReviewCount,
  GoogleLogo,
  RatingStars,
  type GooglePlace,
  type GoogleReview,
} from '@/entities/google-place';

const NEW_TAB_NOTICE = 'Abre em outra aba.';

const ReviewAuthor = ({ review }: { review: GoogleReview }) => {
  if (!review.authorUrl) return <span className="font-bold text-gray-800">{review.authorName}</span>;
  return (
    <a
      href={review.authorUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${review.authorName}. ${NEW_TAB_NOTICE}`}
      className="font-bold text-gray-800 hover:underline"
    >
      {review.authorName}
    </a>
  );
};

const ReviewCard = ({ review }: { review: GoogleReview }) => (
  <li className="flex min-w-0 flex-col gap-3 rounded-lg border border-gray-200 p-4">
    <div className="flex items-center gap-3">
      {review.authorPhotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- google serves author photos from changing hosts and asks for no referrer
        <img
          src={review.authorPhotoUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="size-10 rounded-full object-cover"
        />
      )}
      <div className="flex flex-col">
        <ReviewAuthor review={review} />
        <span className="text-sm text-gray-500">{review.publishedAgo}</span>
      </div>
    </div>
    <RatingStars rating={review.rating} label={`Nota ${review.rating} de 5`} />
    {review.text && <p className="line-clamp-6 break-words text-gray-700">{review.text}</p>}
  </li>
);

export const GoogleReviews = ({ place }: { place: GooglePlace | null }) => {
  if (!place || place.rating === null) return null;
  const { rating, reviewCount, mapsUrl, summary, reviews } = place;

  return (
    <section aria-labelledby="google-reviews-title" className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="flex flex-col gap-6 rounded-xl bg-white p-5 shadow-theme-xs lg:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="google-reviews-title"
              className="text-2xl font-extrabold tracking-tight text-store-navy sm:text-3xl"
            >
              O que dizem no Google
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <GoogleLogo />
              <span className="text-3xl font-extrabold text-gray-800">{formatRating(rating)}</span>
              <RatingStars rating={rating} label={`Nota ${formatRating(rating)} de 5`} />
              {reviewCount !== null && <span className="text-gray-600">{formatReviewCount(reviewCount)}</span>}
            </div>
          </div>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ver todas as avaliações no Google. ${NEW_TAB_NOTICE}`}
              className="flex h-11 w-fit items-center rounded-lg bg-store-yellow px-4 text-sm font-bold text-store-navy-950 hover:brightness-95"
            >
              Ver todas as avaliações no Google
            </a>
          )}
        </div>
        {summary && (
          <figure className="rounded-lg bg-gray-50 p-4">
            <blockquote className="text-gray-700">{summary.text}</blockquote>
            <figcaption className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
              <span>{summary.disclosure ?? 'Resumo das avaliações feito pelo Google com o Gemini.'}</span>
              {summary.reportUrl && (
                <a
                  href={summary.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Informar um problema no resumo. ${NEW_TAB_NOTICE}`}
                  className="inline-flex min-h-11 items-center underline"
                >
                  Informar um problema
                </a>
              )}
            </figcaption>
          </figure>
        )}
        {reviews.length > 0 && (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, position) => (
              <ReviewCard key={position} review={review} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
