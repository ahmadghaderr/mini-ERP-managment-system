import { NavLink, Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { hasPermission } from '../permissions/permissions';
import { api } from '../services/api';
import type { CurrentUser, NavItem, UserAvatarProps, UserSummaryProps } from '../../types/appLayout';
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
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((response) => setUser(response.data))
      .catch(() => {
        localStorage.removeItem('accessToken');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role;

  function handleLogout() {
    localStorage.removeItem('accessToken');
    navigate('/login');
  }

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.requires || hasPermission(role, item.requires)
  );

  const allNavItems = hasPermission(role, 'users:manage')
    ? [...visibleNavItems, { to: '/users', label: 'Users' }]
    : visibleNavItems;

  const currentPage =
    allNavItems.find((item) => location.pathname.startsWith(item.to))?.label ?? 'Dashboard';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">Mini ERP</div>
        <nav className="sidebar-nav">
          {allNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <UserAvatar name={user.userName} variant="sidebar" />
            <div className="sidebar-user-details">
              <UserSummary name={user.userName} role={user.role} variant="sidebar" />
            </div>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-breadcrumb">
              <span className="topbar-breadcrumb-eyebrow">Mini ERP</span>
              <span className="topbar-breadcrumb-page">{currentPage}</span>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-user">
              <UserAvatar name={user.userName} variant="topbar" />
              <div className="topbar-user-info">
                <UserSummary name={user.userName} role={user.role} variant="topbar" />
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