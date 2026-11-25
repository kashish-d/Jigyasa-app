import * as XLSX from 'xlsx';
import { getSql, CATEGORIES } from '../../lib';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Save a submission
export async function POST(req) {
  try {
    const { name, points } = await req.json();
    if (!name?.trim() || !Array.isArray(points) || points.length !== 8) {
      return Response.json({ error: 'Invalid submission' }, { status: 400 });
    }
    const sql = await getSql();
    await sql`INSERT INTO submissions (name, points)
              VALUES (${name.trim().slice(0, 60)}, ${JSON.stringify(points)}::jsonb)`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

// Results as JSON, or an Excel file when called with ?export=1
export async function GET(req) {
  try {
    const sql = await getSql();
    const rows = await sql`SELECT id, name, points, submitted_at FROM submissions ORDER BY submitted_at ASC`;
    if (new URL(req.url).searchParams.get('export') !== '1') {
      return Response.json({ rows }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const n = rows.length;
    const sheet1 = [['Participant', ...CATEGORIES]];
    rows.forEach((r) => sheet1.push([r.name, ...r.points.map((p) => (p > 0 ? p : ''))]));
    const stats = CATEGORIES.map((name, i) => {
      const total = rows.reduce((s, r) => s + (r.points[i] || 0), 0);
      const count = rows.filter((r) => r.points[i] > 0).length;
      return { name, total, count, avg: n ? +(total / n).toFixed(1) : 0, pct: n ? +((count / n) * 100).toFixed(1) : 0 };
    }).sort((a, b) => b.total - a.total);
    const sheet2 = [['Rank', 'Category', 'Total points', 'Average points per participant', 'Participants who selected it', '% of participants'],
      ...stats.map((s, i) => [i + 1, s.name, s.total, s.avg, s.count, s.pct + '%'])];
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet(sheet1);
    ws1['!cols'] = [{ wch: 24 }, ...CATEGORIES.map(() => ({ wch: 18 }))];
    const ws2 = XLSX.utils.aoa_to_sheet(sheet2);
    ws2['!cols'] = [{ wch: 8 }, { wch: 24 }, { wch: 14 }, { wch: 30 }, { wch: 28 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Individual Responses');
    XLSX.utils.book_append_sheet(wb, ws2, 'Category Summary');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="priorities.xlsx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
