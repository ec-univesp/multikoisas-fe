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
    <h1
      ref={headingRef}
      id={VITRINE_ID}
      tabIndex={-1}
      className="scroll-mt-4 text-2xl font-extrabold tracking-tight text-store-navy outline-none sm:text-3xl"
    >
      Vitrine de produtos
    </h1>
  );
};

export const VitrineLink = ({ className }: { className: string }) => (
  <Link href="/vitrine" className={className} onClick={focusVitrineHeading}>
    Vitrine de produtos
  </Link>
);
