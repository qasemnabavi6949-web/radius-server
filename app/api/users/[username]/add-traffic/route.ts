import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: any }) {
  try {
    await initDb();
    const resolvedParams = await params;
    const username = resolvedParams?.username;
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const body = await req.json();
    const amountMb = parseFloat(body.traffic) || 0;
    const addedBytes = amountMb * 1024 * 1024;

    await query(`UPDATE dashboard_users SET dataLimitBytes = dataLimitBytes + ?, accountStatus = 'Active' WHERE username = ?`, [addedBytes, username]);
    
    const updatedRows: any = await query(`SELECT dataLimitBytes FROM dashboard_users WHERE username = ?`, [username]);
    if (updatedRows && updatedRows.length > 0) {
      const freshBytes = parseFloat(updatedRows[0]?.dataLimitBytes || '0');
      const freshString = `${(freshBytes / 1024 / 1024).toFixed(2)} MB`;
      await query(`UPDATE dashboard_users SET dataLimitString = ? WHERE username = ?`, [freshString, username]);
    }

    await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type' AND value = 'Reject'`, [username]);
    await query(`UPDATE radacct SET acctstoptime = NOW() WHERE username = ? AND acctstoptime IS NULL`, [username]);

    try {
      await query(`INSERT INTO dashboard_activations (username, created_at) VALUES (?, CURRENT_TIMESTAMP)`, [username]);
    } catch (e) {}

    return NextResponse.json({ success: true, message: 'Traffic updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
