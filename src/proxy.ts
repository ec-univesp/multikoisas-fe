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
  'loja',
  'imagemloja',
  'user',
]);

const isAdminPath = (pathname: string) =>
  pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/store' || pathname.startsWith('/store/');

const isApiPath = (pathname: string) => pathname === '/api' || pathname.startsWith('/api/');

const isPanelWritableResource = (pathname: string) => PANEL_WRITABLE_RESOURCES.has(pathname.split('/')[2] ?? '');

const signInToSave = () => NextResponse.json({ error: 'Entre no painel para salvar.' }, { status: 401 });

// The site cookies (session and api token) never travel to the api.
const headersWithoutCookies = (request: NextRequest) => {
  const headers = new Headers(request.headers);
  headers.delete('cookie');
  return headers;
};

const forwardWithoutCookies = (request: NextRequest) =>
  NextResponse.next({ request: { headers: headersWithoutCookies(request) } });

const forwardWithApiToken = (request: NextRequest) => {
  const apiToken = request.cookies.get(API_TOKEN_COOKIE_NAME)?.value;
  if (!apiToken) return signInToSave();
  const headers = headersWithoutCookies(request);
  headers.set('authorization', `Bearer ${apiToken}`);
  return NextResponse.next({ request: { headers } });
};

// The api keeps every /user route, reads included, for admins.
const isAdminOnlyRead = (pathname: string) => pathname.split('/')[2] === 'user';

const isFromAnotherSite = (request: NextRequest) => {
  const origin = request.headers.get('origin');
  return origin !== null && origin !== request.nextUrl.origin;
};

export const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const isPublicRead = isApiPath(pathname) && READ_METHODS.has(request.method) && !isAdminOnlyRead(pathname);
  if (isPublicRead) return forwardWithoutCookies(request);

  const hasValidSession =
    request.cookies.has(API_TOKEN_COOKIE_NAME) &&
    (await verifySessionToken(
      request.cookies.get(SESSION_COOKIE_NAME)?.value,
      resolveSessionSecret(process.env),
      Date.now(),
    ));

  if (isApiPath(pathname) && READ_METHODS.has(request.method)) {
    return hasValidSession ? forwardWithApiToken(request) : signInToSave();
  }
  if (isApiPath(pathname)) {
    if (isFromAnotherSite(request)) return NextResponse.json({ error: 'Gravação não permitida.' }, { status: 403 });
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
