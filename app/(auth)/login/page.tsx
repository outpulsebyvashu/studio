'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { Field, SubmitButton, FormError } from '@/components/ui';

export default function LoginPage() {
  const [state, action] = useActionState(loginAction, undefined);
  return (
    <form action={action} style={{ display: 'contents' }}>
      <div><h1 style={{ fontSize: 28 }}>Welcome back</h1><p className="mut" style={{ marginTop: 6 }}>Log in to your practice.</p></div>
      <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@email.com" />
      <Field label="Password" name="password" type="password" autoComplete="current-password" />
      <FormError message={state?.error} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><Link className="mut" href="/forgot">Forgot password?</Link></div>
      <SubmitButton>Log in</SubmitButton>
      <p className="mut" style={{ textAlign: 'center' }}>New here? <Link href="/signup"><b>Create an account</b></Link></p>
    </form>
  );
}
