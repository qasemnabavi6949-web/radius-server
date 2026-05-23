import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: any }) {
  try {
    await initDb();
    const resolvedParams = await params;
    const username = resolvedParams?.username;
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const body = await req.json();

    // اگر درخواست فقط برای اضافه کردن ترافیک باشد (Add Traffic)
    if (body.traffic && Object.keys(body).length <= 2) {
      const addedMegabytes = parseFloat(body.traffic) || 0;
      const addedBytes = addedMegabytes * 1024 * 1024;

      // دریافت حجم فعلی
      const userRows: any = await query(`SELECT dataLimitBytes FROM dashboard_users WHERE username = ?`, [username]);
      const currentBytes = parseInt(userRows[0]?.dataLimitBytes) || 0;
      
      const newBytes = currentBytes + addedBytes;
      const newString = `${(newBytes / 1024 / 1024).toFixed(2)} MB`;

      await query(`UPDATE dashboard_users SET dataLimitBytes = ?, dataLimitString = ?, accountStatus = 'Active' WHERE username = ?`, [newBytes, newString, username]);
      await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type' AND value = 'Reject'`, [username]);

      return NextResponse.json({ success: true, message: 'Traffic added successfully' });
    }

    // کدهای پیش فرض ویرایش معمولی کاربر در پنل شما
    const { firstName, lastName, phone, password, staticIp, speedLimit } = body;
    await query(`
      UPDATE dashboard_users 
      SET firstName = ?, lastName = ?, phone = ?, password = ?, staticIp = ?, speedLimit = ?
      WHERE username = ?
    `, [firstName || '', lastName || '', phone || '', password, staticIp || null, speedLimit || 'Default', username]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: any }) {
  try {
    await initDb();
    const resolvedParams = await params;
    const username = resolvedParams?.username;
    await query(`DELETE FROM dashboard_users WHERE username = ?`, [username]);
    await query(`DELETE FROM radcheck WHERE username = ?`, [username]);
    await query(`DELETE FROM radreply WHERE username = ?`, [username]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
