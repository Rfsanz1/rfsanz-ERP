export const ERP_ROLES = ['Super Admin', 'Owner', 'Admin', 'Sales', 'Gudang', 'Driver'] as const;
export type ErpRole = (typeof ERP_ROLES)[number];

export const ERP_ROLE_GROUPS = {
  ownerAdmin: ['Super Admin', 'Owner', 'Admin'] as const,
  sales: ['Sales', 'Super Admin', 'Owner', 'Admin'] as const,
  gudang: ['Gudang', 'Super Admin', 'Owner', 'Admin'] as const,
  driver: ['Driver', 'Super Admin', 'Owner', 'Admin'] as const,
};
