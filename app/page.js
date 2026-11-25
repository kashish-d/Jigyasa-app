'use client';
import { useEffect, useState } from 'react';
import { CATEGORIES } from '../lib';

const R = 62, C = 2 * Math.PI * R;

export default function Home() {
  const [status, setStatus] = useState('loading');
  const [name, setName] = useState('');
  const [pts, setPts] = useState(Array(8).fill(0));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let done = false;
    try { done = localStorage.getItem('hasSubmitted') === 'true'; } catch {}
    setStatus(done ? 'done' : 'form');
  }, []);

  const total = pts.reduce((a, b) => a + b, 0);
  const remaining = 100 - total;
  const selected = pts.filter((p) => p > 0).length;
  const valid = name.trim().length > 0 && selected === 3 && total === 100;

  function setPt(i, raw) {
    let v = Math.max(0, Math.floor(Number(raw) || 0));
    if (pts[i] === 0 && v > 0 && selected >= 3) return;
    v = Math.min(v, 100 - (total - pts[i]));
    setPts(pts.map((p, j) => (j === i ? v : p)));
  }

  async function submit() {
    if (!valid || busy) return;
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), points: pts }),
      });
      if (!res.ok) throw new Error();
      try { localStorage.setItem('hasSubmitted', 'true'); } catch {}
      setStatus('done');
    } catch {
      setErr("We couldn't save your answer. Check your connection and tap Submit again.");
    }
    setBusy(false);
  }

  if (status === 'loading') return <main className="wrap" />;

  if (status === 'done') {
    return (
      <main className="wrap center">
        <div className="glass thanks pop">
          <div className="check">✓</div>
          <h1>Thank you!</h1>
          <p>Your priorities have been recorded.</p>
        </div>
      </main>
    );
  }

  const hint = selected < 3
    ? `Pick ${3 - selected} more ${3 - selected === 1 ? 'priority' : 'priorities'}.`
    : remaining > 0 ? `Place the last ${remaining} points.` : 'All 100 points placed. Ready to submit.';

  return (
    <main className="wrap">
      <header className="hero">
        <div className="titles">
          <h1>What matters most to you?</h1>
          <p>Spread 100 points across exactly 3 of the 8 priorities below. Each one needs at least 1 point.</p>
          <input className="name glass" placeholder="Your name or nickname" value={name} maxLength={60}
            onChange={(e) => setName(e.target.value)} aria-label="Your name or nickname" />
        </div>
        <div className="ring glass" aria-live="polite">
          <svg viewBox="0 0 150 150">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#a78bfa" /><stop offset="1" stopColor="#f472b6" />
              </linearGradient>
            </defs>
            <circle cx="75" cy="75" r={R} className="track" />
            <circle cx="75" cy="75" r={R} className="arc" style={{ strokeDasharray: C, strokeDashoffset: C * (remaining / 100) }} />
          </svg>
          <div className="num"><b>{remaining}</b><span>points left</span></div>
        </div>
      </header>

      <section className="grid">
        {CATEGORIES.map((c, i) => {
          const locked = pts[i] === 0 && selected >= 3;
          return (
            <div key={c} className={`card glass ${pts[i] > 0 ? 'on' : ''} ${locked ? 'locked' : ''}`}>
              <div className="row">
                <label htmlFor={`n${i}`}>{c}</label>
                <input id={`n${i}`} type="number" inputMode="numeric" min="0" max="100" placeholder="0"
                  value={pts[i] || ''} disabled={locked} onChange={(e) => setPt(i, e.target.value)} />
              </div>
              <input type="range" min="0" max="100" step="1" value={pts[i]} disabled={locked}
                style={{ '--p': pts[i] + '%' }} onChange={(e) => setPt(i, e.target.value)} aria-label={`${c} points`} />
            </div>
          );
        })}
      </section>

      <footer className="dock glass">
        <div className="dockinfo">
          <strong>{selected}/3 selected</strong>
          <span>{err ? <em>{err}</em> : hint}</span>
        </div>
        <button disabled={!valid || busy} onClick={submit}>{busy ? 'Saving…' : 'Submit my priorities'}</button>
      </footer>
    </main>
  );
}
