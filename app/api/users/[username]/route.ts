import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: any }) {
  try {
    await initDb();
    const resolvedParams = await params;
    const username = resolvedParams?.username;
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const body = await req.json();
    const { password, group, staticIp, name, family, phone, email, address, nationalId, note, expiration, accountStatus } = body;

    await query(
      `UPDATE dashboard_users SET 
        password = COALESCE(?, password), 
        \`group\` = COALESCE(?, \`group\`), 
        staticIp = COALESCE(?, staticIp), 
        firstName = COALESCE(?, firstName), 
        lastName = COALESCE(?, lastName), 
        phone = COALESCE(?, phone), 
        email = COALESCE(?, email), 
        address = COALESCE(?, address), 
        nationalId = COALESCE(?, nationalId), 
        note = COALESCE(?, note), 
        expiration = COALESCE(?, expiration),
        accountStatus = COALESCE(?, accountStatus)
       WHERE username = ?`,
      [password, group, staticIp, name, family, phone, email, address, nationalId, note, expiration, accountStatus, username]
    );

    if (password) {
      await query("UPDATE radcheck SET value = ? WHERE username = ? AND attribute = 'Cleartext-Password'", [password, username]);
    }
    if (accountStatus) {
      await query("UPDATE radcheck SET value = ? WHERE username = ? AND attribute = 'Auth-Type'", [accountStatus === 'Disabled' ? 'Reject' : 'Local', username]);
    }

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: any }) {
  try {
    await initDb();
    const resolvedParams = await params;
    const username = resolvedParams?.username;
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    // پاکسازی کامل کاربر از جدول وب و تمام جداول فری رادیوس
    await query('DELETE FROM dashboard_users WHERE username = ?', [username]);
    await query('DELETE FROM radcheck WHERE username = ?', [username]);
    await query('DELETE FROM radreply WHERE username = ?', [username]);
    await query('DELETE FROM radusergroup WHERE username = ?', [username]);

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
