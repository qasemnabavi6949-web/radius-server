import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDb();
    // لود کردن داده‌ها و ساخت متغیرهای دقیق مورد نیاز فرانت‌اَند برای جلوگیری از نمایش Unlimited و صفر
    const users = await query(`
      SELECT 
        *, 
        COALESCE(dataLimitString, '0.00 MB') as remainingStr,
        COALESCE(daily_usage, '0.00 MB') as daily_usage
      FROM dashboard_users 
      ORDER BY id DESC
    `);
    return NextResponse.json(users || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
