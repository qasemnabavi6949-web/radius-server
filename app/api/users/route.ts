import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDb();
    
    // لود کردن کاربران همراه با محاسبه مجموع حجم خروجی و ورودی امروز از جدول radacct رادیوس
    const users = await query(`
      SELECT 
        u.*,
        COALESCE(u.dataLimitString, '0.00 MB') as remainingStr,
        IFNULL(
          (
            SELECT CONCAT(ROUND(SUM(acctinputoctets + acctoutputoctets) / 1024 / 1024, 2), ' MB')
            FROM radacct
            WHERE username = u.username 
              AND acctstarttime >= DATE(NOW())
          ), 
          '0.00 MB'
        ) as daily_usage
      FROM dashboard_users u
      ORDER BY u.id DESC
    `);
    
    return NextResponse.json(users || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    
    const { 
      username, password, group, staticIp, 
      name, family, phone, email, address, nationalId, note 
    } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and Password are required' }, { status: 400 });
    }

    try {
      await query(`
        INSERT INTO dashboard_users 
          (username, password, \`group\`, staticIp, name, family, phone, email, address, nationalId, note, accountStatus) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
      `, [username, password, group || 'Default', staticIp || '', name || '', family || '', phone || '', email || '', address || '', nationalId || '', note || '']);
    } catch (dbErr) {
      await query(`
        INSERT INTO dashboard_users (username, password, \`group\`, staticIp, accountStatus) 
        VALUES (?, ?, ?, ?, 'Active')
      `, [username, password, group || 'Default', staticIp || '']);
    }

    await query(`
      INSERT INTO radcheck (username, attribute, op, value) 
      VALUES (?, 'Cleartext-Password', ':=', ?)
    `, [username, password]);

    if (group) {
      await query(`
        INSERT INTO radusergroup (username, groupname, priority) 
        VALUES (?, ?, 1)
      `, [username, group]);
    }

    if (staticIp) {
      await query(`
        INSERT INTO radcheck (username, attribute, op, value) 
        VALUES (?, 'Framed-IP-Address', '==', ?)
      `, [username, staticIp]);
    }

    return NextResponse.json({ success: true, message: 'User created successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
