import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: any }) {
  try {
    await initDb();
    const resolvedParams = await params;
    const username = resolvedParams?.username;
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const userRows: any = await query(`SELECT \`group\` FROM dashboard_users WHERE username = ?`, [username]);
    if (!userRows || userRows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const userGroup = userRows?.[0]?.group || userRows?.group;

    let profileBytes = 10 * 1024 * 1024;
    let profileString = '10.00 MB';

    if (userGroup) {
      const profileRows: any = await query(`SELECT totalTraffic FROM dashboard_profiles WHERE name = ?`, [userGroup]);
      const alloc = profileRows?.[0]?.totalTraffic || profileRows?.totalTraffic;
      if (alloc) {
        profileBytes = parseFloat(alloc) * 1024 * 1024;
        profileString = `${parseFloat(alloc).toFixed(2)} MB`;
      }
    }

    const next30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await query(`UPDATE dashboard_users SET dataLimitBytes = ?, dataLimitString = ?, daily_usage = '0.00 MB', daily_traffic = '0.00 MB', accountStatus = 'Active', expiration = ?, chargedAt = CURRENT_TIMESTAMP WHERE username = ?`, [profileBytes, profileString, next30Days, username]);
    await query(`DELETE FROM radacct WHERE username = ?`, [username]);
    await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type' AND value = 'Reject'`, [username]);

    return NextResponse.json({ success: true, message: 'Package renewed successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
