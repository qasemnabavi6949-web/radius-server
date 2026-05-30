import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: any }) {
  try {
    await initDb();
    const resolvedParams = await params;
    const username = resolvedParams?.username;
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const body = await req.json();
    const password = body.password || '';
    const staticIp = body.staticIp || '';
    const firstName = body.name || '';
    const lastName = body.family || '';
    const phone = body.phone || '';
    const email = body.email || '';
    const address = body.address || '';
    const nationalId = body.nationalId || '';
    const expiration = body.expiration || '';
    const group = body.group || '';

    const finalExpiration = expiration && expiration !== '' ? expiration : '2026-12-31';

    await query(
      `UPDATE dashboard_users SET 
        password = ?, staticIp = ?, firstName = ?, lastName = ?, phone = ?, 
        email = ?, address = ?, nationalId = ?, expiration = ?, \`group\` = ? 
       WHERE username = ?`,
      [password, staticIp, firstName, lastName, phone, email, address, nationalId, finalExpiration, group, username]
    );

    if (group !== '') {
      await query(`UPDATE radusergroup SET groupname = ? WHERE username = ?`, [group, username]);
    }

    if (finalExpiration && finalExpiration !== '2026-12-31') {
      const formattedDate = new Date(finalExpiration);
      if (!isNaN(formattedDate.getTime())) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const radiusDate = `${formattedDate.getDate().toString().padStart(2, '0')} ${months[formattedDate.getMonth()]} ${formattedDate.getFullYear()}`;
        await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Expiration'`, [username]);
        await query(`INSERT INTO radcheck (username, attribute, op, value) VALUES (?, 'Expiration', '==', ?)`, [username, radiusDate]);
      }
    } else {
      await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Expiration'`, [username]);
    }

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
