'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { forgotAction } from '@/app/actions/auth';
import { Field, SubmitButton, FormError, FormNote } from '@/components/ui';

export default function ForgotPage() {
  const [state, action] = useActionState(forgotAction, undefined);
  return (
    <form action={action} style={{ display: 'contents' }}>
      <div><h1 style={{ fontSize: 28 }}>Reset your password</h1><p className="mut" style={{ marginTop: 6 }}>Enter your email and we will send a link.</p></div>
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <FormError message={state?.error} /><FormNote message={state?.note} />
      <SubmitButton>Send link</SubmitButton>
      <Link className="mut" style={{ textAlign: 'center' }} href="/login">Back to log in</Link>
    </form>
  );
}
