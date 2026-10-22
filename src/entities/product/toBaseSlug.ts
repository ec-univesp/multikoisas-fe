const DIACRITICS_PATTERN = /[̀-ͯ]/g;

export const toBaseSlug = (name: string): string => {
  const slug = name
    .normalize('NFD')
    .replace(DIACRITICS_PATTERN, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug : 'produto';
};
