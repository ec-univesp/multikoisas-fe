import Link from 'next/link';

export const SiteHeader = () => (
  <header className="sticky top-0 z-10 border-b border-gray-200 bg-neutral-50/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
      <Link
        href="/"
        className="flex h-11 items-center text-lg font-semibold text-brand-blue dark:text-white"
      >
        multikoisas
      </Link>
      <Link
        href="#sobre"
        className="flex h-11 items-center px-2 text-sm font-medium text-gray-600 hover:text-brand-blue dark:text-gray-400 dark:hover:text-white"
      >
        Sobre
      </Link>
    </div>
  </header>
);
