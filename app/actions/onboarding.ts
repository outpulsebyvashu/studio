'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { validatePracticeName, validateProfession, validateSlug, firstError } from '@/lib/validation';

const back = (step: number, msg: string): never => redirect(`/onboarding/${step}?e=${encodeURIComponent(msg)}`);

async function current() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: ob } = await supabase.from('onboarding_progress').select('workspace_id, step, data').maybeSingle();
  return { supabase, user, ob };
}
async function save(step: number, next: number, patch: Record<string, unknown>) {
  const { supabase, ob } = await current();
  if (!ob) redirect('/onboarding/1');
  if (ob.step < step) redirect(`/onboarding/${ob.step}`);
  const { error } = await supabase.from('onboarding_progress')
    .update({ step: Math.max(ob.step, next), data: { ...(ob.data as object), ...patch } }).eq('workspace_id', ob.workspace_id);
  if (error) back(step, 'We could not save that. Try again.');
}

export async function step1Action(fd: FormData) {
  const name = validatePracticeName(fd.get('name'));
  const slug = validateSlug(fd.get('slug'));
  const prof = validateProfession(fd.get('profession'));
  const err = firstError(name, slug, prof);
  if (err || !name.ok || !slug.ok || !prof.ok) return back(1, err ?? 'Check the form.');
  const { supabase, ob } = await current();
  if (ob) redirect('/onboarding/2'); // already created
  const { error } = await supabase.rpc('create_workspace', {
    p_name: name.value, p_slug: slug.value, p_profession: prof.value, p_city: String(fd.get('city') ?? '').slice(0, 60),
  });
  if (error) {
    if (/verify your mobile/i.test(error.message)) redirect('/verify');
    if (error.code === '23505') return back(1, 'That address is taken. Try another.');
    if (error.code === '23514') return back(1, 'That address is not allowed. Try another.');
    return back(1, 'We could not create your practice. Try again.');
  }
  redirect('/onboarding/2');
}

const TEMPLATES = ['t1', 't2', 't3', 't4', 't5', 't6', 't7'];
export async function step2Action(fd: FormData) {
  const style = String(fd.get('style') ?? '');
  if (!TEMPLATES.includes(style)) return back(2, 'Pick a style to continue.');
  await save(2, 3, { style });
  redirect('/onboarding/3');
}
const HOST = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
export async function step3Action(fd: FormData) {
  const d = String(fd.get('domain') ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (d && !HOST.test(d)) return back(3, 'That does not look like a domain, for example yourpractice.in');
  await save(3, 4, { wantedDomain: d || null });
  redirect('/onboarding/4');
}
export async function step4Action(fd: FormData) {
  const v = String(fd.get('clients') ?? '');
  if (!['import', 'manual', 'later'].includes(v)) return back(4, 'Choose one to continue.');
  await save(4, 5, { clients: v });
  redirect('/onboarding/5');
}
export async function step5Action(fd: FormData) {
  if (String(fd.get('plan') ?? 'free') !== 'free') return back(5, 'Paid plans open after billing is set up. Start on Free.');
  await save(5, 6, { plan: 'free' });
  redirect('/welcome');
}
