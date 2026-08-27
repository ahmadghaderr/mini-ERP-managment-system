export type Role = 'admin' | 'manager' | 'staff';

export type Action =
  | 'warehouses:view'
  | 'warehouses:manage'
  | 'products:view'
  | 'products:manage'
  | 'inventory:view'
  | 'inventory:adjust'
  | 'ledger:view'
  | 'invoices:view'
  | 'invoices:upload'
  | 'invoices:approve'
  | 'orders:view'
  | 'orders:upload'
  | 'orders:confirm'
  | 'transfers:view'
  | 'transfers:create'
  | 'transfers:approve'
  | 'users:manage'
  | 'dashboard:view'
  | 'dashboard:revenue'
  | 'dashboard:financials';

const ROLE_PERMISSIONS: Record<Exclude<Role, 'admin'>, Action[]> = {
  manager: [
    'warehouses:view',
    'warehouses:manage',
    'products:view',
    'products:manage',
    'inventory:view',
    'inventory:adjust',
    'ledger:view',
    'invoices:view',
    'invoices:upload',
    'invoices:approve',
    'orders:view',
    'orders:upload',
    'orders:confirm',
    'transfers:view',
    'transfers:create',
    'transfers:approve',
    'dashboard:view',
    'dashboard:revenue',
    'dashboard:financials',
  ],
  staff: [
    'warehouses:view',
    'products:view',
    'inventory:view',
    'ledger:view',
    'invoices:view',
    'invoices:upload',
    'orders:view',
    'orders:upload',
    'dashboard:view',
    'dashboard:revenue',
  ],
};

export function hasPermission(role: Role, action: Action): boolean {
  if (role === 'admin') return true;
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}