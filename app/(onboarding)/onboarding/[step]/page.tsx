import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PROFESSIONS } from '@/lib/professions';
import { NameAndSlug } from '@/components/SlugField';
import { step1Action, step2Action, step3Action, step4Action, step5Action } from '@/app/actions/onboarding';

const TITLES = ['About your practice', 'Pick a website style', 'Connect your domain', 'Bring your clients', 'Choose your plan'];
const SUBS = ['Tell us the basics.', 'You can change this later.', 'Use your own, or start on a free address.', 'Import now, add them one by one, or do it later.', 'Start free. Change any time.'];

export default async function Onboarding({ params, searchParams }: {
  params: Promise<{ step: string }>; searchParams: Promise<{ e?: string }>;
}) {
  const { step: raw } = await params;
  const { e } = await searchParams;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 5) redirect('/onboarding/1');
  const supabase = await createClient();
  const { data: ob } = await supabase.from('onboarding_progress').select('step, data, workspace_id').maybeSingle();
  if (!ob && n !== 1) redirect('/onboarding/1');
  if (ob && ob.step >= 6) redirect('/dashboard');
  if (ob && n === 1) redirect(`/onboarding/${Math.min(ob.step, 5)}`);
  if (ob && n > ob.step) redirect(`/onboarding/${ob.step}`);
  const { data: ws } = ob ? await supabase.from('workspaces').select('slug, name').eq('id', ob.workspace_id).single() : { data: null };
  const data = (ob?.data ?? {}) as Record<string, string | null>;

  return (
    <div className="app">
      <header className="top"><span className="brandmark">outpulse <small>studio</small></span><span /><span /></header>
      <main className="auth"><div className="acard wide">
        <div className="steps" aria-hidden>{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= n ? 'on' : ''} />)}</div>
        <div><div className="mut">Step {n} of 5</div><h1 style={{ fontSize: 28, marginTop: 4 }}>{TITLES[n - 1]}</h1><p className="mut" style={{ marginTop: 6 }}>{SUBS[n - 1]}</p></div>
        {e ? <p role="alert" style={{ color: 'var(--bad)', margin: 0, fontSize: 14 }}>{e}</p> : null}

        {n === 1 && (
          <form action={step1Action} style={{ display: 'contents' }}>
            <NameAndSlug />
            <div className="f"><label htmlFor="f-prof">Profession</label>
              <select id="f-prof" name="profession" required defaultValue="">
                <option value="" disabled>Choose one</option>
                {PROFESSIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select></div>
            <div className="f"><label htmlFor="f-city">City</label><input id="f-city" name="city" maxLength={60} placeholder="Mysuru" /></div>
            <button className="btn full" type="submit">Continue</button>
          </form>
        )}
        {n === 2 && (
          <form action={step2Action} style={{ display: 'contents' }}>
            <div className="tplgrid" role="radiogroup" aria-label="Website style">
              {['t1', 't2', 't3', 't4', 't5', 't6', 't7'].map((t, i) => (
                <label className="opt" key={t}><input type="radio" name="style" value={t} defaultChecked={(data.style ?? 't1') === t} />
                  <span className="thumb" /><span>Style {i + 1}</span></label>
              ))}
            </div>
            <button className="btn full" type="submit">Continue</button>
          </form>
        )}
        {n === 3 && (
          <form action={step3Action} style={{ display: 'contents' }}>
            <div className="f"><label>Your free address</label><input readOnly value={`${ws?.slug ?? 'yourname'}.outpulse.studio`} /></div>
            <div className="f"><label htmlFor="f-domain">Your own domain (optional)</label>
              <input id="f-domain" name="domain" placeholder="yourpractice.in" defaultValue={data.wantedDomain ?? ''} />
              <small>Own domains come with the Practice plan. We save it so we can connect it later.</small></div>
            <button className="btn full" type="submit">Continue</button>
          </form>
        )}
        {n === 4 && (
          <form action={step4Action} style={{ display: 'contents' }}>
            {[['import', 'Import a spreadsheet', 'CSV or Excel'], ['manual', 'Add them one by one', 'From the Clients page'], ['later', 'Do it later', 'You can skip this']].map(([v, t, s]) => (
              <label className="opt" key={v}><input type="radio" name="clients" value={v} defaultChecked={(data.clients ?? 'later') === v} /><span><b>{t}</b><small>{s}</small></span></label>
            ))}
            <button className="btn full" type="submit">Continue</button>
          </form>
        )}
        {n === 5 && (
          <form action={step5Action} style={{ display: 'contents' }}>
            <label className="opt"><input type="radio" name="plan" value="free" defaultChecked /><span><b>Free</b><small>5 clients, 1 appointment type, free address</small></span></label>
            {[['solo', 'Solo', '₹499 a month'], ['practice', 'Practice', '₹999 a month'], ['studio', 'Studio', '₹2,499 a month']].map(([v, t, s]) => (
              <label className="opt" key={v} aria-disabled="true"><input type="radio" name="plan" value={v} disabled /><span><b>{t}</b><small>{s}. Opens after billing is set up.</small></span></label>
            ))}
            <button className="btn full" type="submit">Finish setup</button>
          </form>
        )}
        {n > 1 ? <Link className="mut" style={{ textAlign: 'center' }} href={`/onboarding/${n - 1}`}>Back</Link> : null}
      </div></main>
    </div>
  );
}
