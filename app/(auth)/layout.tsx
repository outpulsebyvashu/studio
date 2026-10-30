import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <header className="top">
        <Link className="brandmark" href="/">outpulse <small>studio</small></Link>
        <span />
        <div className="end"><Link className="gl" href="/login">Help</Link></div>
      </header>
      <main className="auth"><div className="acard">{children}</div></main>
    </div>
  );
}
