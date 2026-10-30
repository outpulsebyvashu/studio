import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';

const HEADS: { label: string; href?: string }[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Schedule' }, { label: 'Clients' }, { label: 'Documents' }, { label: 'Invoices' }, { label: 'Website' },
]; // items without href are built in later stages and shown as "Soon"

const ICONS: Record<string, string> = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  out: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
};
function Icon({ name }: { name: keyof typeof ICONS }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden dangerouslySetInnerHTML={{ __html: ICONS[name] }} />;
}

export function AppShell({ active, rail, children }: {
  active: string; rail: { label: string; href?: string; icon: keyof typeof ICONS; current?: boolean }[]; children: React.ReactNode;
}) {
  return (
    <div className="app">
      <header className="top">
        <Link className="brandmark" href="/dashboard">outpulse <small>studio</small></Link>
        <nav className="heads" aria-label="Main">
          {HEADS.map((h) => h.href
            ? <Link key={h.label} href={h.href} aria-current={h.label === active ? 'true' : 'false'}>{h.label}</Link>
            : <span key={h.label} className="soon" aria-disabled="true" title="Coming in a later stage" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 18px', borderRadius: 99 }}>{h.label}</span>)}
        </nav>
        <div className="end">
          <form action={logoutAction}><button className="gl" type="submit">Log out</button></form>
        </div>
      </header>
      <div className="shell">
        <nav className="rail" aria-label="Sections">
          <div className="mid">
            {rail.map((r) => (
              <Link key={r.label} className="rc" href={r.href ?? '#'} aria-current={r.current ? 'true' : 'false'}>
                <span className="c"><Icon name={r.icon} /></span>{r.label}
              </Link>
            ))}
          </div>
          <div className="bt">
            <span className="rc soon" aria-disabled="true"><span className="c"><Icon name="user" /></span>Profile</span>
            <span className="rc soon" aria-disabled="true"><span className="c"><Icon name="gear" /></span>Settings</span>
          </div>
        </nav>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
