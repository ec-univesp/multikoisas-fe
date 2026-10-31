type BrandMarkProps = { compact?: boolean; tone?: 'onLight' | 'onDark' };

const WORDMARK_CLASS_NAMES = {
  onLight: { multi: 'text-store-navy', koisas: 'ml-0.5 rounded-md bg-store-navy px-1.5 text-store-yellow' },
  onDark: { multi: 'text-white', koisas: 'text-store-yellow' },
};

export const BrandMark = ({ compact = false, tone = 'onLight' }: BrandMarkProps) => (
  <span className="flex min-h-11 items-center gap-3">
    <span
      aria-hidden
      className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-store-yellow text-xl font-extrabold text-store-navy-950"
    >
      M
    </span>
    {compact ? (
      <span className="sr-only">MultiKoisas</span>
    ) : (
      <span className="text-xl leading-tight font-extrabold">
        <span className={WORDMARK_CLASS_NAMES[tone].multi}>Multi</span>
        <span className={WORDMARK_CLASS_NAMES[tone].koisas}>Koisas</span>
      </span>
    )}
  </span>
);
