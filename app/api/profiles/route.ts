import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    const rows = await query('SELECT DISTINCT name FROM dashboard_profiles WHERE name IS NOT NULL AND name != ""');
    return NextResponse.json(rows || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ success: true });
}
