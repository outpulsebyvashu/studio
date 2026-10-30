'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { signupAction } from '@/app/actions/auth';
import { Field, SubmitButton, FormError } from '@/components/ui';

export default function SignupPage() {
  const [state, action] = useActionState(signupAction, undefined);
  return (
    <form action={action} style={{ display: 'contents' }}>
      <div><h1 style={{ fontSize: 28 }}>Create your practice</h1><p className="mut" style={{ marginTop: 6 }}>Free to start. No card needed.</p></div>
      <Field label="Your name" name="name" autoComplete="name" placeholder="Full name" />
      <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@email.com" />
      <Field label="Mobile number" name="mobile" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="10 digit number" hint="We send a code to confirm it." />
      <Field label="Password" name="password" type="password" autoComplete="new-password" hint="At least 10 characters." />
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400 }}>
        <input type="checkbox" name="consent" style={{ width: 20, height: 20, marginTop: 2, minHeight: 0 }} />
        <span className="mut">I accept the Terms and Privacy Policy, including the Data Processing Addendum for my clients' data.</span>
      </label>
      <FormError message={state?.error} />
      <SubmitButton>Create account</SubmitButton>
      <p className="mut" style={{ textAlign: 'center' }}>Have an account? <Link href="/login"><b>Log in</b></Link></p>
    </form>
  );
}
