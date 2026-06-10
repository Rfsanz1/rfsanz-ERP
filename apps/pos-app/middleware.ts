import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/unauthorized', '/_next', '/favicon', '/api/auth'];
const ALLOWED_ROLES = ['KASIR', 'SUPERVISOR_KASIR', 'ADMIN', 'OWNER', 'SUPER_ADMIN'];

function getRolesFromCookie(req: NextRequest): string[] {
  const raw = req.cookies.get('erp_roles')?.value;
  if (!raw) return [];
  try { return JSON.parse(decodeURIComponent(raw)); } catch { return []; }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  const token = req.cookies.get('erp_token')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));
  const roles = getRolesFromCookie(req);
  if (!roles.some((r) => ALLOWED_ROLES.includes(r))) return NextResponse.redirect(new URL('/unauthorized', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
