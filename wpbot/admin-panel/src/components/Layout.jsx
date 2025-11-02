import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.jsx';
import '../styles/layout.css';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/users', label: 'Users', icon: '🧑‍🤝‍🧑' },
  { to: '/moderation', label: 'Moderation', icon: '🛡️' },
  { to: '/groups', label: 'Groups', icon: '👥' },
  { to: '/commands', label: 'Commands', icon: '⚙️' },
  { to: '/messages', label: 'Send Message', icon: '✉️' },
  { to: '/logs', label: 'Logs', icon: '📜' },
  { to: '/settings', label: 'Settings', icon: '🔐' },
];

function Layout() {
  const location = useLocation();
  const { logout } = useAuthContext();

  const activeTitle = React.useMemo(() => {
    const match = navItems.find((item) => location.pathname.startsWith(item.to));
    return match ? match.label : 'Dashboard';
  }, [location.pathname]);

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>WhatsApp Bot Admin</h1>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Navigation</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              end={item.to === '/dashboard'}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <button type="button" className="logout-button" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <h2>{activeTitle}</h2>
          <span className="badge success">Admin</span>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
