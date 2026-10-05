import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Plane, Users, CreditCard, Bell, Menu } from 'lucide-react';

const mobileNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/trips', icon: Plane, label: 'Trips' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/settlements', icon: CreditCard, label: 'Settle' },
  { to: '/notifications', icon: Bell, label: 'Alerts' },
];

const MobileNavigation = ({ onMenuOpen, notificationCount = 0 }) => {
  return (
    <nav className="mobile-bottom-nav">
      {mobileNavItems.map(({ to, icon: Icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <div style={{ position: 'relative' }}>
            <Icon size={22} />
            {label === 'Alerts' && notificationCount > 0 && (
              <div className="notification-dot" />
            )}
          </div>
          {label}
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileNavigation;
