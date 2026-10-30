import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/Shell';
import { PLANS, type PlanId } from '@/lib/plans';
import { PROFESSIONS } from '@/lib/professions';

export const metadata = { title: 'Dashboard' };

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user!.id).single();
  const { data: ws } = await supabase.from('workspaces').select('name, slug, plan, profession').single();
  const { data: ob } = await supabase.from('onboarding_progress').select('data').single();
  const plan = PLANS[(ws?.plan ?? 'free') as PlanId];
  const prof = PROFESSIONS.find((p) => p.id === ws?.profession)?.label ?? '';
  const data = (ob?.data ?? {}) as Record<string, string | null>;
  const hour = new Date().getUTCHours() + 5.5; // India time, good enough for a greeting
  const greet = hour % 24 < 12 ? 'Good morning' : hour % 24 < 17 ? 'Good afternoon' : 'Good evening';
  const first = (profile?.full_name ?? '').split(' ')[0];

  const steps: [string, boolean][] = [
    ['Practice created', true], ['Website style chosen', Boolean(data.style)], ['Mobile number verified', true],
    ['Add your first appointment type', false], ['Add your first client', false], ['Publish your website', false],
  ];
  return (
    <AppShell active="Dashboard" rail={[{ label: 'Overview', icon: 'overview', current: true }]}>
      <header className="hd">
        <div><h1>{greet}{first ? `, ${first}` : ''}</h1><div className="mut" style={{ marginTop: 4 }}>{ws?.name} · {prof}</div></div>
        <span className="pill on">{plan.label} plan</span>
      </header>
      <section className="stats">
        {[['0', 'Appointments today'], ['0', 'New enquiries'], ['0', 'Clients'], ['₹0', 'Unpaid invoices']].map(([v, l]) => (
          <div className="stat" key={l}><b>{v}</b><span>{l}</span></div>
        ))}
      </section>
      <div className="row">
        <section className="card" style={{ flex: '3 1 380px' }}>
          <div className="ch"><div><h2>Getting started</h2><div className="mut">Bookings, clients and invoices arrive in the next stages.</div></div></div>
          <ul className="checklist">
            {steps.map(([t, done]) => (<li key={t}><span className={`dot${done ? ' on' : ''}`} aria-hidden>{done ? '✓' : ''}</span><span>{t}</span></li>))}
          </ul>
        </section>
        <section className="card pad" style={{ flex: '2 1 300px' }}>
          <h2>Your address</h2>
          <p className="mut" style={{ margin: '6px 0 12px' }}>Your free website address</p>
          <b>{ws?.slug}.outpulse.studio</b>
          <p className="mut" style={{ marginTop: 14 }}>Free plan: {plan.clients} clients, {plan.appointmentTypes} appointment type.</p>
        </section>
      </div>
    </AppShell>
  );
}
