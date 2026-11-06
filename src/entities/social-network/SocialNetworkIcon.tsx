import { Globe } from 'lucide-react';
import { BRAND_ICON_PATHS } from './brandIconPaths';

const toBrandKey = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '')
    .toLowerCase();

export const SocialNetworkIcon = ({ name }: { name: string }) => {
  const brandKey = toBrandKey(name);
  const brandPath = BRAND_ICON_PATHS[brandKey];
  if (!brandPath) return <Globe aria-hidden data-icon="globe" className="size-4 shrink-0" />;
  return (
    <svg aria-hidden data-icon={brandKey} viewBox="0 0 24 24" fill="currentColor" className="size-4 shrink-0">
      <path d={brandPath} />
    </svg>
  );
};
