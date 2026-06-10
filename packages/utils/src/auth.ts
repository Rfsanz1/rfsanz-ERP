import type { UserRole } from '@gm/types';

const TOKEN_KEY = 'erp_token';
const REFRESH_KEY = 'erp_refresh_token';
const ROLE_COOKIE = 'erp_role';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_KEY, refreshToken);
  document.cookie = `${TOKEN_KEY}=${accessToken}; path=/; SameSite=Strict`;
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; Max-Age=0`;
  document.cookie = `${ROLE_COOKIE}=; path=/; Max-Age=0`;
}

export function setRoleCookie(roles: UserRole[]): void {
  if (typeof window === 'undefined') return;
  document.cookie = `${ROLE_COOKIE}=${JSON.stringify(roles)}; path=/; SameSite=Strict`;
}

export function hasRole(userRoles: UserRole[], allowedRoles: UserRole[]): boolean {
  return allowedRoles.some((r) => userRoles.includes(r));
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getRolesFromToken(token: string): UserRole[] {
  const payload = decodeJwtPayload(token);
  if (!payload) return [];
  const roles = payload.roles ?? payload.role ?? [];
  return Array.isArray(roles) ? (roles as UserRole[]) : [roles as UserRole];
}
