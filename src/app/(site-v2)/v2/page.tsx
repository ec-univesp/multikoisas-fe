import type { Metadata } from 'next';
import { AboutSectionV2 } from '@/widgets/about-section-v2';
import { HeroV2 } from '@/widgets/hero-v2';
import { VitrineV2 } from '@/widgets/vitrine-v2';

export const metadata: Metadata = {
  title: 'Vitrine v2 | MultiKoisas',
  robots: { index: false, follow: false },
};

const VitrineV2Page = () => (
  <>
    <HeroV2 />
    <VitrineV2 />
    <AboutSectionV2 />
  </>
);

export default VitrineV2Page;
