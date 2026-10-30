import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, isValidSlug, slugProblem, RESERVED } from '../lib/slug.ts';
import * as v from '../lib/validation.ts';
import { PLANS, canAddClient, canAddAppointmentType, annualPriceInr } from '../lib/plans.ts';
import { adBlocksDefaultOff, PROFESSIONS } from '../lib/professions.ts';
import { generateCode, hashCode, checkOtp, secondsUntilResend, maskMobile, OTP_TTL_MS, OTP_MAX_ATTEMPTS } from '../lib/otp.ts';

test('slugify makes safe subdomains', () => {
  assert.equal(slugify('Mehta & Sons CA'), 'mehta-and-sons-ca');
  assert.equal(slugify('  Café   Nair!! '), 'cafe-nair');
  assert.equal(slugify('---x---'), 'x');
  assert.ok(slugify('a'.repeat(80)).length <= 40);
});
test('slug validity', () => {
  assert.ok(isValidSlug('mehta-ca'));
  for (const bad of ['ab', 'Mehta', 'a--b', '-ab', 'ab-', 'a b', 'admin', 'www', 'x'.repeat(41)]) assert.equal(isValidSlug(bad), false, bad);
  assert.equal(slugProblem('admin'), 'That address is reserved. Try another.');
  assert.ok(RESERVED.includes('portal'));
});
test('reserved list matches the SQL migration', async () => {
  const fs = await import('node:fs');
  const sql = fs.readFileSync(new URL('../supabase/migrations/0001_init.sql', import.meta.url), 'utf8');
  const m = sql.match(/array\[([^\]]+)\]/)![1];
  const fromSql = [...m.matchAll(/'([a-z0-9-]+)'/g)].map((x) => x[1]).sort();
  assert.deepEqual([...RESERVED].sort(), fromSql);
});
test('password: 10 characters minimum, nothing else', () => {
  assert.equal(v.validatePassword('123456789').ok, false);
  assert.equal(v.validatePassword('1234567890').ok, true);
  assert.equal(v.validatePassword('a'.repeat(129)).ok, false);
});
test('indian mobile numbers', () => {
  for (const good of ['9876543210', '+91 98765 43210', '919876543210', '09876543210', '98765-43210'])
    assert.deepEqual(v.validateIndianMobile(good), { ok: true, value: '9876543210' }, good);
  for (const bad of ['5876543210', '98765', '98765432101', 'abcdefghij', '', '+1 9876543210']) assert.equal(v.validateIndianMobile(bad).ok, false, bad);
});
test('email, name, practice, profession, code, consent', () => {
  assert.deepEqual(v.validateEmail('  A@B.COM '), { ok: true, value: 'a@b.com' });
  assert.equal(v.validateEmail('nope').ok, false);
  assert.equal(v.validateFullName('A').ok, false);
  assert.deepEqual(v.validateFullName('  Asha   Rao '), { ok: true, value: 'Asha Rao' });
  assert.equal(v.validatePracticeName('x').ok, false);
  assert.equal(v.validateProfession('doctor').ok, true);
  assert.equal(v.validateProfession('astronaut').ok, false);
  assert.equal(v.validateOtpCode('12 34 56').ok, true);
  assert.equal(v.validateOtpCode('12345').ok, false);
  assert.equal(v.validateConsent(undefined).ok, false);
  assert.equal(v.validateConsent('on').ok, true);
  assert.equal(v.firstError(v.validateEmail('a@b.in'), v.validatePassword('short')), 'Use at least 10 characters.');
});
test('profession list matches the SQL check constraint', async () => {
  const fs = await import('node:fs');
  const sql = fs.readFileSync(new URL('../supabase/migrations/0001_init.sql', import.meta.url), 'utf8');
  const m = sql.match(/profession in\s*\(([^)]+)\)/)![1];
  const fromSql = [...m.matchAll(/'([a-z]+)'/g)].map((x) => x[1]).sort();
  assert.deepEqual(PROFESSIONS.map((p) => p.id).sort(), fromSql);
});
test('doctors and lawyers get ad blocks off by default', () => {
  assert.equal(adBlocksDefaultOff('doctor'), true);
  assert.equal(adBlocksDefaultOff('lawyer'), true);
  assert.equal(adBlocksDefaultOff('ca'), false);
});
test('free plan limits and annual price', () => {
  assert.equal(canAddClient('free', 4), true);
  assert.equal(canAddClient('free', 5), false);
  assert.equal(canAddAppointmentType('free', 1), false);
  assert.equal(canAddAppointmentType('solo', 99), true);
  assert.equal(canAddClient('practice', 100000), true);
  assert.equal(PLANS.free.customDomain, false);
  assert.equal(annualPriceInr('practice'), 9990);
});
test('otp: generate, check, expiry, lockout, reuse', () => {
  const code = generateCode();
  assert.match(code, /^\d{6}$/);
  const now = 1_000_000;
  const rec = { codeHash: hashCode(code, 'u1', '9876543210', 'pep'), expiresAt: now + OTP_TTL_MS, attempts: 0, consumedAt: null };
  assert.deepEqual(checkOtp(rec, code, 'u1', '9876543210', 'pep', now + 1000), { ok: true });
  const wrong = checkOtp(rec, code === '000000' ? '000001' : '000000', 'u1', '9876543210', 'pep', now);
  assert.deepEqual(wrong, { ok: false, reason: 'wrong', attemptsLeft: OTP_MAX_ATTEMPTS - 1 });
  assert.equal((checkOtp(rec, code, 'u2', '9876543210', 'pep', now) as any).reason, 'wrong');
  assert.equal((checkOtp(rec, code, 'u1', '9876543210', 'other-pepper', now) as any).reason, 'wrong');
  assert.equal((checkOtp(rec, code, 'u1', '9876543210', 'pep', now + OTP_TTL_MS + 1) as any).reason, 'expired');
  assert.equal((checkOtp({ ...rec, attempts: OTP_MAX_ATTEMPTS }, code, 'u1', '9876543210', 'pep', now) as any).reason, 'locked');
  assert.equal((checkOtp({ ...rec, consumedAt: now }, code, 'u1', '9876543210', 'pep', now) as any).reason, 'used');
  assert.equal((checkOtp(null, code, 'u1', '9876543210', 'pep', now) as any).reason, 'none');
});
test('otp resend timer and masking', () => {
  assert.equal(secondsUntilResend(null, 5000), 0);
  assert.equal(secondsUntilResend(10_000, 10_000 + 20_000), 40);
  assert.equal(secondsUntilResend(10_000, 10_000 + 61_000), 0);
  assert.equal(maskMobile('9876543210'), '+91 ••••• ••210');
});
