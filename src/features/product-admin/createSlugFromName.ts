const DIACRITICS_PATTERN = /[̀-ͯ]/g;

const toBaseSlug = (name: string): string => {
  const slug = name
    .normalize('NFD')
    .replace(DIACRITICS_PATTERN, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug : 'produto';
};

export const createSlugFromName = (
  name: string,
  existingSlugs: readonly string[],
): string => {
  const baseSlug = toBaseSlug(name);
  if (!existingSlugs.includes(baseSlug)) return baseSlug;

  let suffix = 2;
  while (existingSlugs.includes(`${baseSlug}-${suffix}`)) suffix += 1;
  return `${baseSlug}-${suffix}`;
};
