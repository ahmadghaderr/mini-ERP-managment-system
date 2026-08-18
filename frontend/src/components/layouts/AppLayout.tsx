import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { decodeToken } from '../../lib/cognito';
import { hasPermission } from '../permissions/permissions';
import type { NavItem, UserAvatarProps, UserSummaryProps } from '../../types/appLayout';
import type { Role } from '../permissions/permissions';
import './AppLayout.css';

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/warehouses', label: 'Warehouses', requires: 'warehouses:view' },
  { to: '/products', label: 'Products', requires: 'products:view' },
  { to: '/inventory', label: 'Inventory', requires: 'inventory:view' },
  { to: '/ledger', label: 'Ledger', requires: 'ledger:view' },
  { to: '/invoices', label: 'Supplier Invoices', requires: 'invoices:view' },
  { to: '/orders', label: 'Customer Orders', requires: 'orders:view' },
  { to: '/transfers', label: 'Transfers', requires: 'transfers:view' },
];

const NAV_ICONS: Record<string, JSX.Element> = {
  '/dashboard': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  '/warehouses': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" />
    </svg>
  ),
  '/products': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" />
    </svg>
  ),
  '/inventory': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="M7 15l4-5 3 3 5-7" />
    </svg>
  ),
  '/ledger': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  ),
  '/invoices': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 15h6M9 11h6" />
    </svg>
  ),
  '/orders': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 10h8M8 14h5" />
    </svg>
  ),
  '/transfers': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m17 2 4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  '/users': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function UserAvatar({ name, variant }: UserAvatarProps) {
  const className = variant === 'sidebar' ? 'sidebar-avatar' : 'topbar-user-avatar';
  return <div className={className}>{getInitials(name)}</div>;
}

function UserSummary({ name, role, variant }: UserSummaryProps) {
  const nameClass = variant === 'sidebar' ? 'sidebar-user-name' : 'topbar-user-name';
  const roleClass = variant === 'sidebar' ? 'sidebar-user-role' : 'topbar-user-role';
  return (
    <>
      <span className={nameClass}>{name}</span>
      <span className={roleClass}>{role}</span>
    </>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();

  const idToken = localStorage.getItem('idToken');
  if (!idToken) {
    return <Navigate to="/login" replace />;
  }

  const payload = decodeToken(idToken);
  const email = (payload.email as string) ?? 'unknown';
  const groups = (payload['cognito:groups'] as string[]) ?? [];
  const role = (groups[0] ?? 'staff') as Role;
  const displayName = email.split('@')[0];

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    navigate('/login');
  }

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.requires || hasPermission(role, item.requires)
  );

  const allNavItems = hasPermission(role, 'users:manage')
    ? [...visibleNavItems, { to: '/users', label: 'Users' }]
    : visibleNavItems;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 2 7l10 5 10-5-10-5Z" /><path d="M2 17l10 5 10-5" />
            </svg>
          </span>
          StockPilot
        </div>
        <nav className="sidebar-nav">
          {allNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
            >
              <span className="sidebar-link-icon">{NAV_ICONS[item.to]}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <UserAvatar name={displayName} variant="sidebar" />
            <div className="sidebar-user-details">
              <UserSummary name={displayName} role={role} variant="sidebar" />
            </div>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-right">
            <div className="topbar-user">
              <UserAvatar name={displayName} variant="topbar" />
              <div className="topbar-user-info">
                <UserSummary name={displayName} role={role} variant="topbar" />
              </div>
              <button className="topbar-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}