import { NextResponse, type NextRequest } from 'next/server';
import { resolveSessionSecret } from '@/features/admin-auth/authEnvironment';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/features/admin-auth/session';

const LOGIN_PATH = '/panel';
const PANEL_HOME_PATH = '/admin/products';

const isAdminPath = (pathname: string) =>
  pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/store' || pathname.startsWith('/store/');

const isApiPath = (pathname: string) => pathname === '/api' || pathname.startsWith('/api/');

export const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  if (isApiPath(pathname)) {
    return NextResponse.json({ error: 'A API local não está disponível neste navegador.' }, { status: 503 });
  }

  const hasValidSession = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
    resolveSessionSecret(process.env),
    Date.now(),
  );

  if (pathname === LOGIN_PATH && hasValidSession) return NextResponse.redirect(new URL(PANEL_HOME_PATH, request.url));
  if (isAdminPath(pathname) && !hasValidSession) return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  return NextResponse.next();
};

export const config = {
  matcher: ['/admin/:path*', '/panel', '/store', '/api/:path*'],
};
