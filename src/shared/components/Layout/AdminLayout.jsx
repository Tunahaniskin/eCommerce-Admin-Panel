import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/auth/context/AuthContext';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const canManageRoles = hasPermission('roles.manage') || hasPermission('*');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>eCommerce<span>Admin</span></h2>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <div className="icon">📊</div>
            <span className="label">Dashboard</span>
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <div className="icon">🛍️</div>
            <span className="label">Products</span>
          </NavLink>
          <NavLink to="/categories" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <div className="icon">📂</div>
            <span className="label">Categories</span>
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <div className="icon">👥</div>
            <span className="label">Users</span>
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <div className="icon">📦</div>
            <span className="label">Orders</span>
          </NavLink>
          {canManageRoles && (
            <NavLink to="/roles" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <div className="icon">🛡️</div>
              <span className="label">Roles</span>
            </NavLink>
          )}
          {hasPermission('finance.view') && (
            <NavLink to="/finance/tickets" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <div className="icon">💰</div>
              <span className="label">Finance</span>
            </NavLink>
          )}
          <NavLink to="/logs" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <div className="icon">📋</div>
            <span className="label">Logs</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} style={{ marginBottom: '8px' }}>
            <div className="icon">⚙️</div>
            <span className="label">Profile & Settings</span>
          </NavLink>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-header glass">
          <div className="header-search">
          </div>
          <div className="user-profile" onClick={() => navigate('/profile')} style={{ cursor: 'pointer', transition: 'all 0.2s ease' }} title="Profile Settings">
            <div className="avatar">{user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'}</div>
            <div className="user-info">
              <span className="user-name">{user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.email?.split('@')[0] || 'Admin User')}</span>
              <span className="user-role">{user?.role?.name || 'SuperAdmin'}</span>
            </div>
          </div>
        </header>
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
