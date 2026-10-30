'use client';
import { useActionState } from 'react';
import { resetAction } from '@/app/actions/auth';
import { Field, SubmitButton, FormError } from '@/components/ui';

export default function ResetPage() {
  const [state, action] = useActionState(resetAction, undefined);
  return (
    <form action={action} style={{ display: 'contents' }}>
      <div><h1 style={{ fontSize: 28 }}>Choose a new password</h1></div>
      <Field label="New password" name="password" type="password" autoComplete="new-password" hint="At least 10 characters." />
      <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" />
      <FormError message={state?.error} />
      <SubmitButton>Update password</SubmitButton>
    </form>
  );
}
