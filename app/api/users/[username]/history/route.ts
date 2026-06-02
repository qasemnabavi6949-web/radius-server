import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export async function GET(req: Request, { params }: { params: any }) {
  try {
    await initDb();
    const resolvedParams = await params;
    const username = resolvedParams?.username;
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const rows = await query(
      "SELECT action, details, DATE_FORMAT(created_at, '%Y-%m-%d %H:%I:%S') AS date FROM dashboard_history WHERE username = ? ORDER BY id DESC",
      [username]
    );

    return NextResponse.json({ success: true, data: rows || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
