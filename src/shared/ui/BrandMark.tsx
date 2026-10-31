export const BrandMark = ({ compact = false }: { compact?: boolean }) => (
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
      <span className="text-xl leading-tight font-extrabold text-store-navy">
        Multi<span className="ml-0.5 rounded-md bg-store-navy px-1.5 text-store-yellow">Koisas</span>
      </span>
    )}
  </span>
);
