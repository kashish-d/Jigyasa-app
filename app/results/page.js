'use client';
import { useEffect, useState } from 'react';
import { CATEGORIES } from '../../lib';

export default function Results() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const r = await fetch('/api', { cache: 'no-store' });
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (live) { setRows(d.rows); setError(false); setLoaded(true); }
      } catch { if (live) setError(true); }
    };
    load();
    const t = setInterval(load, 5000);
    return () => { live = false; clearInterval(t); };
  }, []);

  const n = rows.length;
  const stats = CATEGORIES.map((name, i) => {
    const total = rows.reduce((s, r) => s + (r.points[i] || 0), 0);
    const count = rows.filter((r) => r.points[i] > 0).length;
    return { name, total, count, avg: n ? total / n : 0, pct: n ? (count / n) * 100 : 0 };
  }).sort((a, b) => b.total - a.total);
  const max = Math.max(1, ...stats.map((s) => s.total));

  return (
    <main className="wrap wide">
      <header className="rhead">
        <div>
          <h1>Live results</h1>
          <p>Updates every 5 seconds{error ? ' · connection problem, retrying' : ''}</p>
        </div>
        <a className="dl" href="/api?export=1" download>Download Excel</a>
      </header>

      <section className="kpis">
        <div className="glass kpi"><b>{n}</b><span>submissions</span></div>
        <div className="glass kpi"><b>{n * 100}</b><span>points allocated</span></div>
        <div className="glass kpi"><b>8</b><span>categories</span></div>
      </section>

      <section className="glass panel">
        <h2>Category ranking</h2>
        {!loaded && !error ? <p className="muted">Loading…</p> : n === 0 ? <p className="muted">No submissions yet. They will appear here as people submit.</p> :
          stats.map((s, i) => (
            <div className="bar" key={s.name}>
              <div className="barhead">
                <span><b>{i + 1}.</b> {s.name}</span>
                <span className="muted">{s.total} pts · avg {s.avg.toFixed(1)} · {s.count} picked it ({s.pct.toFixed(0)}%)</span>
              </div>
              <div className="bartrack"><div className="barfill" style={{ width: (s.total / max) * 100 + '%' }} /></div>
            </div>
          ))}
      </section>

      <section className="glass panel">
        <h2>Individual responses</h2>
        <div className="scroll">
          <table>
            <thead><tr><th>Participant</th>{CATEGORIES.map((c) => <th key={c}>{c}</th>)}<th>Total</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  {r.points.map((p, i) => <td key={i}>{p > 0 ? p : ''}</td>)}
                  <td>{r.points.reduce((a, b) => a + b, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
