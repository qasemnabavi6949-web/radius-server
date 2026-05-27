import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export async function POST(req: Request, { params }: { params: any }) {
  try {
    await initDb();
    const resolvedParams = await params;
    const username = resolvedParams?.username;
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const body = await req.json();
    const amountMb = parseFloat(body.traffic) || 0;
    const target = body.target || 'Download + Upload';
    const comment = body.comment || '';
    const addedBytes = amountMb * 1024 * 1024;

    const userRows: any = await query(`SELECT dataLimitBytes FROM dashboard_users WHERE username = ?`, [username]);
    if (!userRows || userRows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const currentBytes = parseInt(userRows[0].dataLimitBytes) || 0;
    
    // محاسبه حجم جدید (پشتیبانی از مقادیر منفی برای کاهش حجم)
    const newBytes = Math.max(0, currentBytes + addedBytes);
    const newString = `${(newBytes / 1024 / 1024).toFixed(2)} MB`;

    // بروزرسانی دیتابیس پنل و رادیوس
    await query(`UPDATE dashboard_users SET dataLimitBytes = ?, dataLimitString = ?, accountStatus = 'Active', note = ? WHERE username = ?`, [newBytes, newString, comment, username]);
    await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type' AND value = 'Reject'`, [username]);
    await query(`DELETE FROM radacct WHERE username = ?`, [username]);

    return NextResponse.json({ success: true, message: 'Traffic updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
