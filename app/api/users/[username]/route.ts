import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: any }) {
  try {
    await initDb();
    const resolvedParams = await params;
    const username = resolvedParams?.username;
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const body = await req.json();
    
    const password = body.password !== undefined ? body.password : null;
    const group = (body.group || body.profile) !== undefined ? (body.group || body.profile) : null;
    const staticIp = body.staticIp !== undefined ? body.staticIp : null;
    const firstName = (body.name || body.firstName) !== undefined ? (body.name || body.firstName) : null;
    const lastName = (body.family || body.lastName) !== undefined ? (body.family || body.lastName) : null;
    const phone = body.phone !== undefined ? body.phone : null;
    const email = body.email !== undefined ? body.email : null;
    const address = body.address !== undefined ? body.address : null;
    const expiration = body.expiration !== undefined ? body.expiration : null;
    const accountStatus = body.accountStatus !== undefined ? body.accountStatus : null;

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
        expiration = COALESCE(?, expiration),
        accountStatus = COALESCE(?, accountStatus)
       WHERE username = ?`,
      [password, group, staticIp, firstName, lastName, phone, email, address, expiration, accountStatus, username]
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

    await query('DELETE FROM dashboard_users WHERE username = ?', [username]);
    await query('DELETE FROM radcheck WHERE username = ?', [username]);
    await query('DELETE FROM radreply WHERE username = ?', [username]);
    await query('DELETE FROM radusergroup WHERE username = ?', [username]);

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
