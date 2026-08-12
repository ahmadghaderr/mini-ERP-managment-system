export type Role = 'admin' | 'warehouse_manager' | 'staff';

export type Action =
  | 'warehouses:view'
  | 'warehouses:manage'
  | 'products:view'
  | 'products:manage'
  | 'inventory:view'
  | 'ledger:view'
  | 'invoices:view'
  | 'invoices:upload'
  | 'invoices:approve'
  | 'orders:view'
  | 'orders:upload'
  | 'orders:confirm'
  | 'supplier-orders:view'
  | 'supplier-orders:create'
  | 'supplier-orders:approve'
  | 'transfers:view'
  | 'transfers:create'
  | 'transfers:approve'
  | 'users:manage';

const ROLE_PERMISSIONS: Record<Exclude<Role, 'admin'>, Action[]> = {
  warehouse_manager: [
    'warehouses:view',
    'products:view',
    'inventory:view',
    'ledger:view',
    'invoices:view',
    'invoices:approve',
    'orders:view',
    'orders:confirm',
    'supplier-orders:view',
    'supplier-orders:create',
    'supplier-orders:approve',
    'transfers:view',
    'transfers:create',
    'transfers:approve',
  ],
  staff: [
    'inventory:view',
    'ledger:view',
    'invoices:view',
    'invoices:upload',
    'orders:view',
    'orders:upload',
    'supplier-orders:view',
    'supplier-orders:create',
    'transfers:view',
    'transfers:create',
  ],
};

export function hasPermission(role: Role, action: Action): boolean {
  if (role === 'admin') return true;
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}