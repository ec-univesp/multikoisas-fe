export const PRODUCT_IMAGE_HOSTS = [
  'avphmmvnlrbidhjrzozx.supabase.co',
  'avphmmvnlrbidhjrzozx.storage.supabase.co',
] as const;
export const PRODUCT_IMAGE_PATH = '/storage/v1/object/public/';

// A API grava parte das URLs sem o /object/ (UNIV-17 no santi).
const PATH_WITHOUT_OBJECT = '/storage/v1/public/';

const isAllowedHost = (hostname: string): boolean =>
  PRODUCT_IMAGE_HOSTS.some((host) => host === hostname);

export const toDisplayableImageUrl = (url: string): string | null => {
  if (!URL.canParse(url)) return null;
  const parsed = new URL(url);
  if (parsed.pathname.startsWith(PATH_WITHOUT_OBJECT)) {
    parsed.pathname = parsed.pathname.replace(PATH_WITHOUT_OBJECT, PRODUCT_IMAGE_PATH);
  }
  const isDisplayable =
    parsed.protocol === 'https:' && isAllowedHost(parsed.hostname) && parsed.pathname.startsWith(PRODUCT_IMAGE_PATH);
  return isDisplayable ? parsed.href : null;
};
