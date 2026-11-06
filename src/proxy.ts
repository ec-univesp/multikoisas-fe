import { NextResponse, type NextRequest } from 'next/server';
import { resolveSessionSecret } from '@/features/admin-auth/authEnvironment';
import { API_TOKEN_COOKIE_NAME, SESSION_COOKIE_NAME, verifySessionToken } from '@/features/admin-auth/session';

const LOGIN_PATH = '/panel';
const PANEL_HOME_PATH = '/admin/products';
const READ_METHODS = new Set(['GET', 'HEAD']);
const PANEL_WRITABLE_RESOURCES = new Set([
  'produto',
  'categoria',
  'categoriaproduto',
  'imagem',
  'canalvenda',
  'canalvendaproduto',
  'socialnetwork',
]);

const isAdminPath = (pathname: string) =>
  pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/store' || pathname.startsWith('/store/');

const isApiPath = (pathname: string) => pathname === '/api' || pathname.startsWith('/api/');

const isPanelWritableResource = (pathname: string) => PANEL_WRITABLE_RESOURCES.has(pathname.split('/')[2] ?? '');

const signInToSave = () => NextResponse.json({ error: 'Entre no painel para salvar.' }, { status: 401 });

const forwardWithApiToken = (request: NextRequest) => {
  const apiToken = request.cookies.get(API_TOKEN_COOKIE_NAME)?.value;
  if (!apiToken) return signInToSave();
  const headers = new Headers(request.headers);
  headers.set('authorization', `Bearer ${apiToken}`);
  return NextResponse.next({ request: { headers } });
};

export const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  if (isApiPath(pathname) && READ_METHODS.has(request.method)) return NextResponse.next();

  const hasValidSession = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
    resolveSessionSecret(process.env),
    Date.now(),
  );

  if (isApiPath(pathname)) {
    if (!hasValidSession) return signInToSave();
    if (!isPanelWritableResource(pathname))
      return NextResponse.json({ error: 'Gravação não permitida.' }, { status: 403 });
    return forwardWithApiToken(request);
  }
  if (pathname === LOGIN_PATH && hasValidSession) return NextResponse.redirect(new URL(PANEL_HOME_PATH, request.url));
  if (isAdminPath(pathname) && !hasValidSession) return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  return NextResponse.next();
};

export const config = {
  matcher: ['/admin/:path*', '/panel', '/store', '/api/:path*'],
};
