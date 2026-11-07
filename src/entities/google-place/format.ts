export const formatRating = (rating: number): string =>
  rating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const formatReviewCount = (reviewCount: number): string =>
  `${reviewCount.toLocaleString('pt-BR')} ${reviewCount === 1 ? 'avaliação' : 'avaliações'}`;
