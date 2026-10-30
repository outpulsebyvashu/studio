import Link from 'next/link';

export default function Welcome() {
  return (
    <div className="app">
      <header className="top"><span className="brandmark">outpulse <small>studio</small></span><span /><span /></header>
      <main className="auth"><div className="acard" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 28 }}>Your practice is ready</h1>
        <p className="mut">Next stages add your website, bookings, clients and invoices.</p>
        <Link className="btn full" href="/dashboard">Open dashboard</Link>
      </div></main>
    </div>
  );
}
