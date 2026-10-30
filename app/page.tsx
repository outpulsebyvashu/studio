import Link from 'next/link';

// Placeholder. The full marketing site is built in Stage 7.
export default function Home() {
  return (
    <div className="app">
      <header className="top">
        <span className="brandmark">outpulse <small>studio</small></span>
        <span />
        <div className="end">
          <Link className="gl" href="/login">Log in</Link>
          <Link className="gl dk" href="/signup">Get started</Link>
        </div>
      </header>
      <main className="hero">
        <h1>Your practice. Your clients. Your time.</h1>
        <p className="lead">One workspace for your website, bookings, client portal and invoices.</p>
        <Link className="btn lg" href="/signup">Start free</Link>
      </main>
    </div>
  );
}
