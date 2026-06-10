export interface CanAccessOptions {
  roles?: string[];
  permissions?: string[];
}

export function canAccess(user: any, options?: CanAccessOptions) {
  if (!user) {
    return false;
  }

  const roles: string[] = (Array.isArray(user.roles) ? user.roles : []).map((r: string) => r.toLowerCase());
  const permissions: string[] = Array.isArray(user.permissions) ? user.permissions : [];

  if (roles.includes('super admin') || roles.includes('admin')) {
    return true;
  }

  if (options?.roles && options.roles.some((role) => roles.includes(role.toLowerCase()))) {
    return true;
  }

  if (options?.permissions && options.permissions.every((permission) => permissions.includes(permission))) {
    return true;
  }

  return !options || (!options.roles && !options.permissions);
}
