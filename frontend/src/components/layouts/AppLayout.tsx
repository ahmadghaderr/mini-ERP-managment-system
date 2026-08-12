import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { hasPermission } from '../permissions/permissions';
import type { Role, Action } from '../permissions/permissions';
import './applayout.css';

interface NavItem {
  to: string;
  label: string;
  requires?: Action;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/warehouses', label: 'Warehouses', requires: 'warehouses:view' },
  { to: '/products', label: 'Products', requires: 'products:view' },
  { to: '/inventory', label: 'Inventory', requires: 'inventory:view' },
  { to: '/ledger', label: 'Ledger', requires: 'ledger:view' },
  { to: '/invoices', label: 'Supplier Invoices', requires: 'invoices:view' },
  { to: '/supplier-orders', label: 'Supplier Orders', requires: 'supplier-orders:view' },
  { to: '/orders', label: 'Customer Orders', requires: 'orders:view' },
  { to: '/transfers', label: 'Transfers', requires: 'transfers:view' },
];

export default function AppLayout() {
  const userJson = localStorage.getItem('currentUser');
  const user = userJson ? JSON.parse(userJson) : null;
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role as Role;

  function handleLogout() {
    localStorage.removeItem('currentUser');
    navigate('/login');
  }

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.requires || hasPermission(role, item.requires)
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">Mini ERP</div>
        <nav className="sidebar-nav">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
            >
              {item.label}
            </NavLink>
          ))}
          {hasPermission(role, 'users:manage') && (
            <NavLink
              to="/users"
              className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
            >
              Users
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <div className="sidebar-avatar">{getInitials(user.fullName)}</div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{user.fullName}</span>
              <span className="sidebar-user-role">{user.role}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-breadcrumb">
               <span>Dashboard</span>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-search">
              <input type="text" placeholder="Search..." />
            </div>
            <div className="topbar-user">
              <div className="topbar-user-avatar">{getInitials(user.fullName)}</div>
              <div className="topbar-user-info">
                <span className="topbar-user-name">{user.fullName}</span>
                <span className="topbar-user-role">{user.role}</span>
              </div>
              <button className="topbar-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="page-content">
          <div className="page-header">
            <h1 className="page-title">Welcome back, {user.fullName}</h1>
            <div className="page-actions">
              <button className="page-action-btn secondary">Export</button>
              <button className="page-action-btn primary">+ New</button>
            </div>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}