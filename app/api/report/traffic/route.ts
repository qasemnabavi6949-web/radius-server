export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export async function GET(req: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ data: [] });
    }

    // استخراج دقیق مصرف روزانه کاربر از پکت‌های ردیوس میکروتیک
    const trafficData = await query(`
      SELECT 
        DATE(acctstarttime) as day,
        SUM(COALESCE(acctinputoctets, 0)) as upload_bytes,
        SUM(COALESCE(acctoutputoctets, 0)) as download_bytes,
        SUM(COALESCE(acctinputoctets, 0) + COALESCE(acctoutputoctets, 0)) as total_bytes
      FROM radacct
      WHERE username = ?
      GROUP BY DATE(acctstarttime)
      ORDER BY day DESC
    `, [username]);

    return NextResponse.json({ data: trafficData || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
