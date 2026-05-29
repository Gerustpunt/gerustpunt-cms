/**
 * Turn an arbitrary string into a URL-safe slug.
 * Strips diacritics, lowercases, replaces runs of non-alphanumerics with `-`,
 * trims leading/trailing dashes. Designed for Dutch input — `café` → `cafe`.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}
