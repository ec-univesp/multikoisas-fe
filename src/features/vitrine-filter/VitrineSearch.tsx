'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useState, type FormEvent, type ReactNode } from 'react';

type VitrineSearch = {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
};

const VitrineSearchContext = createContext<VitrineSearch | null>(null);

export const VitrineSearchProvider = ({ children }: { children?: ReactNode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  return (
    <VitrineSearchContext value={{ searchTerm, setSearchTerm, activeCategory, setActiveCategory }}>
      {children}
    </VitrineSearchContext>
  );
};

export const useVitrineSearch = (): VitrineSearch => {
  const vitrineSearch = useContext(VitrineSearchContext);
  if (vitrineSearch === null) throw new Error('useVitrineSearch must be used inside VitrineSearchProvider');
  return vitrineSearch;
};

export const VitrineSearchField = ({ id, label }: { id: string; label: string }) => {
  const { searchTerm, setSearchTerm } = useVitrineSearch();
  const router = useRouter();

  const scrollToShowcase = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const showcaseHeading = document.getElementById('vitrine');
    if (!showcaseHeading) {
      router.push('/#vitrine');
      return;
    }
    showcaseHeading.scrollIntoView({ behavior: 'smooth' });
    if (showcaseHeading.closest('section')?.contains(event.currentTarget)) return;
    showcaseHeading.focus({ preventScroll: true });
  };

  return (
    <form role="search" aria-label={label} onSubmit={scrollToShowcase} className="flex w-full items-center gap-1 rounded-lg bg-white p-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Buscar produto"
        className="h-11 min-w-0 flex-1 rounded-md bg-gray-50 px-3 text-base text-gray-800 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-store-navy"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="flex size-11 shrink-0 items-center justify-center rounded-md bg-store-yellow text-store-navy-950 hover:brightness-95"
      >
        <Search aria-hidden className="size-5" />
      </button>
    </form>
  );
};
