import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_MS = 60 * 1000;
export const OTP_DAILY_LIMIT = 10;

export function generateCode(): string { return String(randomInt(0, 1_000_000)).padStart(6, '0'); }
export function hashCode(code: string, userId: string, mobile: string, pepper: string): string {
  return createHash('sha256').update(`${pepper}|${userId}|${mobile}|${code}`).digest('hex');
}
export interface OtpRecord { codeHash: string; expiresAt: number; attempts: number; consumedAt: number | null; }
export type OtpCheck =
  | { ok: true }
  | { ok: false; reason: 'none' | 'expired' | 'locked' | 'used' | 'wrong'; attemptsLeft?: number };

/** Pure check. The caller increments attempts when the answer is 'wrong' and marks consumed when ok. */
export function checkOtp(rec: OtpRecord | null, code: string, userId: string, mobile: string, pepper: string, now: number): OtpCheck {
  if (!rec) return { ok: false, reason: 'none' };
  if (rec.consumedAt) return { ok: false, reason: 'used' };
  if (now > rec.expiresAt) return { ok: false, reason: 'expired' };
  if (rec.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: 'locked' };
  const a = Buffer.from(hashCode(code, userId, mobile, pepper));
  const b = Buffer.from(rec.codeHash);
  if (a.length === b.length && timingSafeEqual(a, b)) return { ok: true };
  return { ok: false, reason: 'wrong', attemptsLeft: Math.max(0, OTP_MAX_ATTEMPTS - rec.attempts - 1) };
}
export function secondsUntilResend(lastCreatedAt: number | null, now: number): number {
  if (!lastCreatedAt) return 0;
  return Math.max(0, Math.ceil((lastCreatedAt + OTP_RESEND_MS - now) / 1000));
}
export function maskMobile(m: string): string { return `+91 ${'•'.repeat(5)} ${'•'.repeat(2)}${m.slice(-3)}`; }
