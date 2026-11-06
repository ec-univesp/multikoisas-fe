'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

const SHOWCASE_ID = 'showcase';
// Links shared before the English routes end in #vitrine and reach here through the /vitrine redirect.
const FOCUS_HASHES = new Set([`#${SHOWCASE_ID}`, '#vitrine']);

const focusShowcaseHeading = () => document.getElementById(SHOWCASE_ID)?.focus({ preventScroll: true });

export const ShowcaseHeading = () => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (FOCUS_HASHES.has(window.location.hash)) headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <h1
      ref={headingRef}
      id={SHOWCASE_ID}
      tabIndex={-1}
      className="scroll-mt-4 text-2xl font-extrabold tracking-tight text-store-navy outline-none sm:text-3xl"
    >
      Vitrine de produtos
    </h1>
  );
};

export const ShowcaseLink = ({ className }: { className: string }) => (
  <Link href="/showcase" className={className} onClick={focusShowcaseHeading}>
    Vitrine de produtos
  </Link>
);
