export type UserRole = 'ADMIN' | 'OWNER' | 'SALES' | 'GUDANG' | 'DRIVER' | 'KASIR' | 'SUPERVISOR_KASIR' | 'SUPER_ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  roles: UserRole[];
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser;
}

export const ROLE_APP_MAP: Record<string, UserRole[]> = {
  web:          ['ADMIN', 'OWNER', 'SUPER_ADMIN'],
  'sales-app':  ['SALES', 'ADMIN', 'OWNER', 'SUPER_ADMIN'],
  'gudang-app': ['GUDANG', 'ADMIN', 'OWNER', 'SUPER_ADMIN'],
  'driver-app': ['DRIVER', 'ADMIN', 'OWNER', 'SUPER_ADMIN'],
  'pos-app':    ['KASIR', 'SUPERVISOR_KASIR', 'ADMIN', 'OWNER', 'SUPER_ADMIN'],
};
