import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export async function GET(req: Request, { params }: { params: any }) {
  try {
    await initDb();
    // لود کردن ایمن پارامتر یوزرنام بر اساس ساختار Next.js جدید
    const resolvedParams = await params;
    const username = resolvedParams?.username;

    if (!username) {
      return NextResponse.json([], { status: 400 });
    }

    const history = await query(`
      SELECT 
        id, 
        username, 
        CONCAT('Profile Changed/Charged: ', COALESCE(profile, 'Standard')) as action, 
        created_at as date
      FROM dashboard_activations
      WHERE username = ?
      ORDER BY id DESC
    `, [username]);

    // تحویل مستقیم آرایه فیکس‌شده به فرانت‌اَند برای جلوگیری از ارور رندر
    return NextResponse.json(Array.isArray(history) ? history : []);
  } catch (error: any) {
    console.error('History API Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
