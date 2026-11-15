export const slugifyItemId = (input: string): string =>
  String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const resolveItemId = (
  explicitId?: string,
  ...fallbackParts: Array<string | undefined>
): string => {
  if (explicitId && explicitId.trim()) return slugifyItemId(explicitId);
  return slugifyItemId(fallbackParts.filter(Boolean).join('-'));
};
