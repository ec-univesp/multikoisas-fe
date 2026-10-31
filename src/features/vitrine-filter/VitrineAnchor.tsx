'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

const VITRINE_ID = 'vitrine';

const focusVitrineHeading = () => document.getElementById(VITRINE_ID)?.focus({ preventScroll: true });

export const VitrineHeading = () => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (window.location.hash === `#${VITRINE_ID}`) headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <h2 ref={headingRef} id={VITRINE_ID} tabIndex={-1} className="sr-only scroll-mt-4">
      Vitrine de produtos
    </h2>
  );
};

export const VitrineLink = ({ className }: { className: string }) => (
  <Link href={`/#${VITRINE_ID}`} className={className} onClick={focusVitrineHeading}>
    Vitrine de produtos
  </Link>
);
