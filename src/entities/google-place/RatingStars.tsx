import { Star } from 'lucide-react';

const STAR_POSITIONS = [1, 2, 3, 4, 5];
export const GOOGLE_STAR_YELLOW = '#FBBC04';

export const RatingStars = ({ rating, label }: { rating: number; label: string }) => (
  <span role="img" aria-label={label} className="flex gap-0.5">
    {STAR_POSITIONS.map((position) => (
      <Star
        key={position}
        aria-hidden
        className="size-4"
        color={GOOGLE_STAR_YELLOW}
        fill={position <= Math.round(rating) ? GOOGLE_STAR_YELLOW : 'none'}
      />
    ))}
  </span>
);
