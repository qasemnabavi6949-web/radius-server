import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';
import { exec } from 'child_process';

function sendRadiusDisconnect(username: string, nasIp: string) {
  const secret = 'testing123'; 
  const cmd = `echo "User-Name=${username}" | radclient -x ${nasIp}:3799 disconnect ${secret}`;
  exec(cmd, (err, stdout, stderr) => {});
}

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

    if (password && password !== "" && password !== null) {
      await query("UPDATE radcheck SET value = ? WHERE username = ? AND attribute = 'Cleartext-Password'", [password, username]);
    }
    
    if (group && group !== "") {
      await query("DELETE FROM radreply WHERE username = ? AND attribute IN ('Mikrotik-Total-Limit', 'Mikrotik-Total-Limit-Bytes', 'Mikrotik-Xmit-Limit', 'Acct-Interim-Interval', 'Session-Timeout')", [username]);
      
      const normalizedGroup = group.toString().toLowerCase();
      let totalMaxBytes = 10 * 1024 * 1024; 

      if (normalizedGroup.includes('100gb')) {
         totalMaxBytes = 100 * 1024 * 1024 * 1024;
      } else if (normalizedGroup.includes('100mb') || normalizedGroup.includes('100 m')) {
         totalMaxBytes = 100 * 1024 * 1024;
      } else if (normalizedGroup.includes('10mb') || normalizedGroup.includes('10 m')) {
         totalMaxBytes = 10 * 1024 * 1024;
      }

      const usageRows = await query(
        "SELECT COALESCE(SUM(acctinputoctets) + SUM(acctoutputoctets), 0) AS total_used FROM radacct WHERE username = ?",
        [username]
      );
      const totalUsedBytes = parseFloat((usageRows as any)?.total_used || "0");
      const remainingBytes = totalMaxBytes - totalUsedBytes;

      if (remainingBytes <= 0) {
        await query("DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type'", [username]);
        await query("INSERT INTO radcheck (username, attribute, op, value) VALUES (?, 'Auth-Type', ':=', 'Reject')", [username]);
        sendRadiusDisconnect(username, '100.100.100.10');
      } else {
        await query("DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type' AND value = 'Reject'", [username]);
        await query("INSERT INTO radreply (username, attribute, op, value) VALUES (?, 'Mikrotik-Total-Limit-Bytes', ':=', ?)", [username, remainingBytes.toString()]);
        await query("INSERT INTO radreply (username, attribute, op, value) VALUES (?, 'Mikrotik-Xmit-Limit', ':=', ?)", [username, remainingBytes.toString()]);
        await query("INSERT INTO radreply (username, attribute, op, value) VALUES (?, 'Acct-Interim-Interval', ':=', '60')", [username]);
      }
    }

    if (accountStatus) {
      await query("DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type'", [username]);
      if (accountStatus === 'Disabled') {
        await query("INSERT INTO radcheck (username, attribute, op, value) VALUES (?, 'Auth-Type', ':=', 'Reject')", [username]);
      }
      try {
        await query("UPDATE radacct SET acctstoptime = CURRENT_TIMESTAMP, acctterminatecause = 'Admin Reset' WHERE username = ? AND acctstoptime IS NULL", [username]);
      } catch (e) {}
      sendRadiusDisconnect(username, '100.100.100.10');
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
    
    try {
      await query("UPDATE radacct SET acctstoptime = CURRENT_TIMESTAMP WHERE username = ? AND acctstoptime IS NULL", [username]);
    } catch (e) {}

    sendRadiusDisconnect(username, '100.100.100.10');
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
