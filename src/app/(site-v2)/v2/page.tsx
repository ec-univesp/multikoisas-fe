import type { Metadata } from 'next';
import { VitrineV2 } from '@/widgets/vitrine-v2';

export const metadata: Metadata = {
  title: 'Vitrine v2 | MultiKoisas',
  robots: { index: false, follow: false },
};

const VitrineV2Page = () => <VitrineV2 />;

export default VitrineV2Page;
