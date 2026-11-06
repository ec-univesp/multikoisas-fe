export const PRODUCT_IMAGE_HOSTS = [
  'avphmmvnlrbidhjrzozx.supabase.co',
  'avphmmvnlrbidhjrzozx.storage.supabase.co',
] as const;
export const PRODUCT_IMAGE_PATH = '/storage/v1/object/public/';

// The API stores some URLs without /object/ (UNIV-17 on santi).
const PATH_WITHOUT_OBJECT = '/storage/v1/public/';

export const LOCAL_IMAGES_PATH = '/local-images/';

const isAllowedHost = (hostname: string): boolean => PRODUCT_IMAGE_HOSTS.some((host) => host === hostname);

export const isLocalImageUrl = (url: string): boolean => url.startsWith(LOCAL_IMAGES_PATH);

const isSameOrigin = (parsed: URL): boolean =>
  typeof window !== 'undefined' && parsed.origin === window.location.origin;

export const toDisplayableImageUrl = (url: string): string | null => {
  if (isLocalImageUrl(url)) return url;
  if (!URL.canParse(url)) return null;
  const parsed = new URL(url);
  if (isSameOrigin(parsed) && isLocalImageUrl(parsed.pathname)) return parsed.pathname;
  if (parsed.pathname.startsWith(PATH_WITHOUT_OBJECT)) {
    parsed.pathname = parsed.pathname.replace(PATH_WITHOUT_OBJECT, PRODUCT_IMAGE_PATH);
  }
  const isDisplayable =
    parsed.protocol === 'https:' && isAllowedHost(parsed.hostname) && parsed.pathname.startsWith(PRODUCT_IMAGE_PATH);
  return isDisplayable ? parsed.href : null;
};
