// Subdomain rules. Keep RESERVED in sync with public.slug_reserved() in supabase/migrations/0001_init.sql.
export const RESERVED: readonly string[] = [
  'www','app','api','admin','portal','mail','email','smtp','ftp','help','support','status','blog','docs','dashboard',
  'login','signup','static','assets','cdn','studio','outpulse','billing','pay','payments','secure','security','legal',
  'terms','privacy','about','pricing','features','contact','demo','test','staging','dev',
];
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 40)
    .replace(/-+$/, '');
}
export function isValidSlug(s: string): boolean {
  return SLUG_RE.test(s) && !s.includes('--') && !RESERVED.includes(s);
}
export function slugProblem(s: string): string | null {
  if (s.length < 3) return 'Use at least 3 characters.';
  if (s.length > 40) return 'Use at most 40 characters.';
  if (!SLUG_RE.test(s)) return 'Use lowercase letters, numbers and single hyphens. Start and end with a letter or number.';
  if (s.includes('--')) return 'Do not use two hyphens in a row.';
  if (RESERVED.includes(s)) return 'That address is reserved. Try another.';
  return null;
}
