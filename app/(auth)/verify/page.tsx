'use client';
import { useActionState } from 'react';
import { verifyOtpAction, resendOtpAction } from '@/app/actions/auth';
import { Field, SubmitButton, FormError, FormNote } from '@/components/ui';

export default function VerifyPage() {
  const [state, action] = useActionState(verifyOtpAction, undefined);
  const [resend, resendAction] = useActionState(resendOtpAction, undefined);
  return (
    <>
      <div><h1 style={{ fontSize: 28 }}>Enter your code</h1><p className="mut" style={{ marginTop: 6 }}>We sent a 6 digit code by SMS.</p></div>
      <form action={action} style={{ display: 'contents' }}>
        <Field label="6 digit code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} placeholder="123456" />
        <FormError message={state?.error} />
        <SubmitButton>Verify</SubmitButton>
      </form>
      <form action={resendAction} style={{ display: 'contents' }}>
        <FormError message={resend?.error} /><FormNote message={resend?.note} />
        <button className="btn s full" type="submit">Send a new code</button>
      </form>
    </>
  );
}
