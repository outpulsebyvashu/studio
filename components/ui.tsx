'use client';
import { useFormStatus } from 'react-dom';

export function SubmitButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={`btn full ${className}`} type="submit" disabled={pending} aria-busy={pending}>
      {pending ? 'Please wait…' : children}
    </button>
  );
}

export function Field(props: {
  label: string; name: string; type?: string; hint?: string; defaultValue?: string; placeholder?: string;
  autoComplete?: string; inputMode?: 'text' | 'numeric' | 'tel' | 'email'; maxLength?: number; required?: boolean;
}) {
  const id = `f-${props.name}`;
  return (
    <div className="f">
      <label htmlFor={id}>{props.label}</label>
      <input id={id} name={props.name} type={props.type ?? 'text'} defaultValue={props.defaultValue}
        placeholder={props.placeholder} autoComplete={props.autoComplete} inputMode={props.inputMode}
        maxLength={props.maxLength} required={props.required ?? true} aria-describedby={props.hint ? `${id}-h` : undefined} />
      {props.hint ? <small id={`${id}-h`}>{props.hint}</small> : null}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  return message ? <p role="alert" style={{ color: 'var(--bad)', margin: 0, fontSize: 14 }}>{message}</p> : null;
}
export function FormNote({ message }: { message?: string }) {
  return message ? <p role="status" className="mut" style={{ margin: 0 }}>{message}</p> : null;
}
