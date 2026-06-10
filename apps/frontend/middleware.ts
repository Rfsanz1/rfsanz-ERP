import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/unauthorized', '/_next', '/favicon', '/api/auth', '/offline', '/install'];

const ROLE_PATHS: Record<string, string[]> = {
  '/sales':  ['admin', 'owner', 'super admin', 'sales'],
  '/gudang': ['admin', 'owner', 'super admin', 'gudang', 'warehouse'],
  '/driver': ['admin', 'owner', 'super admin', 'driver'],
};

const ADMIN_ROLES = ['admin', 'owner', 'super admin', 'administrator'];

function getCookie(req: NextRequest, name: string): string | undefined {
  return req.cookies.get(name)?.value;
}

function getRolesFromCookie(req: NextRequest): string[] {
  const raw = getCookie(req, 'erp_roles');
  if (!raw) return [];
  try { return (JSON.parse(decodeURIComponent(raw)) as string[]).map(r => r.toLowerCase()); }
  catch { return []; }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = getCookie(req, 'erp_token');
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const roles = getRolesFromCookie(req);

  for (const [basePath, allowedRoles] of Object.entries(ROLE_PATHS)) {
    if (pathname === basePath || pathname.startsWith(basePath + '/')) {
      const hasAccess = roles.some(r => allowedRoles.includes(r));
      if (!hasAccess) return NextResponse.redirect(new URL('/unauthorized', req.url));
      return NextResponse.next();
    }
  }

  const hasAdminAccess = roles.some(r => ADMIN_ROLES.includes(r));
  if (!hasAdminAccess) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
