import Link from 'next/link';

export const SiteHeader = () => (
  <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
      <Link href="/" className="flex h-11 items-center text-lg font-semibold text-gray-800">
        multikoisas
      </Link>
      <Link
        href="#sobre"
        className="flex h-11 items-center px-2 text-sm font-medium text-gray-500 hover:text-brand-500"
      >
        Sobre
      </Link>
    </div>
  </header>
);
