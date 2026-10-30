import 'server-only';
import { createAdminClient } from './supabase/admin.ts';
import { required } from './env.ts';
import { sendSms } from './sms.ts';
import { generateCode, hashCode, checkOtp, secondsUntilResend, OTP_TTL_MS, OTP_DAILY_LIMIT, type OtpCheck } from './otp.ts';

export async function sendOtp(userId: string, mobile: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = createAdminClient();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: recent } = await db.from('otp_codes').select('created_at').eq('user_id', userId)
    .gte('created_at', since).order('created_at', { ascending: false });
  const last = recent?.[0] ? Date.parse(recent[0].created_at) : null;
  const wait = secondsUntilResend(last, Date.now());
  if (wait > 0) return { ok: false, error: `Please wait ${wait} seconds before asking for another code.` };
  if ((recent?.length ?? 0) >= OTP_DAILY_LIMIT) return { ok: false, error: 'Too many codes today. Try again tomorrow or contact support.' };
  const code = generateCode();
  const row = {
    user_id: userId, mobile,
    code_hash: hashCode(code, userId, mobile, required('OTP_PEPPER')),
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  };
  const { error } = await db.from('otp_codes').insert(row);
  if (error) return { ok: false, error: 'Could not create a code. Try again.' };
  try { await sendSms(mobile, `Your outpulse studio code is ${code}. It expires in 10 minutes.`); }
  catch { return { ok: false, error: 'We could not send the SMS. Try again in a minute.' }; }
  return { ok: true };
}

export async function verifyOtp(userId: string, mobile: string, code: string): Promise<OtpCheck> {
  const db = createAdminClient();
  const { data } = await db.from('otp_codes').select('*').eq('user_id', userId).eq('mobile', mobile)
    .order('created_at', { ascending: false }).limit(1);
  const r = data?.[0];
  const rec = r ? { codeHash: r.code_hash, expiresAt: Date.parse(r.expires_at), attempts: r.attempts, consumedAt: r.consumed_at ? Date.parse(r.consumed_at) : null } : null;
  const result = checkOtp(rec, code, userId, mobile, required('OTP_PEPPER'), Date.now());
  if (!r) return result;
  if (result.ok) {
    await db.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', r.id);
    const { error } = await db.from('profiles').update({ mobile, mobile_verified_at: new Date().toISOString() }).eq('id', userId);
    if (error) return { ok: false, reason: 'wrong' }; // most likely: this number is already verified on another account
  } else if (result.reason === 'wrong') {
    await db.from('otp_codes').update({ attempts: r.attempts + 1 }).eq('id', r.id);
  }
  return result;
}
