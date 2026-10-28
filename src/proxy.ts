import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/features/admin-auth/session';

const LOGIN_PATH = '/panel';
const PANEL_HOME_PATH = '/admin/produtos';

const isAdminPath = (pathname: string) => pathname === '/admin' || pathname.startsWith('/admin/');

export const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const hasValidSession = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
    process.env.SESSION_SECRET,
    process.env.ADMIN_PASSWORD_HASH,
    Date.now(),
  );

  if (pathname === LOGIN_PATH && hasValidSession) return NextResponse.redirect(new URL(PANEL_HOME_PATH, request.url));
  if (isAdminPath(pathname) && !hasValidSession) return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  return NextResponse.next();
};

export const config = {
  matcher: ['/admin/:path*', '/panel'],
};
