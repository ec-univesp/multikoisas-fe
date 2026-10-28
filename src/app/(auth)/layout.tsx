import {
  BadgeCheck,
  CreditCard,
  Gift,
  Heart,
  Package,
  Percent,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Tags,
  Truck,
} from 'lucide-react';

const PANEL_ICON_KINDS = [
  ShoppingBag,
  ShoppingCart,
  Tag,
  Tags,
  Package,
  Gift,
  Store,
  Truck,
  Percent,
  Star,
  Receipt,
  CreditCard,
  Heart,
  BadgeCheck,
] as const;

const PANEL_ICON_GRID_ROWS = 7;
const PANEL_ICON_GRID_COLUMNS = 5;
const PANEL_ICON_JITTER_FRACTION = 0.4;
const PANEL_ICON_MAX_ROTATION = 60;

const hashUnit = (index: number, multiplier: number) => ((index * multiplier) % 1000) / 1000;

const TEXT_ZONE = { minLeft: 4, maxLeft: 55, minTop: 34, maxTop: 66 };

const PANEL_ICON_TIERS = [
  { minSize: 36, sizeRange: 10, minOpacity: 0.22, opacityRange: 0.064, strokeWidth: 2.5 },
  { minSize: 26, sizeRange: 8, minOpacity: 0.12, opacityRange: 0.048, strokeWidth: 2 },
  { minSize: 42, sizeRange: 12, minOpacity: 0.04, opacityRange: 0.016, strokeWidth: 1.25 },
] as const;

const PANEL_ICONS = Array.from({ length: PANEL_ICON_GRID_ROWS }).flatMap((_row, row) =>
  Array.from({ length: PANEL_ICON_GRID_COLUMNS }).map((_column, column) => {
    const index = row * PANEL_ICON_GRID_COLUMNS + column;
    const rowPitch = 100 / PANEL_ICON_GRID_ROWS;
    const columnPitch = 100 / PANEL_ICON_GRID_COLUMNS;
    const jitterTop = (hashUnit(index, 2654435761) - 0.5) * 2 * PANEL_ICON_JITTER_FRACTION;
    const jitterLeft = (hashUnit(index, 2246822519) - 0.5) * 2 * PANEL_ICON_JITTER_FRACTION;
    const top = rowPitch * (row + 0.5) + jitterTop * rowPitch;
    const left = columnPitch * (column + 0.5) + jitterLeft * columnPitch;
    const inTextZone =
      left >= TEXT_ZONE.minLeft && left <= TEXT_ZONE.maxLeft && top >= TEXT_ZONE.minTop && top <= TEXT_ZONE.maxTop;
    const tier = inTextZone ? PANEL_ICON_TIERS[2] : PANEL_ICON_TIERS[index % 3];

    return {
      id: `panel-icon-${index}`,
      Icon: PANEL_ICON_KINDS[index % PANEL_ICON_KINDS.length],
      top,
      left,
      size: tier.minSize + ((index * 7) % tier.sizeRange),
      rotation: (hashUnit(index, 3266489917) - 0.5) * 2 * PANEL_ICON_MAX_ROTATION,
      opacity: tier.minOpacity + ((index * 3) % 5) * (tier.opacityRange / 5),
      strokeWidth: tier.strokeWidth,
      delay: `${(index % 6) * 1.4}s`,
    };
  }),
);

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] bg-white lg:grid-cols-[1.05fr_1fr] lg:grid-rows-1">
      <aside className="relative isolate flex h-44 flex-col justify-end overflow-hidden bg-brand-950 px-6 pb-7 sm:h-52 sm:px-10 lg:h-auto lg:justify-center lg:px-16 lg:py-20">
        <style>{`
          @keyframes auth-panel-drift {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
        `}</style>
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 -right-24 size-[26rem] sm:size-[32rem] lg:-top-20 lg:-right-40 lg:size-[46rem]"
        >
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute inset-[13%] rounded-full border border-white/10" />
          <div className="absolute inset-[27%] rounded-full border border-white/[0.07]" />
          <div className="absolute inset-[41%] rounded-full border border-white/[0.05]" />
          <div className="absolute inset-0 animate-spin rounded-full bg-[conic-gradient(from_0deg,transparent_240deg,var(--color-brand-500)_360deg)] opacity-25 [animation-duration:9s] motion-reduce:animate-none" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-brand-500/20 blur-3xl"
        />

        <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
          {PANEL_ICONS.map(({ id, Icon, top, left, size, rotation, opacity, strokeWidth, delay }) => (
            <div
              key={id}
              className="absolute"
              style={{ top: `${top}%`, left: `${left}%`, transform: `rotate(${rotation}deg)` }}
            >
              <Icon
                size={size}
                strokeWidth={strokeWidth}
                className="animate-[auth-panel-drift_10s_ease-in-out_infinite] text-white motion-reduce:animate-none"
                style={{ opacity, animationDelay: delay }}
              />
            </div>
          ))}
        </div>

        <div className="relative max-w-md">
          <span className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-5xl">multikoisas</span>
          <p className="mt-1 text-sm font-medium text-brand-200 lg:text-base">Painel da loja</p>
          <p className="mt-5 hidden text-sm leading-relaxed text-white/60 lg:block lg:text-base">
            Produtos, fotos e links de compra da vitrine, tudo num lugar só.
          </p>
        </div>
      </aside>

      <main className="flex items-start justify-center px-6 pt-12 pb-16 sm:px-10 lg:items-center lg:py-20">
        {children}
      </main>
    </div>
  );
}
