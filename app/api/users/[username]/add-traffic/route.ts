import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export async function POST(req: Request, { params }: { params: any }) {
  try {
    await initDb();
    const resolvedParams = await params;
    const username = resolvedParams?.username;
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const body = await req.json();
    const trafficMB = parseFloat(body.traffic || "0");
    if (trafficMB <= 0) return NextResponse.json({ error: 'Invalid traffic amount' }, { status: 400 });

    const addedBytes = trafficMB * 1024 * 1024;

    const userRows = await query("SELECT dataLimitBytes, dashboard_users.group FROM dashboard_users WHERE username = ?", [username]);
    const currentUser = (userRows as any)?.[0];
    
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const currentLimitBytes = parseFloat(currentUser.dataLimitBytes || "0");
    const newLimitBytes = currentLimitBytes + addedBytes;
    const newLimitString = `${(newLimitBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;

    await query(
      "UPDATE dashboard_users SET dataLimitBytes = ?, dataLimitString = ?, accountStatus = 'Active' WHERE username = ?",
      [newLimitBytes, newLimitString, username]
    );

    await query("DELETE FROM radreply WHERE username = ? AND attribute IN ('Mikrotik-Total-Limit-Bytes', 'Mikrotik-Xmit-Limit')", [username]);
    await query("INSERT INTO radreply (username, attribute, op, value) VALUES (?, 'Mikrotik-Total-Limit-Bytes', ':=', ?)", [username, newLimitBytes.toString()]);
    await query("INSERT INTO radreply (username, attribute, op, value) VALUES (?, 'Mikrotik-Xmit-Limit', ':=', ?)", [username, newLimitBytes.toString()]);
    await query("DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type' AND value = 'Reject'", [username]);

    const detailsLog = `Added ${trafficMB} MB traffic manually. Total limit expanded to ${newLimitString}`;
    await query(
      "INSERT INTO dashboard_history (username, action, details, created_at) VALUES (?, 'Add Traffic', ?, NOW())",
      [username, detailsLog]
    );

    return NextResponse.json({ success: true, message: 'Traffic extended and documented.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
