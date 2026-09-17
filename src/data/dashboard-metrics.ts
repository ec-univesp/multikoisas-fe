import type { StoreSlug } from '@/entities/product';

export type Trend = 'up' | 'down';

export type ChangeSummary = {
  trend: Trend;
  percentage: number;
};

export type MonthlyClicksPoint = {
  month: string;
  clicks: number;
};

export type StoreClickShare = {
  store: StoreSlug;
  clicks: number;
};

export type TopClickedProduct = {
  slug: string;
  clicks: number;
};

export type SearchedCategoryVolume = {
  term: string;
  volume: number;
};

// TODO: API — todo o conteúdo abaixo é mock até a origem real dos eventos de clique/visita existir.
export const monthlyVisitors = {
  current: 4820,
  previous: 4290,
} as const;

export const monthlyStoreClicks: readonly MonthlyClicksPoint[] = [
  { month: 'Jan', clicks: 512 },
  { month: 'Fev', clicks: 588 },
  { month: 'Mar', clicks: 634 },
  { month: 'Abr', clicks: 701 },
  { month: 'Mai', clicks: 675 },
  { month: 'Jun', clicks: 742 },
  { month: 'Jul', clicks: 803 },
  { month: 'Ago', clicks: 860 },
  { month: 'Set', clicks: 895 },
  { month: 'Out', clicks: 921 },
  { month: 'Nov', clicks: 940 },
  { month: 'Dez', clicks: 968 },
];

export const currentMonthClicks = monthlyStoreClicks[monthlyStoreClicks.length - 1].clicks;
export const previousMonthClicks = monthlyStoreClicks[monthlyStoreClicks.length - 2].clicks;

export const storeClickDistribution: readonly StoreClickShare[] = [
  { store: 'mercado-livre', clicks: 520 },
  { store: 'shopee', clicks: 340 },
  { store: 'aliexpress', clicks: 108 },
];

export const topClickedProducts: readonly TopClickedProduct[] = [
  { slug: 'kit-potes-hermeticos-5-pecas', clicks: 210 },
  { slug: 'garrafa-termica-1l', clicks: 180 },
  { slug: 'caixa-organizadora-30l', clicks: 150 },
  { slug: 'escorredor-de-louca-inox', clicks: 120 },
  { slug: 'organizador-de-gavetas', clicks: 95 },
];

export const topSearchedCategories: readonly SearchedCategoryVolume[] = [
  { term: 'Cozinha', volume: 1240 },
  { term: 'Organização', volume: 860 },
  { term: 'Limpeza', volume: 640 },
  { term: 'Casa', volume: 410 },
];

export const calculateChangePercentage = (current: number, previous: number): ChangeSummary => {
  if (previous === 0) {
    return { trend: current >= 0 ? 'up' : 'down', percentage: 0 };
  }
  const rawChange = ((current - previous) / previous) * 100;
  return { trend: rawChange >= 0 ? 'up' : 'down', percentage: Math.abs(rawChange) };
};

export const calculateClickRate = (clicks: number, visitors: number): number =>
  visitors === 0 ? 0 : (clicks / visitors) * 100;

export const getTopClickedProducts = (
  entries: readonly TopClickedProduct[] = topClickedProducts,
  limit = 5,
): readonly TopClickedProduct[] =>
  [...entries].sort((a, b) => b.clicks - a.clicks).slice(0, limit);
