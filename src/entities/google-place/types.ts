export type GoogleReview = {
  authorName: string;
  authorUrl: string | null;
  authorPhotoUrl: string | null;
  rating: number;
  publishedAgo: string;
  text: string;
};

export type GooglePlace = {
  rating: number | null;
  reviewCount: number | null;
  mapsUrl: string | null;
  summary: { text: string; reportUrl: string | null } | null;
  reviews: GoogleReview[];
};
