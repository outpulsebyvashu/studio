import { isProfession } from './professions.ts';
import { slugProblem } from './slug.ts';

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const bad = (error: string): Result<never> => ({ ok: false, error });

export function validateFullName(v: unknown): Result<string> {
  const s = String(v ?? '').trim().replace(/\s+/g, ' ');
  if (s.length < 2) return bad('Enter your full name.');
  if (s.length > 80) return bad('That name is too long.');
  return ok(s);
}
export function validateEmail(v: unknown): Result<string> {
  const s = String(v ?? '').trim().toLowerCase();
  if (s.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return bad('Enter a valid email address.');
  return ok(s);
}
/** At least 10 characters, no other rules (your decision). */
export function validatePassword(v: unknown): Result<string> {
  const s = String(v ?? '');
  if (s.length < 10) return bad('Use at least 10 characters.');
  if (s.length > 128) return bad('Use at most 128 characters.');
  return ok(s);
}
/** Indian mobile: 10 digits starting 6 to 9. Accepts +91, 91, 0 prefixes and spaces. Returns the 10 digits. */
export function validateIndianMobile(v: unknown): Result<string> {
  let s = String(v ?? '').replace(/[\s\-()]/g, '');
  s = s.replace(/^\+?91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');
  if (!/^[6-9]\d{9}$/.test(s)) return bad('Enter a 10 digit Indian mobile number.');
  return ok(s);
}
export function validatePracticeName(v: unknown): Result<string> {
  const s = String(v ?? '').trim().replace(/\s+/g, ' ');
  if (s.length < 2) return bad('Enter your practice name.');
  if (s.length > 80) return bad('That name is too long.');
  return ok(s);
}
export function validateProfession(v: unknown) {
  return isProfession(v) ? ok(v) : bad('Choose your profession.');
}
export function validateSlug(v: unknown): Result<string> {
  const s = String(v ?? '').trim().toLowerCase();
  const p = slugProblem(s);
  return p ? bad(p) : ok(s);
}
export function validateOtpCode(v: unknown): Result<string> {
  const s = String(v ?? '').replace(/\s/g, '');
  return /^\d{6}$/.test(s) ? ok(s) : bad('Enter the 6 digit code.');
}
export function validateConsent(v: unknown): Result<true> {
  return v === true || v === 'on' || v === 'true' ? ok(true) : bad('Please accept the Terms and Privacy Policy to continue.');
}
export function firstError(...rs: Result<unknown>[]): string | null {
  for (const r of rs) if (!r.ok) return r.error;
  return null;
}
export const CURRENT_CONSENTS = [
  { document: 'terms', version: '2026-10-draft' },
  { document: 'privacy', version: '2026-10-draft' },
  { document: 'dpa', version: '2026-10-draft' },
] as const;
