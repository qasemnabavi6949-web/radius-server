import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // آزاد کردن کامل مسیر بررسی حجم و دیسکانکت برای اجرای خودکار سرور
  if (pathname.startsWith('/api/cron/')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
