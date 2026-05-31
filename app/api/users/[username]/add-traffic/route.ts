import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export async function POST(req: Request, { params }: { params: any }) {
  try {
    await initDb();
    const resolvedParams = await params;
    const username = resolvedParams?.username;
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const body = await req.json();
    const trafficInput = parseFloat(body.traffic) || 0;
    const comment = body.comment || 'Traffic Added';

    if (trafficInput <= 0) return NextResponse.json({ error: 'Invalid traffic amount' }, { status: 400 });

    const userRows: any = await query('SELECT dataLimitBytes FROM dashboard_users WHERE username = ?', [username]);
    if (!userRows || userRows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const oldBytes = BigInt(userRows[0]?.dataLimitBytes || 0);
    const addedBytes = BigInt(Math.floor(trafficInput * 1024 * 1024));
    const totalBytes = oldBytes + addedBytes;
    
    const gigabytesValue = (Number(totalBytes) / (1024 * 1024 * 1024)).toFixed(2);
    const newLimitString = `${gigabytesValue} GB`;
    const radiusMegabytes = (Number(totalBytes) / (1024 * 1024)).toFixed(0);

    await query(
      'UPDATE dashboard_users SET dataLimitBytes = ?, dataLimitString = ?, accountStatus = "Active" WHERE username = ?',
      [totalBytes.toString(), newLimitString, username]
    );

    await query('DELETE FROM radcheck WHERE username = ? AND attribute = "Max-All-MB"', [username]);
    await query('INSERT INTO radcheck (username, attribute, op, value) VALUES (?, "Max-All-MB", ":=", ?)', [username, radiusMegabytes]);

    try {
      await query(
        'INSERT INTO dashboard_history (username, action, details, date) VALUES (?, "Add Traffic", ?, CURRENT_TIMESTAMP)',
        [username, `Added ${trafficInput} MB. Total: ${newLimitString}`]
      );
    } catch (hErr) {}

    return NextResponse.json({ success: true, message: 'Traffic updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
