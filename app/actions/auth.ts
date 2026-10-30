'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOtp, verifyOtp } from '@/lib/otp-server';
import { siteUrl } from '@/lib/env';
import { maskMobile } from '@/lib/otp';
import {
  validateFullName, validateEmail, validatePassword, validateIndianMobile, validateConsent,
  validateOtpCode, firstError, CURRENT_CONSENTS,
} from '@/lib/validation';

export type FormState = { error?: string; note?: string } | undefined;

export async function signupAction(_: FormState, fd: FormData): Promise<FormState> {
  const name = validateFullName(fd.get('name'));
  const email = validateEmail(fd.get('email'));
  const mobile = validateIndianMobile(fd.get('mobile'));
  const password = validatePassword(fd.get('password'));
  const consent = validateConsent(fd.get('consent'));
  const err = firstError(name, email, mobile, password, consent);
  if (err || !name.ok || !email.ok || !mobile.ok || !password.ok) return { error: err ?? 'Check the form.' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.value, password: password.value, options: { data: { full_name: name.value } },
  });
  if (error) {
    if (/registered|exists/i.test(error.message)) return { error: 'That email already has an account. Log in instead.' };
    return { error: 'We could not create your account. Try again.' };
  }
  if (!data.user) return { error: 'We could not create your account. Try again.' };
  if (!data.session) {
    return { error: 'Email confirmation is switched on in Supabase. Turn it off (Authentication, Sign In / Providers, Email) because mobile OTP verifies new accounts.' };
  }
  const admin = createAdminClient();
  const { error: upErr } = await admin.from('profiles').update({ mobile: mobile.value }).eq('id', data.user.id);
  if (upErr) return { error: 'We could not save your mobile number. Try again.' };
  await supabase.from('consents').insert(CURRENT_CONSENTS.map((c) => ({ user_id: data.user!.id, document: c.document, version: c.version })));
  const sent = await sendOtp(data.user.id, mobile.value);
  if (!sent.ok) return { error: sent.error };
  redirect('/verify');
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = validateEmail(fd.get('email'));
  const password = String(fd.get('password') ?? '');
  if (!email.ok) return { error: email.error };
  if (!password) return { error: 'Enter your password.' };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.value, password });
  if (error) return { error: 'Email or password is not right.' };
  redirect('/dashboard');
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function forgotAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = validateEmail(fd.get('email'));
  if (!email.ok) return { error: email.error };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.value, { redirectTo: `${siteUrl()}/auth/callback?next=/reset` });
  return { note: 'If that email has an account, a reset link is on its way. It works for 30 minutes.' };
}

export async function resetAction(_: FormState, fd: FormData): Promise<FormState> {
  const password = validatePassword(fd.get('password'));
  if (!password.ok) return { error: password.error };
  if (password.value !== String(fd.get('confirm') ?? '')) return { error: 'The two passwords do not match.' };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.value });
  if (error) return { error: 'We could not update your password. Open the reset link again.' };
  redirect('/dashboard');
}

export async function resendOtpAction(_: FormState): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: p } = await supabase.from('profiles').select('mobile').eq('id', user.id).single();
  if (!p?.mobile) redirect('/signup');
  const r = await sendOtp(user.id, p.mobile);
  return r.ok ? { note: `We sent a new code to ${maskMobile(p.mobile)}.` } : { error: r.error };
}

export async function verifyOtpAction(_: FormState, fd: FormData): Promise<FormState> {
  const code = validateOtpCode(fd.get('code'));
  if (!code.ok) return { error: code.error };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: p } = await supabase.from('profiles').select('mobile').eq('id', user.id).single();
  if (!p?.mobile) redirect('/signup');
  const r = await verifyOtp(user.id, p.mobile, code.value);
  if (!r.ok) {
    const msg = {
      none: 'No code was sent yet. Ask for a new one.',
      expired: 'That code has expired. Ask for a new one.',
      locked: 'Too many wrong tries. Ask for a new code.',
      used: 'That code was already used. Ask for a new one.',
      wrong: r.attemptsLeft !== undefined ? `That code is not right. ${r.attemptsLeft} tries left.` : 'That code is not right.',
    }[r.reason];
    return { error: msg };
  }
  redirect('/onboarding/1');
}
