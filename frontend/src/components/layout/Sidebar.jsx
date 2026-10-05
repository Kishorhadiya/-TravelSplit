import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Plane, Users, CreditCard, Bell, User, LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getAvatarColor } from '../../utils/helpers';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/trips', icon: Plane, label: 'My Trips' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/analytics', icon: CreditCard, label: 'Analytics' },
];

const profileItems = [
  { to: '/profile', icon: User, label: 'Profile Settings' },
];

const Sidebar = ({ mobileOpen, onClose, notificationCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const API_BASE = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'show' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="sidebar-logo-text">✈ TravelSplit</div>
              <div className="sidebar-tagline">Travel smarter together</div>
            </div>
            <button className="btn btn-ghost btn-icon mobile-close-btn" onClick={onClose} id="sidebar-close-btn">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>

          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => mobileOpen && onClose()}
            >
              <Icon className="nav-item-icon" size={18} />
              {label}
            </NavLink>
          ))}

          <div className="nav-section-label">Account</div>

          {profileItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => mobileOpen && onClose()}
            >
              <Icon className="nav-item-icon" size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => { navigate('/profile'); onClose && onClose(); }}>
            <div
              className="avatar avatar-sm"
              style={{ background: getAvatarColor(user?.name || 'User') }}
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage.startsWith('http') ? user.profileImage : `${API_BASE}${user.profileImage}`}
                  alt={user?.name || 'User'}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : null}
              {getInitials(user?.name || 'User')}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'Kishor Hadiya'}</div>
              <div className="sidebar-user-email">{user?.email || 'user@example.com'}</div>
            </div>
          </div>

          <button
            className="btn btn-ghost btn-sm w-full mt-2"
            onClick={handleLogout}
            style={{ justifyContent: 'flex-start', gap: '10px', color: 'var(--text-secondary)' }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
