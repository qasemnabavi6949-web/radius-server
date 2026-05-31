import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    const rows = await query('SELECT * FROM dashboard_users ORDER BY id DESC');
    return NextResponse.json(rows || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    
    const username = body.username || '';
    const password = body.password || '';
    const firstName = body.firstName || body.firstname || body.name || '';
    const lastName = body.lastName || body.lastname || body.family || '';
    const phone = body.phone || '';
    const email = body.email || '';
    const address = body.address || '';
    const nationalId = body.nationalId || body.nationalid || '';
    const staticIp = body.staticIp || body.staticip || '';
    const expiration = body.expiration || '';
    const group = body.group || body.profile || '';

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and Password required' }, { status: 400 });
    }

    const finalExpiration = expiration && expiration !== '' ? expiration : '2026-12-31';

    await query(
      `INSERT INTO dashboard_users (username, password, firstName, lastName, phone, email, address, staticIp, expiration, \`group\`, status, accountStatus, dataLimitBytes, dataLimitString, daily_traffic, daily_usage, balance) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Offline', 'Active', 0, '0.00 GB', '0 MB', '0.00 MB', '0 ؋')`,
      [username, password, firstName, lastName, phone, email, address, staticIp, finalExpiration, group]
    );

    await query(
      `INSERT INTO radcheck (username, attribute, op, value) VALUES (?, 'Cleartext-Password', ':=', ?)`,
      [username, password]
    );

    if (staticIp !== '') {
      await query('DELETE FROM radreply WHERE username = ? AND attribute = "Framed-IP-Address"', [username]);
      await query(
        `INSERT INTO radreply (username, attribute, op, value) VALUES (?, 'Framed-IP-Address', '==', ?)`,
        [username, staticIp]
      );
    }

    if (group !== '') {
      await query('DELETE FROM radusergroup WHERE username = ?', [username]);
      await query(
        `INSERT INTO radusergroup (username, groupname, priority) VALUES (?, ?, 1)`,
        [username, group]
      );
    }

    if (finalExpiration && finalExpiration !== '2026-12-31') {
      const formattedDate = new Date(finalExpiration);
      if (!isNaN(formattedDate.getTime())) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const radiusDate = `${formattedDate.getDate().toString().padStart(2, '0')} ${months[formattedDate.getMonth()]} ${formattedDate.getFullYear()}`;
        await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Expiration'`, [username]);
        await query(`INSERT INTO radcheck (username, attribute, op, value) VALUES (?, 'Expiration', '==', ?)`, [username, radiusDate]);
      }
    }

    try {
      await query(
        'INSERT INTO dashboard_history (username, action, details, date) VALUES (?, "Create User", "User created with complete profile information", CURRENT_TIMESTAMP)',
        [username]
      );
    } catch (hErr) {}

    return NextResponse.json({ success: true, message: 'User created successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
